// Admin → Vault: the legacy desk. The queue of plans that need the team, by stage. Opening a case shows who to call
// (nominee and emergency contact from Bharat ID), the calls so far, the death certificate form, the release (by a
// superadmin) and, after release, the insurance claims the team helps with. Never what is inside a vault.
import {useState} from 'react';
import {Phone} from 'lucide-react';
import {LEGACY} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';
import {formatDate} from '../../lib/format';

const STAGES = vaultCopy.legacy.staffStages;
const QUEUE = LEGACY.stages.filter((s) => s !== 'active');
const CLAIM = {'not-started': 'Not started', filed: 'Filed', paid: 'Paid', refused: 'Refused'};

function Contact({label, c, relation}) {
  return (
    <div className="rounded-[14px] border border-rule p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium">
        {c.name || '—'}
        {relation && <span className="text-muted"> · {relation}</span>}
      </p>
      {c.mobile && (
        <a
          href={`tel:+91${c.mobile}`}
          className="mt-2 inline-flex items-center gap-2 text-sm underline underline-offset-4"
        >
          <Phone aria-hidden className="size-4" /> +91 {c.mobile}
        </a>
      )}
    </div>
  );
}

function CaseDetail({id, onChange}) {
  const {user} = useSession();
  const one = useApi(`/vault/staff/cases/${id}`);
  const [note, setNote] = useState('');
  const [cert, setCert] = useState({number: '', issuedBy: '', date: ''});
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const c = one.data;
  const run = async (fn) => {
    setError('');
    try {
      await fn();
      one.reload();
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  if (!c) return <p className="py-6 text-sm text-muted">Loading…</p>;
  const call = (outcome) =>
    run(() => api(`/vault/staff/cases/${id}/call`, {method: 'POST', body: {outcome, note}}).then(() => setNote('')));
  return (
    <div className="grid gap-8 pb-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Contact label="Nominee" c={c.contacts.nominee} relation={c.contacts.nominee.relation} />
        <Contact label="Emergency contact" c={c.contacts.emergency} />
        <p className="text-sm text-muted">
          Owner: {c.contacts.name} · Bharat ID {c.contacts.bharatId} · last seen {formatDate(c.lastSeenAt)} · reminders{' '}
          {c.reminders}
        </p>
        {c.calls?.length > 0 && (
          <ul className="border-t border-rule text-sm">
            {c.calls.map((x) => (
              <li key={x.at} className="border-b border-rule py-2">
                {formatDate(x.at)} · {x.outcome}
                {x.note && <span className="text-muted"> · {x.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-6">
        {['reminding', 'call-nominee', 'nominee-reached'].includes(c.stage) && (
          <div className="space-y-3">
            <Field
              label="What was said (only staff see it)"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={null} onClick={() => call('reached')}>
                Nominee reached
              </Button>
              <Button variant="outline" icon={null} onClick={() => call('no-answer')}>
                No answer
              </Button>
              <Button variant="outline" icon={null} onClick={() => call('owner-well')}>
                Owner is well
              </Button>
            </div>
          </div>
        )}
        {c.stage === 'nominee-reached' && (
          <form
            noValidate
            className="space-y-3 rounded-[18px] border border-rule p-5"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => api(`/vault/staff/cases/${id}/certificate`, {method: 'POST', body: cert}));
            }}
          >
            <p className="font-medium">Death certificate, checked against the original</p>
            <p className="text-xs text-muted">Checking it with the government through API Setu is Expected.</p>
            <Field
              label="Certificate number"
              value={cert.number}
              onChange={(e) => setCert({...cert, number: e.target.value})}
            />
            <Field
              label="Issued by"
              value={cert.issuedBy}
              onChange={(e) => setCert({...cert, issuedBy: e.target.value})}
            />
            <Field
              label="Date of death"
              type="date"
              value={cert.date}
              onChange={(e) => setCert({...cert, date: e.target.value})}
            />
            <Button type="submit" variant="primary" icon={null}>
              Mark verified
            </Button>
          </form>
        )}
        {c.stage === 'verified' && user?.role === 'superadmin' && (
          <div className="space-y-3">
            <p className="text-sm">
              Certificate {c.certificate.number}, verified {formatDate(c.certificate.verifiedAt)}. Releasing texts the
              nominee a link that works for 30 days.
            </p>
            <Button
              variant="accent"
              icon={null}
              onClick={() =>
                run(async () => setLink((await api(`/vault/staff/cases/${id}/release`, {method: 'POST'})).link))
              }
            >
              Release to the nominee
            </Button>
          </div>
        )}
        {link && <p className="text-sm break-all">Link (share it on the call if the text does not arrive): {link}</p>}
        {c.release?.at && (
          <p className="text-sm text-muted">
            Released {formatDate(c.release.at)} ·{' '}
            {c.release.openedAt ? `opened ${formatDate(c.release.openedAt)}` : 'not opened yet'}
          </p>
        )}
        {c.policies?.length > 0 && (
          <div className="space-y-3">
            <p className="font-medium">Insurance claims we help with</p>
            {c.policies.map((p) => {
              const claim = c.claims.find((x) => x.recordId === p.recordId);
              return (
                <div key={p.recordId} className="rounded-[14px] border border-rule p-4 text-sm">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-muted">
                    {p.insurer || '—'} · policy {p.policyNo || '—'}
                    {p.cover && ` · cover ₹${p.cover}`}
                  </p>
                  <select
                    aria-label={`Claim status for ${p.title}`}
                    value={claim?.status ?? 'not-started'}
                    onChange={(e) =>
                      run(() =>
                        api(`/vault/staff/cases/${id}/claims/${p.recordId}`, {
                          method: 'PATCH',
                          body: {status: e.target.value},
                        }),
                      )
                    }
                    className="mt-3 rounded-full border border-rule bg-paper px-3 py-1"
                  >
                    {Object.entries(CLAIM).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
        {c.stage === 'released' && (
          <Button
            variant="outline"
            icon={null}
            onClick={() => run(() => api(`/vault/staff/cases/${id}/close`, {method: 'POST'}))}
          >
            Close the case
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function VaultCases() {
  const [stage, setStage] = useState('');
  const cases = useApi(`/vault/staff/cases${stage ? `?stage=${stage}` : ''}`);
  const counts = cases.data?.counts ?? {};
  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        {['', ...QUEUE].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            aria-pressed={stage === s}
            onClick={() => setStage(s)}
            className={`rounded-full border px-4 py-2 text-sm ${stage === s ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {s ? STAGES[s] : 'Needs the team'} {s && <span className="opacity-60">{counts[s] ?? 0}</span>}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Active plans, where the owner is seen: {counts.active ?? 0}. Staff never see what is inside a vault.
      </p>
      {cases.data?.items.length === 0 && <p className="body mt-8">Nothing here.</p>}
      <div className="mt-6 border-t border-rule">
        {cases.data?.items.map((c) => (
          <details key={c._id} className="border-b border-rule">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block font-medium">Plan from {formatDate(c.consentAt)}</span>
                <span className="block text-sm text-muted">
                  Last seen {formatDate(c.lastSeenAt)} · {c.reminders} reminders · {c.calls} calls
                </span>
              </span>
              <Tag tone={['call-nominee', 'verified'].includes(c.stage) ? 'accent' : 'rule'}>{STAGES[c.stage]}</Tag>
            </summary>
            <CaseDetail id={c._id} onChange={cases.reload} />
          </details>
        ))}
      </div>
    </>
  );
}
