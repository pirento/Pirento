// Certificates: every Pirento Intern certificate, each linking to its public verify page.
import {Link} from 'react-router-dom';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {DataTable} from './DataTable';

export function Certificates() {
  const certs = useApi('/learning/staff/certificates');
  return (
    <DataTable
      error={certs.error}
      rows={certs.data}
      empty="No certificates issued yet."
      columns={[
        {
          label: 'Code',
          cell: (c) => (
            <Link to={`/verify/${c.code}`} className="hover:underline">
              {c.code}
            </Link>
          ),
        },
        {label: 'Name', cell: (c) => c.fullName},
        {label: 'For', cell: (c) => c.title ?? c.track},
        {label: 'Score', right: true, cell: (c) => (c.percent == null ? '—' : `${c.percent}%`)},
        {label: 'Issued', right: true, cell: (c) => formatDate(c.issuedAt)},
      ]}
    />
  );
}
