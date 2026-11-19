import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react';
import {Clock} from 'lucide-react';
import {formatBharatId} from '@pirento/shared';
import {INDIAN_STATES} from '@pirento/shared/intake';
import {api, useApi} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Button, Field, Label, Section, Tag} from '../components/ui';
import {PageHero} from './Products';
import {StaffQueue, formatDate, useSignedIn} from './Orders';

function ApplyForm({onDone, previous}) {
  const [form, setForm] = useState({fullName: '', dob: '', state: '', pan: '', ...previous});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onDone(await api('/identity/apply', {method: 'POST', body: form}));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="grid max-w-2xl gap-6 sm:grid-cols-2" data-reveal>
      <div className="sm:col-span-2">
        <Field
          label="Full name, as on your PAN"
          required
          autoComplete="name"
          value={form.fullName}
          onChange={set('fullName')}
        />
      </div>
      <Field label="Date of birth" type="date" required autoComplete="bday" value={form.dob} onChange={set('dob')} />
      <label className="block">
        <span className="text-sm font-medium">
          State <span className="text-muted">(required)</span>
        </span>
        <select
          required
          value={form.state}
          onChange={set('state')}
          className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base focus:border-ink"
        >
          <option value="" disabled>
            Choose one
          </option>
          {INDIAN_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2">
        <Field
          label="PAN"
          required
          maxLength={10}
          placeholder="ABCDE1234F"
          value={form.pan}
          onChange={(e) => setForm((f) => ({...f, pan: e.target.value.toUpperCase()}))}
          error={error}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Sending' : 'Apply for Bharat ID'}
        </Button>
        <p className="mt-3 text-sm text-muted">Our team checks your details by hand before an ID is issued.</p>
      </div>
    </form>
  );
}

function IdCard({doc}) {
  return (
    <div
      className="grid max-w-3xl overflow-hidden rounded-[22px] border border-rule sm:grid-cols-[1fr_auto]"
      data-reveal
    >
      <div className="p-8">
        <p className="eyebrow">Bharat ID · by Pirento</p>
        <p className="display mt-6 text-[clamp(2rem,5vw,3.25rem)] tabular-nums">{formatBharatId(doc.bharatId)}</p>
        <p className="mt-6 text-xl">{doc.fullName}</p>
        <p className="mt-1 text-sm text-muted">
          {doc.state} · issued {formatDate(doc.issuedAt)}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 border-t border-rule bg-stone p-8 sm:border-t-0 sm:border-l">
        <QRCodeSVG
          value={`https://pirento.com/verify/${doc.bharatId}`}
          size={128}
          bgColor="transparent"
          fgColor="currentColor"
          title="QR code that opens this ID's verify page"
        />
        <Link to={`/verify/${doc.bharatId}`} className="text-sm underline underline-offset-4">
          Verify page
        </Link>
      </div>
    </div>
  );
}

export function BharatId() {
  const {redirect, user} = useSignedIn();
  const me = useApi(user ? '/identity/me' : null);
  const [fresh, setFresh] = useState(null);
  const ref = useRef(null);
  usePageMotion(ref, [me.loading]);
  usePageMeta({title: 'Bharat ID — Pirento', description: 'One reviewed identity for every Pirento product.'});
  if (redirect) return redirect;
  const doc = fresh ?? me.data;

  return (
    <div ref={ref}>
      <PageHero
        label="Bharat ID"
        title="One identity, / checked once."
        hl="checked once."
        intro="A 10-digit ID for every Pirento product, issued after our team reviews your details. It is a Pirento identifier, not a government ID."
      />
      <Section className="pt-0! md:pt-0!">
        {me.loading ? null : !doc ? (
          <ApplyForm onDone={setFresh} />
        ) : doc.status === 'approved' ? (
          <IdCard doc={doc} />
        ) : doc.status === 'submitted' ? (
          <div className="flex max-w-2xl items-start gap-4 rounded-[22px] border border-rule p-8" data-reveal>
            <Clock aria-hidden className="mt-1 size-5" />
            <div>
              <Tag tone="accent">In review</Tag>
              <p className="body mt-4">
                We received your application on {formatDate(doc.createdAt)}. You will see your ID here once it is
                approved.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-10 max-w-2xl rounded-[22px] border border-rule p-8" data-reveal>
              <Label n={1}>Not approved</Label>
              <p className="body mt-4">
                <strong>Reason:</strong> {doc.reason}
              </p>
              <p className="body mt-2">Fix the details below and apply again.</p>
            </div>
            <ApplyForm
              onDone={setFresh}
              previous={{fullName: doc.fullName, dob: doc.dob, state: doc.state, pan: doc.pan}}
            />
          </>
        )}
      </Section>
    </div>
  );
}

// ── Staff review ─────────────────────────────────────────────────────────

function Application({doc, onChange}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const decide = async (decision) => {
    setError('');
    try {
      await api(`/identity/staff/${doc._id}`, {method: 'PATCH', body: {decision, reason}});
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">{doc.fullName}</span>
          <span className="text-sm text-muted">
            {doc.email} · {formatDate(doc.createdAt)}
          </span>
        </span>
        <Tag tone={doc.status === 'submitted' ? 'accent' : 'rule'}>{doc.bharatId ?? doc.status}</Tag>
      </summary>
      <div className="grid gap-8 pb-8 md:grid-cols-2">
        <dl className="space-y-3 text-sm">
          {[
            ['Date of birth', doc.dob],
            ['State', doc.state],
            ['PAN', doc.pan],
            ['Reason', doc.reason],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        {doc.status === 'submitted' && (
          <div>
            <Field
              label="Reason (needed to reject)"
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              error={error}
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={() => decide('approve')} icon={null}>
                Approve and issue
              </Button>
              <Button onClick={() => decide('reject')} variant="outline" icon={null}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

export const IdentityQueue = () => (
  <StaffQueue
    path="/identity/staff/queue"
    filters={[
      {label: 'To review', value: 'submitted'},
      {label: 'Approved', value: 'approved'},
      {label: 'Rejected', value: 'rejected'},
    ]}
    render={(d, reload) => <Application key={d._id} doc={d} onChange={reload} />}
  />
);
