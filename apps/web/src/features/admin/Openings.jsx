// Openings: post internships and jobs for the Intern site, review what companies post, close or reopen them, and
// work every applicant through the pipeline.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {OpeningForm} from '../learning/OpeningForm';
import {Pipeline} from '../learning/Pipeline';

export function Openings() {
  const list = useApi('/learning/staff/openings');
  const [openId, setOpenId] = useState(null);
  const patch = async (o, body) => {
    try {
      await api(`/learning/staff/openings/${o._id}`, {method: 'PATCH', body});
      list.reload();
    } catch (err) {
      alert(err.message);
    }
  };
  return (
    <div className="space-y-10">
      <OpeningForm path="/learning/staff/openings" onDone={list.reload} />
      {list.error && <p className="body">⚠ {list.error.message}</p>}
      {list.data?.length === 0 && <p className="body">No openings yet.</p>}
      <ul className="space-y-4">
        {list.data?.map((o) => (
          <li key={o._id} className="rounded-[22px] border border-rule p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">
                  {o.company ?? 'Pirento'} · {o.kind} · {o.mode} {o.track && `· ${o.track}`} ·{' '}
                  {o.open ? 'open' : 'closed'}
                </p>
                <h3 className="mt-2 text-xl">{o.title}</h3>
                {o.review === 'pending' && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted">{o.description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {o.review && <Tag tone={o.review === 'pending' ? 'accent' : 'rule'}>{o.review}</Tag>}
                {o.review === 'pending' ? (
                  <>
                    <Button variant="accent" icon={null} onClick={() => patch(o, {review: 'approved'})}>
                      Approve and open
                    </Button>
                    <Button variant="outline" icon={null} onClick={() => patch(o, {review: 'rejected'})}>
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" icon={null} onClick={() => patch(o, {open: !o.open})}>
                    {o.open ? 'Close it' : 'Reopen'}
                  </Button>
                )}
                <Button variant="outline" icon={null} onClick={() => setOpenId(openId === o._id ? null : o._id)}>
                  {o.applications} applications
                </Button>
              </div>
            </div>
            {openId === o._id && (
              <div className="mt-6">
                <Pipeline base="/learning/staff/applications" openingId={o._id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
