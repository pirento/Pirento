// Upload, list, download and delete files.
import express, {Router} from 'express';
import {z} from 'zod';
import {ApiError, badInput, dropFiles, openFile, sealFile, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {VaultFile, WITHOUT_BYTES} from '../models/VaultFile.js';
import {findOwned} from './owned.js';
import {giveRoom, takeRoom} from '../lib/quota.js';

export const fileRoutes = Router();

fileRoutes.get('/files', async (req, res) => {
  const files = await VaultFile.find({userId: req.user.sub}, WITHOUT_BYTES).sort({createdAt: -1});
  const used = files.reduce((sum, f) => sum + f.size, 0);
  res.json({data: {files, used, quota: config.quotaBytes}});
});

// The browser always sends application/octet-stream, so a .json upload is
// never mistaken for a JSON body. The real type travels in x-file-type.
fileRoutes.post(
  '/files',
  express.raw({type: 'application/octet-stream', limit: config.maxFileBytes}),
  async (req, res) => {
    let name = '';
    try {
      name = decodeURIComponent(String(req.headers['x-file-name'] ?? ''))
        .trim()
        .slice(0, 200);
    } catch {
      // A broken name (e.g. a bare "%") is treated like no name, not a server error.
    }
    if (!name || !Buffer.isBuffer(req.body) || !req.body.length) throw badInput('Choose a file to upload');

    if (!(await takeRoom(req.user.sub, req.body.length, config.quotaBytes))) {
      throw new ApiError(413, 'QUOTA_FULL', 'Your vault is full. Delete a file first.');
    }
    let file;
    try {
      file = await VaultFile.create({
        userId: req.user.sub,
        name,
        type: String(req.headers['x-file-type'] ?? '').slice(0, 100) || undefined,
        size: req.body.length,
        ...(await sealFile(config.key, req.body, `vault/${req.user.sub}`)),
      });
    } catch (err) {
      await giveRoom(req.user.sub, req.body.length);
      throw err;
    }
    const {_id, size, type, createdAt} = file;
    res.status(201).json({data: {_id, name, size, type, createdAt}});
  },
);

fileRoutes.get('/files/:id', async (req, res) => {
  const file = await findOwned(VaultFile, req);
  res.set({
    // Always a download, never rendered: an uploaded HTML file must not run on our origin.
    'content-type': 'application/octet-stream',
    'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'cache-control': 'no-store',
  });
  res.send(await openFile(config.key, file));
});

fileRoutes.delete('/files/:id', async (req, res) => {
  const file = await findOwned(VaultFile, req, WITHOUT_BYTES);
  // Room comes back only for the request that actually removed it, so a double delete gives it back once.
  const {deletedCount} = await VaultFile.deleteOne({_id: file._id});
  if (deletedCount) await Promise.all([giveRoom(req.user.sub, file.size), dropFiles([file])]);
  res.json({data: {deleted: true}});
});

export const LABELS = [
  'Aadhaar',
  'PAN',
  'Passport',
  'Driving licence',
  'Voter ID',
  'Bank',
  'Bill',
  'Agreement',
  'Certificate',
  'Insurance',
  'Tax',
  'Photo',
  'Other',
];

/** A label (chosen by hand or suggested by Pirento AI from the name) and the document's expiry date. */
fileRoutes.patch(
  '/files/:id',
  validate(
    z.object({
      label: z.enum(LABELS).or(z.literal('')).optional(),
      expiresOn: z.iso.date().or(z.literal('')).optional(),
    }),
  ),
  async (req, res) => {
    const file = await findOwned(VaultFile, req, WITHOUT_BYTES);
    const set = {};
    const unset = {};
    if (req.body.label !== undefined) (req.body.label ? set : unset).label = req.body.label || 1;
    if (req.body.expiresOn !== undefined) {
      if (req.body.expiresOn) Object.assign(set, {expiresOn: new Date(req.body.expiresOn)});
      else unset.expiresOn = 1;
      unset.expiryReminded = 1; // a new date gets its own reminder
    }
    const doc = await VaultFile.findByIdAndUpdate(
      file._id,
      {$set: set, $unset: unset},
      {new: true, projection: WITHOUT_BYTES},
    );
    res.json({data: doc});
  },
);
