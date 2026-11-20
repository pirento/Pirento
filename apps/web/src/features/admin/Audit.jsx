// Audit trail: every staff action, newest first.
import {useApi} from '../../lib/api/useApi';
import {DataTable} from './DataTable';

const when = (d) => new Date(d).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'});

export function Audit() {
  const log = useApi('/auth/admin/audit');
  return (
    <DataTable
      error={log.error}
      rows={log.data}
      empty="No staff actions recorded yet."
      columns={[
        {label: 'When', cell: (r) => when(r.createdAt)},
        {label: 'Who', cell: (r) => r.actorEmail},
        {label: 'Action', cell: (r) => <code className="text-xs">{r.action}</code>},
        {label: 'On', cell: (r) => r.target},
        {label: 'Detail', cell: (r) => r.detail || '—'},
      ]}
    />
  );
}
