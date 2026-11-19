import {useRef, useState} from 'react';
import {Copy, Download, Eye, FileText, Trash2, Upload} from 'lucide-react';
import {api, authFetch, useApi} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Button, Field, Label, Section} from '../components/ui';
import {PageHero} from './Products';
import {formatDate, useSignedIn} from './Orders';

const mb = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
// Files are binary, so these skip the JSON helper.
async function raw(path, init = {}) {
  const res = await authFetch(`/api/vault${path}`, init);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? 'Something went wrong');
  return res;
}

function Files() {
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
    await api(`/vault/files/${f._id}`, {method: 'DELETE'});
    files.reload();
  };
  const d = files.data;

  return (
    <div className="rounded-[22px] border border-rule p-8" data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Label n={1}>Files</Label>
        <input ref={input} type="file" className="sr-only" onChange={upload} aria-label="Choose a file to upload" />
        <Button onClick={() => input.current.click()} variant="accent" icon={Upload} disabled={busy}>
          {busy ? 'Encrypting' : 'Upload'}
        </Button>
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

function Passwords() {
  const list = useApi('/vault/credentials');
  const [form, setForm] = useState({label: '', username: '', password: ''});
  const [shown, setShown] = useState({});
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/vault/credentials', {method: 'POST', body: form});
      setForm({label: '', username: '', password: ''});
      list.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const reveal = async (c) => {
    if (shown[c._id]) return setShown((s) => ({...s, [c._id]: undefined}));
    const {password} = await api(`/vault/credentials/${c._id}/secret`);
    setShown((s) => ({...s, [c._id]: password}));
  };
  const copy = async (c) => {
    const {password} = await api(`/vault/credentials/${c._id}/secret`);
    await navigator.clipboard.writeText(password);
  };
  const remove = async (c) => {
    if (!confirm(`Delete ${c.label}?`)) return;
    await api(`/vault/credentials/${c._id}`, {method: 'DELETE'});
    list.reload();
  };

  return (
    <div className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={2}>Passwords</Label>
      <form onSubmit={add} noValidate className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field label="Name" required value={form.label} onChange={set('label')} />
        <Field label="Username" autoComplete="off" value={form.username} onChange={set('username')} />
        <Field
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={error}
        />
        <div className="sm:col-span-3">
          <Button type="submit" variant="outline">
            Save password
          </Button>
        </div>
      </form>
      <ul className="mt-6">
        {list.data?.map((c) => (
          <li key={c._id} className="flex items-center justify-between gap-3 border-b border-rule py-4">
            <span className="min-w-0">
              <span className="block font-medium">{c.label}</span>
              <span className="block truncate text-xs text-muted">
                {c.username || '—'} · <span className="font-mono">{shown[c._id] ?? '••••••••'}</span>
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                onClick={() => reveal(c)}
                className="rounded-full p-2 hover:bg-stone"
                aria-label={`Show password for ${c.label}`}
                aria-pressed={Boolean(shown[c._id])}
              >
                <Eye aria-hidden className="size-4" />
              </button>
              <button
                onClick={() => copy(c)}
                className="rounded-full p-2 hover:bg-stone"
                aria-label={`Copy password for ${c.label}`}
              >
                <Copy aria-hidden className="size-4" />
              </button>
              <button
                onClick={() => remove(c)}
                className="rounded-full p-2 hover:bg-stone"
                aria-label={`Delete ${c.label}`}
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

export function Vault() {
  const {redirect, user} = useSignedIn();
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Pirento Vault', description: 'Files and passwords, encrypted at rest.'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Vault"
        title="Your files, / locked at rest."
        hl="locked at rest."
        intro="Everything here is encrypted with AES-256-GCM before it is stored. Pirento holds the key, so this is not end-to-end encryption."
      />
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-6 lg:grid-cols-2">
          <Files />
          <Passwords />
        </div>
      </Section>
    </div>
  );
}
