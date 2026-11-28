// What a nominee receives: the owner's name and, opened from their seals, only the records, passwords and files the
// owner set to go to the nominee. Files are listed; each is fetched on its own.
import {decrypt} from '@pirento/shared/server';
import {config} from '../config.js';
import {Record} from '../models/Record.js';
import {Credential} from '../models/Credential.js';
import {VaultFile, WITHOUT_BYTES} from '../models/VaultFile.js';

export async function releasedTo(userId) {
  const [records, credentials, files] = await Promise.all([
    Record.find({userId, release: true}).sort({kind: 1, title: 1}),
    Credential.find({userId, release: true}).sort({label: 1}),
    VaultFile.find({userId, release: true}, WITHOUT_BYTES).sort({name: 1}).lean(),
  ]);
  return {
    records: records.map((r) => ({
      _id: r._id,
      kind: r.kind,
      title: r.title,
      fields: JSON.parse(decrypt(config.key, r.fields).toString()),
    })),
    credentials: credentials.map((c) => ({
      _id: c._id,
      label: c.label,
      username: c.username,
      password: decrypt(config.key, c.secret).toString(),
    })),
    files: files.map(({_id, name, size, type, label}) => ({_id, name, size, type, label})),
  };
}
