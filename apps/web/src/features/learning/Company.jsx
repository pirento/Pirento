// Intern → Company: a company asks to post internships; once Pirento approves it, it posts openings (each
// reviewed before it goes live) and runs its applicants through the pipeline.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {OpeningForm} from './OpeningForm';
import {Pipeline} from './Pipeline';

const REVIEW = {pending: 'In review', approved: 'Approved', rejected: 'Not approved'};
const EMPTY = {company: '', website: '', about: '', contactName: '', phone: ''};

function RequestForm({before, onDone}) {
  const [f, setF] = useState(before ? {...EMPTY, ...before} : EMPTY);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const send = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const {company, website, about, contactName, phone} = f;
      await api('/learning/employers', {method: 'POST', body: {company, website, about, contactName, phone}});
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={send} className="max-w-3xl space-y-4 rounded-[22px] border border-rule p-6">
      <p className="text-sm text-muted">
        Tell us about the company. Pirento checks it before you can post; every opening is checked again before it goes
        live.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" required value={f.company} onChange={set('company')} />
        <Field label="Website" type="url" required placeholder="https://" value={f.website} onChange={set('website')} />
        <Field label="Your name" required value={f.contactName} onChange={set('contactName')} />
        <Field label="Mobile" inputMode="numeric" maxLength={10} required value={f.phone} onChange={set('phone')} />
      </div>
      <TextArea label="What the company does" value={f.about} onChange={set('about')} />
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button type="submit" variant="accent">
        Ask to post internships
      </Button>
    </form>
  );
}

function MyOpenings({list}) {
  const toggle = async (o) => {
    try {
      await api(`/learning/employer/openings/${o._id}`, {method: 'PATCH', body: {open: !o.open}});
      list.reload();
    } catch (err) {
      alert(err.message);
    }
  };
  if (list.data?.length === 0) return <p className="text-muted">No openings yet.</p>;
  return (
    <ul className="border-t border-rule">
      {list.data?.map((o) => (
        <li key={o._id} className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-4">
          <span className="min-w-0">
            <span className="block font-medium">{o.title}</span>
            <span className="text-sm text-muted">
              {o.applications} applied · {o.open ? 'open' : 'closed'}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Tag tone={o.review === 'approved' ? 'accent' : 'rule'}>{REVIEW[o.review]}</Tag>
            {o.review === 'approved' && (
              <Button variant="outline" icon={null} onClick={() => toggle(o)}>
                {o.open ? 'Close it' : 'Reopen'}
              </Button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Company({me}) {
  const approved = me.data?.status === 'approved';
  const openings = useApi(approved ? '/learning/employer/openings' : null);
  if (me.loading && !me.data) return null;
  const e = me.data;

  if (!e || e.status === 'rejected') {
    return (
      <DashSection n={1} id="ask" label="Hire interns" title="Post internships / on Pirento Intern.">
        {e?.status === 'rejected' && (
          <p className="mb-6 text-sm">
            ⚠ Your last request was not approved{e.note ? `: ${e.note}` : ''}. You can send it again.
          </p>
        )}
        <RequestForm before={e} onDone={me.reload} />
      </DashSection>
    );
  }
  if (!approved) {
    return (
      <div className="max-w-2xl rounded-[22px] border border-rule p-8" data-reveal>
        <Tag>{e.status === 'requested' ? 'In review' : 'Paused'}</Tag>
        <p className="mt-4 text-xl">{e.company}</p>
        <p className="body mt-2">
          {e.status === 'requested'
            ? 'Pirento is checking your company. We will email you when it is approved.'
            : `Your company page is paused${e.note ? `: ${e.note}` : ''}. Write to support to talk about it.`}
        </p>
      </div>
    );
  }
  return (
    <>
      <DashSection n={1} id="openings" label={e.company} title="Your / openings.">
        <div className="space-y-6">
          <MyOpenings list={openings} />
          <OpeningForm
            path="/learning/employer/openings"
            onDone={openings.reload}
            label="Send for review"
            note="Pirento checks each opening before it goes live. Changing its words sends it back to review."
          />
        </div>
      </DashSection>
      <DashSection n={2} id="applicants" label="Applicants" title="Interview, offer, / set the work.">
        <Pipeline base="/learning/employer/applications" />
      </DashSection>
    </>
  );
}
