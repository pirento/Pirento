// Resume files: reading an upload's name safely and sending one back as a download.
import {decrypt} from '@pirento/shared/server';
import {config} from '../config.js';

/** The browser sends the file name URI-encoded in x-file-name; a broken one counts as none. */
export function uploadName(req) {
  try {
    return decodeURIComponent(String(req.headers['x-file-name'] ?? ''))
      .trim()
      .slice(0, 200);
  } catch {
    return '';
  }
}

/** Always a download, never rendered: an uploaded HTML file must not run on our origin. */
export function sendFile(res, file) {
  res.set({
    'content-type': 'application/octet-stream',
    'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'cache-control': 'no-store',
  });
  res.send(decrypt(config.fileKey, file));
}
