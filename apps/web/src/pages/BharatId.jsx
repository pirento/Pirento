import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react';
import {ArrowLeft, Check, Clock, Copy, Pencil, Printer} from 'lucide-react';
import {ID_SECTIONS, formatBharatId, validateSection} from '@pirento/shared';
import {api, useApi, useSession} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Button, Field, Label, Section, Tag} from '../components/ui';
import {PageHero} from './Products';
import {StaffQueue, formatDate, useSignedIn} from './Orders';

const STEPS = [...ID_SECTIONS, {id: 'review', title: 'Review and submit'}];

function Select({f, value, onChange}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {f.label} <span className="text-muted">(required)</span>
      </span>
      <select
        required
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base focus:border-ink"
      >
        <option value="" disabled>
          Choose one
        </option>
        {f.options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/** One step's fields, driven by the shared definition. */
function StepForm({section, initial, onSaved, onBack}) {
  // Reduced values (XXXX…) cannot be sent back, so those fields start empty and are typed again.
  const [values, setValues] = useState(() =>
    Object.fromEntries(section.fields.map((f) => [f.id, f.store ? '' : (initial?.[f.id] ?? '')])),
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (id) => (v) => setValues((s) => ({...s, [id]: v}));

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    const local = validateSection(section.id, values);
    if (local.error) return setError(local);
    setBusy(true);
    try {
      onSaved(await api(`/identity/draft/${section.id}`, {method: 'PUT', body: values}));
    } catch (err) {
      setError({error: err.message});
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="space-y-6">
      {section.intro && <p className="body">{section.intro}</p>}
      <div className="grid gap-6 sm:grid-cols-2">
        {section.fields.map((f) =>
          f.options && f.options.length > 6 ? (
            <Select key={f.id} f={f} value={values[f.id]} onChange={set(f.id)} />
          ) : f.options ? (
            <fieldset key={f.id} className="sm:col-span-2">
              <legend className="text-sm font-medium">
                {f.label} <span className="text-muted">(required)</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {f.options.map((o) => (
                  <label
                    key={o}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
                      values[f.id] === o ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name={f.id}
                      className="sr-only"
                      checked={values[f.id] === o}
                      onChange={() => set(f.id)(o)}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div key={f.id} className={f.id === 'line' ? 'sm:col-span-2' : ''}>
              <Field
                label={f.label + (f.optional ? ' (optional)' : '')}
                required={!f.optional}
                type={f.type ?? 'text'}
                inputMode={f.inputMode}
                autoComplete={f.autoComplete ?? 'off'}
                placeholder={f.store && initial?.[f.id] ? `Saved as ${initial[f.id]}. Type it again.` : f.placeholder}
                maxLength={f.maxLength}
                value={values[f.id]}
                onChange={(e) => set(f.id)(f.upper ? e.target.value.toUpperCase() : e.target.value)}
                error={error?.field === f.id ? error.error : undefined}
              />
            </div>
          ),
        )}
      </div>
      {section.id === 'nominee' && (
        <button
          type="button"
          onClick={() => setValues((s) => ({...s, emergencyName: s.nomineeName, emergencyMobile: s.nomineeMobile}))}
          className="text-sm underline underline-offset-4"
        >
          Emergency contact is the same as my nominee
        </button>
      )}
      {error && !error.field && (
        <p role="alert" className="text-sm">
          ⚠ {error.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Saving' : 'Save and continue'}
        </Button>
        {onBack && (
          <Button type="button" variant="outline" icon={ArrowLeft} onClick={onBack}>
            Back
          </Button>
        )}
      </div>
    </form>
  );
}

/** Every saved step as a read-only list; staff see the same view. */
export function SectionSummary({sections, email, onEdit}) {
  return (
    <div className="divide-y divide-rule rounded-[18px] border border-rule">
      {ID_SECTIONS.map((s, i) => (
        <div key={s.id} className="grid gap-3 p-5 sm:grid-cols-[12rem_1fr_auto]">
          <p className="font-medium">{s.title}</p>
          <dl className="grid min-w-0 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {s.id === 'contact' && email && (
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="break-all">{email}</dd>
              </div>
            )}
            {s.fields
              .filter((f) => sections?.[s.id]?.[f.id])
              .map((f) => (
                <div key={f.id}>
                  <dt className="text-muted">{f.label}</dt>
                  <dd className="break-words">{sections[s.id][f.id]}</dd>
                </div>
              ))}
          </dl>
          {onEdit && (
            <button
              onClick={() => onEdit(i)}
              className="inline-flex items-center gap-1 self-start text-sm underline underline-offset-4"
            >
              <Pencil aria-hidden className="size-3.5" /> Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function Review({doc, email, onEdit, onSubmitted}) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      onSubmitted(await api('/identity/submit', {method: 'POST', body: {consent}}));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <p className="body">Check everything once. Our team reviews it by hand before issuing your ID.</p>
      <SectionSummary sections={doc?.sections} email={email} onEdit={onEdit} />
      <label className="flex items-start gap-3 rounded-[18px] border border-rule p-5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 size-4 shrink-0"
        />
        <span className="text-[0.95rem] leading-relaxed text-muted">
          I confirm these details are mine and correct, and I agree that Pirento stores them to issue and verify my
          Bharat ID. I understand Bharat ID is a Pirento identifier, not a government ID.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button onClick={submit} variant="accent" disabled={!consent || busy}>
        {busy ? 'Submitting' : 'Submit application'}
      </Button>
    </div>
  );
}

function IdCard({doc}) {
  const [copied, setCopied] = useState(false);
  const link = `https://pirento.com/verify/${doc.bharatId}`;
  return (
    <div className="max-w-3xl">
      <div className="grid overflow-hidden rounded-[22px] border border-rule sm:grid-cols-[1fr_auto]" data-reveal>
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
            value={link}
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
      <div className="no-print mt-6 flex flex-wrap gap-3">
        <Button onClick={() => window.print()} variant="outline" icon={Printer}>
          Print
        </Button>
        <Button
          variant="outline"
          icon={copied ? Check : Copy}
          onClick={() =>
            navigator.clipboard.writeText(link).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            })
          }
        >
          {copied ? 'Copied' : 'Copy verify link'}
        </Button>
      </div>
    </div>
  );
}

const firstOpen = (doc) => {
  const i = ID_SECTIONS.findIndex((s) => !doc?.sections?.[s.id]);
  return i === -1 ? ID_SECTIONS.length : i;
};

function Wizard({doc, email, onChange}) {
  const [step, setStep] = useState(() => firstOpen(doc));
  const done = (i) => Boolean(doc?.sections?.[STEPS[i].id]);
  const canOpen = (i) => i <= firstOpen(doc);
  const current = STEPS[step];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <nav aria-label="Application steps" className="lg:col-span-4">
        <p className="text-sm text-muted lg:hidden">
          Step {step + 1} of {STEPS.length} · {current.title}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone lg:hidden" aria-hidden>
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{width: `${((step + 1) / STEPS.length) * 100}%`}}
          />
        </div>
        <ol className="relative mt-2 hidden border-l border-rule lg:block">
          {STEPS.map((s, i) => (
            <li key={s.id} className="relative pb-6 pl-6 last:pb-0">
              <span
                aria-hidden
                className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 ${
                  done(i) ? 'border-accent bg-accent' : i === step ? 'border-ink bg-paper' : 'border-rule bg-paper'
                }`}
              />
              <button
                onClick={() => setStep(i)}
                disabled={!canOpen(i)}
                aria-current={i === step ? 'step' : undefined}
                className={`text-left ${i === step ? 'font-medium text-ink' : canOpen(i) ? 'text-muted hover:text-ink' : 'text-muted opacity-60'}`}
              >
                <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span> {s.title}
                {done(i) && <span className="sr-only"> (done)</span>}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="min-w-0 lg:col-span-8">
        <Label n={step + 1}>{current.title}</Label>
        <div className="mt-6">
          {current.id === 'review' ? (
            <Review doc={doc} email={email} onEdit={setStep} onSubmitted={onChange} />
          ) : (
            <StepForm
              key={current.id}
              section={current}
              initial={doc?.sections?.[current.id]}
              onBack={step > 0 ? () => setStep(step - 1) : null}
              onSaved={(next) => {
                onChange(next);
                // After an edit from review, go straight back to review.
                setStep(firstOpen(next) === ID_SECTIONS.length ? STEPS.length - 1 : step + 1);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function BharatId() {
  const {redirect, user} = useSignedIn();
  const {user: me} = useSession();
  const res = useApi(user ? '/identity/me' : null);
  const [fresh, setFresh] = useState(null);
  const ref = useRef(null);
  usePageMotion(ref, [res.loading]);
  usePageMeta({title: 'Bharat ID — apply', description: 'Apply for your Bharat ID in eight short steps.'});
  if (redirect) return redirect;
  const doc = fresh ?? res.data;

  return (
    <div ref={ref}>
      <PageHero
        label="Bharat ID · Dashboard"
        title="One identity, / checked once."
        hl="checked once."
        intro="Eight short steps. Your progress is saved after each one, so you can stop and come back."
      />
      <Section className="pt-0! md:pt-0!">
        {res.loading ? null : doc?.status === 'approved' ? (
          <IdCard doc={doc} />
        ) : doc?.status === 'submitted' ? (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-start gap-4 rounded-[22px] border border-rule p-8">
              <Clock aria-hidden className="mt-1 size-5" />
              <div>
                <Tag tone="accent">In review</Tag>
                <p className="body mt-4">
                  Submitted on {formatDate(doc.submittedAt)}. Our team checks your details by hand; your ID appears here
                  once it is approved.
                </p>
              </div>
            </div>
            <SectionSummary sections={doc.sections} email={me?.email} />
          </div>
        ) : (
          <>
            {doc?.status === 'rejected' && (
              <div role="status" className="mb-10 max-w-3xl rounded-[22px] border border-accent p-6">
                <p className="font-medium">Your application needs a change</p>
                <p className="body mt-2">
                  <strong>Reason:</strong> {doc.reason}. Fix the step, then submit again from the last step.
                </p>
              </div>
            )}
            <Wizard key={doc?.status ?? 'new'} doc={doc} email={me?.email} onChange={setFresh} />
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
          <span className="block font-medium">{doc.fullName ?? doc.email}</span>
          <span className="text-sm text-muted">
            {doc.email} · {formatDate(doc.submittedAt ?? doc.createdAt)}
          </span>
        </span>
        <Tag tone={doc.status === 'submitted' ? 'accent' : 'rule'}>
          {doc.bharatId ? formatBharatId(doc.bharatId) : doc.status}
        </Tag>
      </summary>
      <div className="space-y-6 pb-8">
        <SectionSummary sections={doc.sections} email={doc.email} />
        <p className="text-sm text-muted">
          Email is verified by sign-in. The mobile number is not verified by SMS yet. Aadhaar passed its checksum.
        </p>
        {doc.reason && <p className="text-sm">Reason given: {doc.reason}</p>}
        {doc.status === 'submitted' && (
          <div className="max-w-xl">
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
