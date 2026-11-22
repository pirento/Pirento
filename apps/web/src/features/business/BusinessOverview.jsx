// Business console overview: the numbers that matter, the way to live keys, a quick start, and what is open to you.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check} from 'lucide-react';
import {CONSENT_FIELDS, TEST_BHARAT_IDS, authMethod} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {bharatIdBusiness as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';
import {AppFrame} from '../products/AppFrame';
import {apiBase} from './apiSample';

export function BusinessOverview({frame, data, reload}) {
  const {business, ownerIdIssued, keys, usage} = data;
  const wallet = useApi('/wallet');
  const [error, setError] = useState('');
  const done = [
    true,
    Boolean(business.profile),
    ownerIdIssued,
    ['live_review', 'live'].includes(business.status),
    business.status === 'live',
  ];
  const ready = business.status === 'test' && business.profile && ownerIdIssued;
  const askLive = async () => {
    setError('');
    try {
      await api('/identity/business/me/live', {method: 'POST'});
      reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const next =
    business.status !== 'test'
      ? null
      : !business.profile
        ? {to: '/bharat-id/business/dashboard/company', label: 'Add company details'}
        : !ownerIdIssued
          ? {to: '/bharat-id/dashboard', label: 'Get your own Bharat ID'}
          : null;

  return (
    <AppFrame {...frame} title="Overview." intro={copy.dashboard.statuses[business.status]}>
      <StatsRow
        compact
        stats={[
          {value: wallet.data ? inr(wallet.data.balance / 100) : '…', label: 'Credit'},
          {value: String(usage.calls30d), label: 'Live calls, 30 days'},
          {value: String(usage.checksPassed), label: 'Live checks passed'},
          {value: String(usage.liveApproved), label: 'Consents allowed'},
        ]}
      />

      {business.status !== 'live' && (
        <DashSection n={1} id="steps" label="Go live" title="On the way / to live keys.">
          <ol className="grid gap-3 sm:grid-cols-5">
            {copy.dashboard.steps.map((label, i) => (
              <li
                key={label}
                className={`flex items-center gap-3 rounded-[14px] border p-4 text-sm ${done[i] ? 'border-ink' : 'border-rule'}`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${done[i] ? 'border-ink bg-ink text-paper' : 'border-rule'}`}
                >
                  {done[i] ? <Check aria-hidden className="size-3.5" /> : i + 1}
                </span>
                <span className={done[i] ? '' : 'text-muted'}>{label}</span>
              </li>
            ))}
          </ol>
          {business.reason && (
            <p className="body mt-6 max-w-3xl">
              <strong>From our team:</strong> {business.reason}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {next && (
              <Button to={next.to} variant="accent">
                {next.label}
              </Button>
            )}
            {ready && (
              <Button onClick={askLive} variant="accent">
                Ask for live access
              </Button>
            )}
            {error && (
              <p role="alert" className="text-sm">
                ⚠ {error}
              </p>
            )}
          </div>
        </DashSection>
      )}

      <DashSection
        n={business.status === 'live' ? 1 : 2}
        id="start"
        label="Quick start"
        title="Three steps / to your first call."
      >
        <ol className="grid gap-4 lg:grid-cols-3">
          <li className="rounded-[18px] border border-rule p-5">
            <p className="text-xs text-muted">01</p>
            <p className="mt-2 font-medium">Make a test key</p>
            <p className="mt-1 text-sm text-muted">
              {keys.length
                ? `You have ${keys.length} active ${keys.length === 1 ? 'key' : 'keys'}.`
                : 'You have no key yet.'}
            </p>
            <Link
              to="/bharat-id/business/dashboard/keys"
              className="mt-3 inline-block text-sm underline underline-offset-4"
            >
              API keys
            </Link>
          </li>
          <li className="min-w-0 rounded-[18px] border border-rule p-5">
            <p className="text-xs text-muted">02</p>
            <p className="mt-2 font-medium">Verify a sandbox ID</p>
            <pre className="mt-3 overflow-x-auto rounded-[10px] bg-stone p-3 text-xs">
              <code>{`curl ${apiBase()}/ids/${TEST_BHARAT_IDS.approves} \\\n  -H "Authorization: Bearer bid_test_…"`}</code>
            </pre>
          </li>
          <li className="rounded-[18px] border border-rule p-5">
            <p className="text-xs text-muted">03</p>
            <p className="mt-2 font-medium">Check a person, ask for consent</p>
            <p className="mt-1 text-sm text-muted">
              Each call, with its answer and the sandbox values, is in the reference.
            </p>
            <Link
              to="/bharat-id/business/dashboard/docs"
              className="mt-3 inline-block text-sm underline underline-offset-4"
            >
              API reference
            </Link>
          </li>
        </ol>
      </DashSection>

      <DashSection
        n={business.status === 'live' ? 2 : 3}
        id="allowed"
        label="Allowed"
        title="What our team / has opened for you."
      >
        <div className="grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border border-rule p-5">
            <p className="font-medium">Ways to check a holder</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {business.methods.length ? (
                business.methods.map((m) => (
                  <li key={m}>
                    {authMethod(m)?.label ?? m} · L{authMethod(m)?.level}
                  </li>
                ))
              ) : (
                <li>None yet: ask our team.</li>
              )}
            </ul>
          </div>
          <div className="rounded-[18px] border border-rule p-5">
            <p className="font-medium">Details you may ask for</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {business.fields.length ? (
                business.fields.map((f) => <li key={f}>{CONSENT_FIELDS[f]}</li>)
              ) : (
                <li>None yet: ask our team.</li>
              )}
            </ul>
          </div>
        </div>
      </DashSection>
    </AppFrame>
  );
}
