// Business dashboard: every consent asked for, test or live, and how each one stands.
import {useState} from 'react';
import {CONSENT_FIELDS} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {AppFrame} from '../products/AppFrame';
import {DataTable} from '../admin/DataTable';

export function ConsentLog({frame}) {
  const [mode, setMode] = useState('test');
  const log = useApi(`/identity/business/me/consents?mode=${mode}`);
  return (
    <AppFrame
      {...frame}
      title="Consent / log."
      intro="What you asked for, of which Bharat ID, and whether the holder allowed it."
    >
      <div role="tablist" aria-label="Mode" className="flex gap-2">
        {['test', 'live'].map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full border px-4 py-2 text-sm capitalize ${mode === m ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {m}
          </button>
        ))}
      </div>
      <DataTable
        error={log.error}
        rows={log.data}
        rowKey={(c) => c._id}
        empty={`No ${mode} consents yet.`}
        columns={[
          {label: 'Asked', cell: (c) => formatDate(c.createdAt)},
          {label: 'Bharat ID', cell: (c) => <span className="tabular-nums">{c.bharatId}</span>},
          {label: 'Purpose', cell: (c) => c.purpose},
          {label: 'Details', cell: (c) => c.fields.map((f) => CONSENT_FIELDS[f]).join(', ')},
          {label: 'Your ref', cell: (c) => c.reference || '—'},
          {
            label: 'Status',
            right: true,
            cell: (c) => <Tag tone={c.status === 'approved' ? 'accent' : 'rule'}>{c.status}</Tag>,
          },
        ]}
      />
    </AppFrame>
  );
}
