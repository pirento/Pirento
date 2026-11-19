import express from 'express';
import mongoose from 'mongoose';
import {z} from 'zod';
import {ApiError, asyncHandler, createApp, env, finish, requireAuth, start, validate} from '@pirento/shared/server';
import {decrypt, encrypt, keyFrom} from './cipher.js';

const KEY = keyFrom(env('VAULT_ENCRYPTION_KEY', 'dev-only-vault-key'));
const MAX_FILE = 5 * 1024 * 1024;
// shortcut: files live in MongoDB documents (5 MB each, 50 MB per user); move to S3 before raising limits.
const QUOTA = 50 * 1024 * 1024;

const sealed = {iv: Buffer, tag: Buffer, data: Buffer};

const VaultFile = mongoose.model(
  'VaultFile',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      name: {type: String, required: true, maxlength: 200},
      type: {type: String, default: 'application/octet-stream'},
      size: {type: Number, required: true},
      ...sealed,
    },
    {timestamps: true},
  ),
);

const Credential = mongoose.model(
  'Credential',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      label: {type: String, required: true, maxlength: 80},
      username: {type: String, maxlength: 200},
      secret: sealed,
    },
    {timestamps: true},
  ),
);

const app = createApp('vault');
app.use(requireAuth);

const mine = async (Model, req) => {
  const doc =
    mongoose.isValidObjectId(req.params.id) && (await Model.findOne({_id: req.params.id, userId: req.user.sub}));
  if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Not found');
  return doc;
};

// ── Files ────────────────────────────────────────────────────────────────

app.get(
  '/files',
  asyncHandler(async (req, res) => {
    const files = await VaultFile.find({userId: req.user.sub}, {iv: 0, tag: 0, data: 0}).sort({createdAt: -1});
    res.json({data: {files, used: files.reduce((n, f) => n + f.size, 0), quota: QUOTA}});
  }),
);

app.post(
  '/files',
  // The browser always sends octet-stream (so the JSON parser never touches a .json file); the real type is in x-file-type.
  express.raw({type: 'application/octet-stream', limit: MAX_FILE}),
  asyncHandler(async (req, res) => {
    const name = decodeURIComponent(String(req.headers['x-file-name'] ?? ''))
      .trim()
      .slice(0, 200);
    if (!name || !Buffer.isBuffer(req.body) || !req.body.length) {
      throw new ApiError(400, 'INVALID_INPUT', 'Choose a file to upload');
    }
    const [{used = 0} = {}] = await VaultFile.aggregate([
      {$match: {userId: req.user.sub}},
      {$group: {_id: null, used: {$sum: '$size'}}},
    ]);
    if (used + req.body.length > QUOTA)
      throw new ApiError(413, 'QUOTA_FULL', 'Your vault is full. Delete a file first.');
    const file = await VaultFile.create({
      userId: req.user.sub,
      name,
      type: String(req.headers['x-file-type'] ?? '').slice(0, 100) || undefined,
      size: req.body.length,
      ...encrypt(KEY, req.body),
    });
    res
      .status(201)
      .json({data: {_id: file._id, name: file.name, size: file.size, type: file.type, createdAt: file.createdAt}});
  }),
);

app.get(
  '/files/:id',
  asyncHandler(async (req, res) => {
    const file = await mine(VaultFile, req);
    res.set({
      'content-type': 'application/octet-stream', // never rendered inline, so an uploaded HTML file cannot run
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'cache-control': 'no-store',
    });
    res.send(decrypt(KEY, file));
  }),
);

app.delete(
  '/files/:id',
  asyncHandler(async (req, res) => {
    await (await mine(VaultFile, req)).deleteOne();
    res.json({data: {deleted: true}});
  }),
);

// ── Passwords ────────────────────────────────────────────────────────────

app.get(
  '/credentials',
  asyncHandler(async (req, res) => {
    res.json({data: await Credential.find({userId: req.user.sub}, {secret: 0}).sort({label: 1})});
  }),
);

app.post(
  '/credentials',
  validate(
    z.object({
      label: z.string().trim().min(1, 'Name this entry').max(80),
      username: z.string().trim().max(200).default(''),
      password: z.string().min(1, 'Enter the password').max(500),
    }),
  ),
  asyncHandler(async (req, res) => {
    const {label, username, password} = req.body;
    const c = await Credential.create({
      userId: req.user.sub,
      label,
      username,
      secret: encrypt(KEY, Buffer.from(password)),
    });
    res.status(201).json({data: {_id: c._id, label, username}});
  }),
);

app.get(
  '/credentials/:id/secret',
  asyncHandler(async (req, res) => {
    const c = await mine(Credential, req);
    res.set('cache-control', 'no-store').json({data: {password: decrypt(KEY, c.secret).toString()}});
  }),
);

app.delete(
  '/credentials/:id',
  asyncHandler(async (req, res) => {
    await (await mine(Credential, req)).deleteOne();
    res.json({data: {deleted: true}});
  }),
);

start(finish(app), {
  name: 'vault',
  port: Number(env('PORT', 4007)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_vault'),
});
