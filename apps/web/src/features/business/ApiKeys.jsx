// Business dashboard: API keys. A new key is shown once; after that only its first characters.
import {useState} from 'react';
import {Copy} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';
import {AppFrame} from '../products/AppFrame';
import {DataTable} from '../admin/DataTable';

export function ApiKeys({frame, data, reload}) {
  const {business, keys} = data;
  const [label, setLabel] = useState('');
  const [fresh, setFresh] = useState(null);
  const [error, setError] = useState('');
  const live = business.status === 'live';
  const testOpen = ['test', 'live_review', 'live'].includes(business.status);

  const make = async (mode) => {
    setError('');
    try {
      setFresh(await api('/identity/business/me/keys', {method: 'POST', body: {mode, label}}));
      setLabel('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const revoke = async (id) => {
    if (!window.confirm('Revoke this key? Anything using it stops working at once.')) return;
    try {
      await api(`/identity/business/me/keys/${id}`, {method: 'DELETE'});
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppFrame
      {...frame}
      title="API / keys."
      intro="Test keys (bid_test_…) answer from the sandbox. Live keys (bid_live_…) open once our team approves live access."
    >
      {fresh && (
        <div role="status" className="max-w-3xl rounded-[18px] border border-accent p-5">
          <p className="font-medium">Copy your new {fresh.mode} key now. It is not shown again.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="min-w-0 break-all rounded-[10px] bg-stone px-3 py-2 text-sm">{fresh.key}</code>
            <Button variant="outline" icon={Copy} onClick={() => navigator.clipboard?.writeText(fresh.key)}>
              Copy
            </Button>
          </div>
        </div>
      )}
      <div className="flex max-w-3xl flex-wrap items-end gap-3">
        <div className="min-w-56 grow">
          <Field label="Label (optional)" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <Button onClick={() => make('test')} variant="outline" disabled={!testOpen}>
          New test key
        </Button>
        <Button onClick={() => make('live')} variant="accent" disabled={!live}>
          New live key
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <DataTable
        rows={keys}
        rowKey={(k) => k._id}
        empty="No keys yet."
        columns={[
          {label: 'Key', cell: (k) => <code className="text-sm">{k.prefix}…</code>},
          {label: 'Mode', cell: (k) => <Tag tone={k.mode === 'live' ? 'accent' : 'rule'}>{k.mode}</Tag>},
          {label: 'Label', cell: (k) => k.label || '—'},
          {label: 'Calls', right: true, cell: (k) => k.uses},
          {label: 'Last used', right: true, cell: (k) => (k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Never')},
          {
            label: '',
            right: true,
            cell: (k) => (
              <button type="button" onClick={() => revoke(k._id)} className="text-sm underline underline-offset-4">
                Revoke
              </button>
            ),
          },
        ]}
      />
    </AppFrame>
  );
}
