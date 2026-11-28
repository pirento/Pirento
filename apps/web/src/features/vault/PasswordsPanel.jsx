// Vault passwords: save, reveal, copy, delete (each after the Bharat ID unlock), which ones are weak or reused, and
// whether each goes to the nominee.
import {useState} from 'react';
import {Copy, Eye, Trash2} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {ReleaseSwitch} from './ReleaseSwitch';
import {shown, useUnlock} from './unlock';

export function Passwords() {
  const guard = useUnlock();
  const list = useApi('/vault/credentials');
  const health = useApi('/vault/credentials/health');
  const verdict = Object.fromEntries((health.data?.items ?? []).map((h) => [h._id, h]));
  const reload = () => {
    list.reload();
    health.reload();
  };
  const [form, setForm] = useState({label: '', username: '', password: ''});
  const [visible, setVisible] = useState({});
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await guard((headers) => api('/vault/credentials', {method: 'POST', body: form, headers}));
      setForm({label: '', username: '', password: ''});
      reload();
    } catch (err) {
      setError(shown(err));
    }
  };
  const reveal = async (c) => {
    if (visible[c._id]) return setVisible((s) => ({...s, [c._id]: undefined}));
    try {
      const {password} = await guard((headers) => api(`/vault/credentials/${c._id}/secret`, {headers}));
      setVisible((s) => ({...s, [c._id]: password}));
    } catch (err) {
      setError(shown(err));
    }
  };
  const copy = async (c) => {
    try {
      const {password} = await guard((headers) => api(`/vault/credentials/${c._id}/secret`, {headers}));
      await navigator.clipboard.writeText(password);
    } catch (err) {
      setError(shown(err));
    }
  };
  const remove = async (c) => {
    if (!confirm(`Delete ${c.label}?`)) return;
    try {
      await guard((headers) => api(`/vault/credentials/${c._id}`, {method: 'DELETE', headers}));
      reload();
    } catch (err) {
      setError(shown(err));
    }
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
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {c.label}
                {verdict[c._id]?.weak && <Tag>{appDashboards.vault.health.weak}</Tag>}
                {verdict[c._id]?.reused && <Tag>{appDashboards.vault.health.reused}</Tag>}
              </span>
              <span className="block truncate text-xs text-muted">
                {c.username || '—'} · <span className="font-mono">{visible[c._id] ?? '••••••••'}</span>
              </span>
              <span className="mt-2 block">
                <ReleaseSwitch type="credentials" item={c} onChange={list.reload} />
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                onClick={() => reveal(c)}
                className="rounded-full p-2 hover:bg-stone"
                aria-label={`Show password for ${c.label}`}
                aria-pressed={Boolean(visible[c._id])}
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
