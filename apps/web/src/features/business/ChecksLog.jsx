// Business console: every check started (is this person the holder?), by method, and how each one ended.
import {useState} from 'react';
import {authMethod} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {AppFrame} from '../products/AppFrame';
import {DataTable} from '../admin/DataTable';

export function ChecksLog({frame}) {
  const [mode, setMode] = useState('test');
  const log = useApi(`/identity/business/me/sessions?mode=${mode}`);
  return (
    <AppFrame
      {...frame}
      title="Checks."
      intro="Each time you asked a person to prove they hold their Bharat ID, and the result."
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
        rowKey={(s) => s._id}
        empty={`No ${mode} checks yet.`}
        columns={[
          {label: 'Asked', cell: (s) => formatDate(s.createdAt)},
          {label: 'Bharat ID', cell: (s) => <span className="tabular-nums">{s.bharatId}</span>},
          {label: 'Method', cell: (s) => `${authMethod(s.method)?.label ?? s.method} · L${s.level}`},
          {label: 'Your ref', cell: (s) => s.reference || '—'},
          {
            label: 'Result',
            right: true,
            cell: (s) => {
              const status = s.status === 'pending' && new Date(s.expiresAt) < new Date() ? 'expired' : s.status;
              return <Tag tone={status === 'passed' ? 'accent' : 'rule'}>{status}</Tag>;
            },
          },
        ]}
      />
    </AppFrame>
  );
}
