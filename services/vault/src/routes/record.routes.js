// Vault records (bank accounts, policies, money lent, a will…) and the Bharat ID unlock that every opening, change
// and permission needs. Listing shows kinds and titles only; the fields are opened one record at a time.
import {Router} from 'express';
import {z} from 'zod';
import {NET_WORTH, netWorth, validateRecord} from '@pirento/shared';
import {badInput, decrypt, encrypt, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Record, WITHOUT_FIELDS} from '../models/Record.js';
import {Credential} from '../models/Credential.js';
import {VaultFile} from '../models/VaultFile.js';
import {findOwned} from './owned.js';
import {logAction} from '../lib/log.js';
import {requireUnlock, unlockWith} from '../lib/unlock.js';

export const recordRoutes = Router();

const seal = (fields) => encrypt(config.key, Buffer.from(JSON.stringify(fields)));
export const openFields = (r) => JSON.parse(decrypt(config.key, r.fields).toString());

/** Confirms the owner with their Bharat ID PIN; the unlock it returns lasts ten minutes. */
recordRoutes.post(
  '/unlock',
  validate(z.object({pin: z.string().regex(/^\d{6}$/, 'Enter your 6-digit PIN')})),
  async (req, res) => {
    const out = await unlockWith(req.user.sub, req.body.pin);
    await logAction(req.user.sub, 'unlock', {pin: true});
    res.set('cache-control', 'no-store').json({data: out});
  },
);

recordRoutes.get('/records', async (req, res) => {
  res.json({data: await Record.find({userId: req.user.sub}, WITHOUT_FIELDS).sort({kind: 1, title: 1})});
});

/** Net worth from the owner's records (hand-added and fetched through Digio), opened and summed on the server. */
recordRoutes.get('/networth', requireUnlock, async (req, res) => {
  const kinds = Object.values(NET_WORTH).flatMap((side) => Object.keys(side));
  const records = await Record.find({userId: req.user.sub, kind: {$in: kinds}});
  const out = netWorth(records.map((r) => ({kind: r.kind, title: r.title, fields: openFields(r)})));
  await logAction(req.user.sub, 'networth.view', {pin: true});
  res.set('cache-control', 'no-store').json({data: out});
});

const body = z.object({
  kind: z.string().max(40),
  title: z.string().max(200),
  fields: z.record(z.string(), z.string().max(4000)).default({}),
  release: z.boolean().default(false),
});

function checked({kind, title, fields}) {
  const r = validateRecord(kind, title, fields);
  if (r.error) throw badInput(r.error);
  return r.data;
}

recordRoutes.post('/records', requireUnlock, validate(body), async (req, res) => {
  const {kind, title, fields} = checked(req.body);
  const saved = await Record.create({
    userId: req.user.sub,
    kind,
    title,
    fields: seal(fields),
    release: req.body.release,
  });
  await logAction(req.user.sub, 'record.add', {target: `${kind}: ${title}`, pin: true});
  res.status(201).json({data: {_id: saved._id, kind, title, release: saved.release}});
});

recordRoutes.get('/records/:id', requireUnlock, async (req, res) => {
  const r = await findOwned(Record, req);
  await logAction(req.user.sub, 'record.open', {target: `${r.kind}: ${r.title}`, pin: true});
  res
    .set('cache-control', 'no-store')
    .json({data: {_id: r._id, kind: r.kind, title: r.title, release: r.release, fields: openFields(r)}});
});

recordRoutes.put('/records/:id', requireUnlock, validate(body), async (req, res) => {
  const r = await findOwned(Record, req);
  const {title, fields} = checked({...req.body, kind: r.kind}); // a record keeps its kind
  Object.assign(r, {title, fields: seal(fields), release: req.body.release});
  await r.save();
  await logAction(req.user.sub, 'record.change', {target: `${r.kind}: ${title}`, pin: true});
  res.json({data: {_id: r._id, kind: r.kind, title, release: r.release}});
});

recordRoutes.delete('/records/:id', requireUnlock, async (req, res) => {
  const r = await findOwned(Record, req);
  await r.deleteOne();
  await logAction(req.user.sub, 'record.delete', {target: `${r.kind}: ${r.title}`, pin: true});
  res.json({data: {deleted: true}});
});

// Whether an item goes to the nominee, for records, passwords and files alike.
const MODELS = {records: Record, credentials: Credential, files: VaultFile};
for (const [type, Model] of Object.entries(MODELS)) {
  recordRoutes.patch(
    `/${type}/:id/release`,
    requireUnlock,
    validate(z.object({release: z.boolean()})),
    async (req, res) => {
      const item = await findOwned(Model, req, {_id: 1, title: 1, label: 1, name: 1});
      await Model.updateOne({_id: item._id}, {$set: {release: req.body.release}});
      await logAction(req.user.sub, req.body.release ? 'release.allow' : 'release.withhold', {
        target: `${type}: ${item.title ?? item.label ?? item.name}`,
        pin: true,
      });
      res.json({data: {release: req.body.release}});
    },
  );
}
