// Playing and uploading programme videos. Videos sit in S3-compatible storage: the server hands out a short-lived
// URL, and the browser plays from it or uploads straight to it.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {mb} from '../../lib/api/binary';

/** A "Watch" button that asks for a play URL, then shows the player. */
export function VideoPlayer({path, label = 'Watch the video'}) {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const load = async () => {
    setNote('');
    try {
      setUrl((await api(path)).url);
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  if (url) {
    return (
      <video controls preload="metadata" src={url} className="aspect-video w-full rounded-[14px] bg-ink">
        <track kind="captions" />
      </video>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" icon={null} onClick={load}>
        {label}
      </Button>
      {note && <p className="text-sm">{note}</p>}
    </div>
  );
}

/** Staff: pick a video, get an upload URL for it from `path`, and send it straight to storage. */
export function VideoUpload({path, current, onDone}) {
  const [note, setNote] = useState('');
  const send = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setNote(`Uploading ${mb(file.size)}… keep this page open.`);
    try {
      const {url, type} = await api(path, {method: 'POST', body: {name: file.name, type: file.type, size: file.size}});
      const res = await fetch(url, {method: 'PUT', headers: {'content-type': type}, body: file});
      if (!res.ok) throw new Error(`Storage refused the upload (${res.status})`);
      // Only now does the server attach it, after checking the bucket has it.
      await api(`${path}/confirm`, {method: 'POST'});
      setNote('Uploaded.');
      onDone?.();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="cursor-pointer rounded-full border border-rule px-4 py-2 hover:border-ink has-focus-visible:outline-2">
        {current ? 'Replace video' : 'Upload video'}
        <input type="file" accept="video/*" className="sr-only" onChange={send} />
      </label>
      {current && <span className="text-muted">{current.name}</span>}
      {note && (
        <span role="status" className="w-full">
          {note}
        </span>
      )}
    </div>
  );
}
