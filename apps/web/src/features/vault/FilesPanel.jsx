// Vault files: upload, download, delete; a label and expiry date on each (Pirento AI can suggest labels from the
// file names alone, never the contents), and a reminder email 30 days before expiry.
import {useRef, useState} from 'react';
import {Download, FileText, Sparkles, Trash2, Upload} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {mb, raw} from './files';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

const LABELS = [
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

export function Files() {
  const files = useApi('/vault/files');
  const input = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (file.size > 5 * 1024 * 1024) return setError('Files can be up to 5 MB.');
    setBusy(true);
    try {
      await raw('/files', {
        method: 'POST',
        headers: {
          'content-type': 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name),
          'x-file-type': file.type,
        },
        body: file,
      });
      files.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const download = async (f) => {
    const url = URL.createObjectURL(await (await raw(`/files/${f._id}`)).blob());
    const a = Object.assign(document.createElement('a'), {href: url, download: f.name});
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const remove = async (f) => {
    if (!confirm(`Delete ${f.name}? This cannot be undone.`)) return;
    try {
      await api(`/vault/files/${f._id}`, {method: 'DELETE'});
      files.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const d = files.data;
  const patch = async (f, body) => {
    setError('');
    try {
      await api(`/vault/files/${f._id}`, {method: 'PATCH', body});
      files.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  /** Pirento AI labels the unlabelled files from their names; nothing inside a file is sent. */
  const autoLabel = async () => {
    const todo = d.files.filter((f) => !f.label);
    if (!todo.length) return;
    setError('');
    setBusy(true);
    try {
      const {labels} = await api('/ai/assist/label', {method: 'POST', body: {names: todo.map((f) => f.name)}});
      await Promise.all(
        todo.map((f) => {
          const label = labels.find((l) => l.name === f.name)?.label;
          return LABELS.includes(label) ? api(`/vault/files/${f._id}`, {method: 'PATCH', body: {label}}) : null;
        }),
      );
      files.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[22px] border border-rule p-8" data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Label n={1}>Files</Label>
        <input ref={input} type="file" className="sr-only" onChange={upload} aria-label="Choose a file to upload" />
        <span className="flex flex-wrap gap-2">
          {d?.files.some((f) => !f.label) && (
            <Button onClick={autoLabel} variant="outline" icon={Sparkles} disabled={busy}>
              Label with AI
            </Button>
          )}
          <Button onClick={() => input.current.click()} variant="accent" icon={Upload} disabled={busy}>
            {busy ? 'Working' : 'Upload'}
          </Button>
        </span>
      </div>
      {d && (
        <div className="mt-6">
          <div className="h-1 overflow-hidden rounded-full bg-stone" aria-hidden>
            <div className="h-full bg-ink" style={{width: `${Math.min(100, (d.used / d.quota) * 100)}%`}} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {mb(d.used)} of {mb(d.quota)} used · up to 5 MB per file
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm">
          ⚠ {error}
        </p>
      )}
      {d?.files.length === 0 && <p className="body mt-6">No files yet.</p>}
      <ul className="mt-4">
        {d?.files.map((f) => (
          <li key={f._id} className="flex items-center justify-between gap-3 border-b border-rule py-4">
            <span className="flex min-w-0 items-center gap-3">
              <FileText aria-hidden className="size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{f.name}</span>
                <span className="text-xs text-muted">
                  {mb(f.size)} · {formatDate(f.createdAt)}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <select
                    aria-label={`Label for ${f.name}`}
                    value={f.label ?? ''}
                    onChange={(e) => patch(f, {label: e.target.value})}
                    className="rounded-full border border-rule bg-paper px-3 py-1"
                  >
                    <option value="">No label</option>
                    {LABELS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-muted">
                    Expires
                    <input
                      type="date"
                      value={f.expiresOn ? f.expiresOn.slice(0, 10) : ''}
                      onChange={(e) => patch(f, {expiresOn: e.target.value})}
                      className="rounded-full border border-rule bg-paper px-3 py-1 text-ink"
                    />
                  </label>
                </span>
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                onClick={() => download(f)}
                className="rounded-full p-2 hover:bg-stone"
                aria-label={`Download ${f.name}`}
              >
                <Download aria-hidden className="size-4" />
              </button>
              <button
                onClick={() => remove(f)}
                className="rounded-full p-2 hover:bg-stone"
                aria-label={`Delete ${f.name}`}
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
