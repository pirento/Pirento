// Upload, list, download and delete files.
import express, {Router} from 'express';
import {ApiError, badInput, decrypt, encrypt} from '@pirento/shared/server';
import {config} from '../config.js';
import {VaultFile, WITHOUT_BYTES} from '../models/VaultFile.js';
import {findOwned} from './owned.js';

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
    const name = decodeURIComponent(String(req.headers['x-file-name'] ?? ''))
      .trim()
      .slice(0, 200);
    if (!name || !Buffer.isBuffer(req.body) || !req.body.length) throw badInput('Choose a file to upload');

    const [{used = 0} = {}] = await VaultFile.aggregate([
      {$match: {userId: req.user.sub}},
      {$group: {_id: null, used: {$sum: '$size'}}},
    ]);
    if (used + req.body.length > config.quotaBytes) {
      throw new ApiError(413, 'QUOTA_FULL', 'Your vault is full. Delete a file first.');
    }

    const file = await VaultFile.create({
      userId: req.user.sub,
      name,
      type: String(req.headers['x-file-type'] ?? '').slice(0, 100) || undefined,
      size: req.body.length,
      ...encrypt(config.key, req.body),
    });
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
  res.send(decrypt(config.key, file));
});

fileRoutes.delete('/files/:id', async (req, res) => {
  await (await findOwned(VaultFile, req, WITHOUT_BYTES)).deleteOne();
  res.json({data: {deleted: true}});
});
