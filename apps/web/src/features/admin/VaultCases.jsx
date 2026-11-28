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

/**
 * The death certificate: checked with the body that issued it through API Setu (Pirento AI then reads the name on
 * it), or, when API Setu is off or the body is not on it, recorded after checking the original by hand.
 */
function CertificateForm({id, run}) {
  const setup = useApi('/vault/staff/certificate-issuers');
  const [issuer, setIssuer] = useState('');
  const [params, setParams] = useState({});
  const [manual, setManual] = useState({number: '', issuedBy: '', date: ''});
  const s = setup.data;
  if (!s) return null;
  const chosen = s.issuers.find((i) => i.id === issuer);
  const send = (body) => (e) => {
    e.preventDefault();
    run(() => api(`/vault/staff/cases/${id}/certificate`, {method: 'POST', body}));
  };
  return (
    <div className="space-y-4 rounded-[18px] border border-rule p-5">
      <p className="font-medium">Death certificate</p>
      {s.apisetu ? (
        <form noValidate className="space-y-3" onSubmit={send({issuer, params})}>
          <p className="text-xs text-muted">
            API Setu asks the issuing body for it, then Pirento AI checks the name is the owner's.
          </p>
          <label className="block">
            <span className="text-sm font-medium">Issued by</span>
            <select
              value={issuer}
              onChange={(e) => {
                setIssuer(e.target.value);
                setParams({});
              }}
              className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3"
            >
              <option value="">Choose…</option>
              {s.issuers.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          {chosen?.params.map((p) => (
            <Field
              key={p.id}
              label={p.label}
              placeholder={p.placeholder}
              value={params[p.id] ?? ''}
              onChange={(e) => setParams({...params, [p.id]: e.target.value})}
            />
          ))}
          <Button type="submit" variant="primary" icon={null} disabled={!chosen}>
            Check with API Setu
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted">API Setu is not switched on: check the original and record it here.</p>
      )}
      <details open={!s.apisetu}>
        <summary className="cursor-pointer text-sm underline underline-offset-4">Checked by hand instead</summary>
        <form noValidate className="mt-3 space-y-3" onSubmit={send(manual)}>
          <Field
            label="Certificate number"
            value={manual.number}
            onChange={(e) => setManual({...manual, number: e.target.value})}
          />
          <Field
            label="Issued by"
            value={manual.issuedBy}
            onChange={(e) => setManual({...manual, issuedBy: e.target.value})}
          />
          <Field
            label="Date of death"
            type="date"
            value={manual.date}
            onChange={(e) => setManual({...manual, date: e.target.value})}
          />
          <Button type="submit" variant="outline" icon={null}>
            Mark verified
          </Button>
        </form>
      </details>
    </div>
  );
}

function CaseDetail({id, onChange}) {
  const {user} = useSession();
  const one = useApi(`/vault/staff/cases/${id}`);
  const [note, setNote] = useState('');
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
        {c.stage === 'nominee-reached' && <CertificateForm id={id} run={run} />}
        {c.stage === 'verified' && user?.role === 'superadmin' && (
          <div className="space-y-3">
            <p className="text-sm">
              Certificate {c.certificate.number} ({c.certificate.issuedBy}),{' '}
              {c.certificate.method === 'api-setu' ? 'checked through API Setu' : 'checked by hand'}{' '}
              {formatDate(c.certificate.verifiedAt)}
              {c.certificate.read?.name && `; Pirento AI read the name "${c.certificate.read.name}"`}. Releasing texts
              the nominee a link that works for 30 days.
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
