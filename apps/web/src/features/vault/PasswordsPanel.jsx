// Vault passwords: save, reveal, copy, delete.
import {useState} from 'react';
import {Copy, Eye, Trash2} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';

export function Passwords() {
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
