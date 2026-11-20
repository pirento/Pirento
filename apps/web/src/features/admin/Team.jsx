// Team: everyone with a staff role, what they may work on, and their open orders.
import {Link} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {useApi} from '../../lib/api/useApi';
import {DataTable} from './DataTable';
import {roleLabel} from './adminNav';
import {NewStaff} from './NewStaff';

export function Team() {
  const team = useApi('/auth/admin/team');
  const work = useApi('/orders/staff/workload');
  return (
    <div className="space-y-6">
      <NewStaff onDone={team.reload} />
      <p className="body">
        {work.data ? `${work.data.unassigned} open orders have nobody on them.` : ''} Change a role or product scope
        from the person's page.
      </p>
      <DataTable
        error={team.error}
        rows={team.data}
        empty="Nobody on the team yet."
        columns={[
          {
            label: 'Person',
            cell: (m) => (
              <Link to={`/admin/users/${m._id}`} className="hover:underline">
                <span className="block font-medium">{m.email}</span>
                <span className="text-muted">{m.name || 'No name yet'}</span>
              </Link>
            ),
          },
          {label: 'Staff ID', cell: (m) => m.staffId ?? <span className="text-muted">email sign-in</span>},
          {label: 'Role', cell: (m) => roleLabel(m.role) + (m.suspended ? ' · suspended' : '')},
          {
            label: 'Products',
            cell: (m) => (m.products?.length ? m.products.map((s) => getProduct(s)?.short ?? s).join(', ') : 'All'),
          },
          {label: 'Open orders', right: true, cell: (m) => work.data?.byStaff?.[m._id] ?? 0},
        ]}
      />
    </div>
  );
}
