// Admin → New Bharat ID: any staffer starts a Bharat ID for someone (email and mobile), may fill the steps with them,
// and sees what each person still has to do. The person finishes from a link sent by email and SMS.
import {useState} from 'react';
import {ID_SECTIONS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {StepForm} from './StepForm';

const sentLine = (sent) =>
  sent && `Link sent${sent.email ? ` to ${sent.email}` : ''}${sent.sms ? ` and by SMS to ${sent.sms}` : ''}.`;

function NewApplication({onDone}) {
  const [form, setForm] = useState({email: '', name: '', mobile: '', agreed: false});
  const [note, setNote] = useState('');
  const set = (k) => (e) =>
    setForm((f) => ({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value}));
  const start = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      const r = await api('/identity/staff/enrol', {method: 'POST', body: form});
      setNote(`Started for ${r.email}. ${sentLine(r.sent) ?? ''}`);
      setForm({email: '', name: '', mobile: '', agreed: false});
      onDone();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={start} className="max-w-3xl space-y-4 rounded-[18px] border border-rule p-6">
      <p className="font-medium">Start a Bharat ID for someone</p>
      <p className="text-sm text-muted">
        They need no sign-in. They get a link by email and SMS to finish: the video KYC, the Aadhaar eSign and their PIN
        are done by them alone. Until it is submitted, reminders follow after 1, 3 and 7 days without progress.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Their email" type="email" required value={form.email} onChange={set('email')} />
        <Field label="Their name (optional)" value={form.name} onChange={set('name')} />
        <Field
          label="Their mobile"
          inputMode="numeric"
          required
          maxLength={10}
          value={form.mobile}
          onChange={set('mobile')}
        />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 size-4 shrink-0" checked={form.agreed} onChange={set('agreed')} />
        The person has read and accepted the terms, and asked us to start their Bharat ID.
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent">
          Start and send the link
        </Button>
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </form>
  );
}

function Row({doc, onChange}) {
  const [note, setNote] = useState('');
  const open = ['draft', 'rejected'].includes(doc.status);
  const remind = async () => {
    setNote('');
    try {
      setNote(sentLine(await api(`/identity/staff/enrol/${doc._id}/remind`, {method: 'POST'})));
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">{doc.sections?.personal?.fullName ?? doc.email}</span>
          <span className="text-sm text-muted">
            {doc.email} · started {formatDate(doc.createdAt)} by {doc.enrolledBy?.email}
          </span>
        </span>
        <Tag tone={open ? 'accent' : 'rule'}>{open ? `Next: ${doc.nextStep}` : doc.status}</Tag>
      </summary>
      <div className="space-y-6 pb-8">
        {open && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={remind} variant="outline" icon={null}>
              Send the link again
            </Button>
            <span className="text-sm text-muted">Reminders sent: {doc.reminders?.count ?? 0}</span>
            {note && (
              <p role="status" className="text-sm">
                {note}
              </p>
            )}
          </div>
        )}
        {open &&
          ID_SECTIONS.map((s) => (
            <details key={s.id} className="rounded-[18px] border border-rule p-5">
              <summary className="cursor-pointer font-medium">
                {s.title} {doc.sections?.[s.id] ? '· saved' : ''}
              </summary>
              <div className="mt-5">
                <StepForm
                  section={s}
                  initial={doc.sections?.[s.id]}
                  save={(values) =>
                    api(`/identity/staff/enrol/${doc._id}/draft/${s.id}`, {method: 'PUT', body: values})
                  }
                  onSaved={onChange}
                  submitLabel="Save this step"
                />
              </div>
            </details>
          ))}
      </div>
    </details>
  );
}

export function EnrolQueue() {
  const list = useApi('/identity/staff/enrol');
  return (
    <div className="mt-8 space-y-10">
      <NewApplication onDone={list.reload} />
      {list.error && <p className="body">⚠ {list.error.message}</p>}
      {list.data?.length === 0 && <p className="body text-muted">No applications started by staff yet.</p>}
      <div className="border-t border-rule">
        {list.data?.map((d) => (
          <Row key={d._id} doc={d} onChange={list.reload} />
        ))}
      </div>
    </div>
  );
}
