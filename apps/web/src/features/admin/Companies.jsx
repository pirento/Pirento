// Admin → Intern companies: companies asking to post internships. Approve, refuse or pause them; pausing or
// refusing closes their openings.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {safeHref} from '../../lib/links';

const ACTIONS = {
  requested: [
    ['approved', 'Approve'],
    ['rejected', 'Refuse'],
  ],
  approved: [['suspended', 'Pause']],
  suspended: [['approved', 'Approve again']],
  rejected: [],
};

function Company({c, onChange}) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const decide = async (status) => {
    setError('');
    try {
      await api(`/learning/staff/employers/${c._id}`, {method: 'PATCH', body: {status, note}});
      onChange();
    } catch (err) {
      setError(`⚠ ${err.message}`);
    }
  };
  return (
    <li className="space-y-4 rounded-[18px] border border-rule p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-medium">{c.company}</p>
          <a
            href={safeHref(c.website)}
            target="_blank"
            rel="noreferrer noopener"
            className="break-all text-sm underline"
          >
            {c.website}
          </a>
        </div>
        <Tag tone={c.status === 'requested' ? 'accent' : 'rule'}>{c.status}</Tag>
      </div>
      <p className="whitespace-pre-line text-sm">{c.about}</p>
      <p className="text-sm text-muted">
        {c.contactName} · {c.phone} · {c.email} · asked {formatDate(c.createdAt)}
        {c.decidedBy && ` · last decided by ${c.decidedBy}`}
      </p>
      {ACTIONS[c.status].length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 grow">
            <Field label="Note to them (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {ACTIONS[c.status].map(([to, label]) => (
            <Button key={to} variant={to === 'approved' ? 'accent' : 'outline'} icon={null} onClick={() => decide(to)}>
              {label}
            </Button>
          ))}
        </div>
      )}
      {error && <p className="text-sm">{error}</p>}
    </li>
  );
}

export function Companies() {
  const list = useApi('/learning/staff/employers');
  return (
    <div className="space-y-4">
      {list.error && <p className="body">⚠ {list.error.message}</p>}
      {list.data?.length === 0 && <p className="body text-muted">No companies have asked yet.</p>}
      <ul className="grid gap-4 xl:grid-cols-2">
        {list.data?.map((c) => (
          <Company key={c._id} c={c} onChange={list.reload} />
        ))}
      </ul>
    </div>
  );
}
