// Business dashboard overview: where the account stands on the way to live keys, and what it has used.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check} from 'lucide-react';
import {CONSENT_FIELDS, authMethod} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {bharatIdBusiness as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {AppFrame} from '../products/AppFrame';

export function BusinessOverview({frame, data, reload}) {
  const {business, ownerIdIssued, keys, usage} = data;
  const [error, setError] = useState('');
  const live = business.status === 'live';
  const done = [
    true,
    Boolean(business.profile),
    ownerIdIssued,
    ['live_review', 'live'].includes(business.status),
    live,
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
    <AppFrame
      {...frame}
      title={business.profile?.legalName ?? business.request.company}
      intro={copy.dashboard.statuses[business.status]}
    >
      <DashSection n={1} id="steps" label="Status" title="On the way / to live keys.">
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
          <Link to="/bharat-id/business/dashboard/keys" className="text-sm underline underline-offset-4">
            API keys
          </Link>
          {error && (
            <p role="alert" className="text-sm">
              ⚠ {error}
            </p>
          )}
        </div>
      </DashSection>
      <DashSection n={2} id="allowed" label="Allowed" title="What our team / has opened for you.">
        <div className="grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border border-rule p-5">
            <p className="font-medium">Ways to check a holder</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {business.methods.length ? (
                business.methods.map((m) => <li key={m}>{authMethod(m)?.label ?? m}</li>)
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
      <DashSection n={3} id="usage" label="Usage" title="What your keys / have done.">
        <StatsRow
          compact
          stats={[
            {value: String(keys.length), label: 'Active keys'},
            {value: String(usage.testConsents), label: 'Test consents'},
            {value: String(usage.liveConsents), label: 'Live consents'},
            {value: String(usage.liveApproved), label: 'Allowed by holders'},
          ]}
        />
      </DashSection>
    </AppFrame>
  );
}
