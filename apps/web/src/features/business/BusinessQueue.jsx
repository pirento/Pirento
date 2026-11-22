// Admin: Bharat ID for Business requests and accounts. Approving makes the account and emails the sign-in;
// live access opens after the company details and the owner's Bharat ID are checked.
import {useState} from 'react';
import {BUSINESS_PROFILE, BUSINESS_REQUEST} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';
import {StaffQueue} from '../admin/StaffQueue';
import {AccessLogView, BusinessAccess} from './BusinessAccess';
import {BusinessPrices} from './BusinessPrices';

// What staff may do in each status, and the button's words.
const ACTIONS = {
  requested: [
    ['approve', 'Approve and email the sign-in'],
    ['reject', 'Reject'],
  ],
  live_review: [
    ['live', 'Open live access'],
    ['sendBack', 'Send back'],
  ],
  test: [['suspend', 'Suspend']],
  live: [['suspend', 'Suspend']],
  suspended: [['restore', 'Restore']],
};
const NEEDS_REASON = ['reject', 'sendBack', 'suspend'];

function Facts({fields, values}) {
  return (
    <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
      {fields
        .filter((f) => values?.[f.id])
        .map((f) => (
          <div key={f.id}>
            <dt className="text-muted">{f.label}</dt>
            <dd className="break-words">{values[f.id]}</dd>
          </div>
        ))}
    </dl>
  );
}

function Business({b, onChange}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const decide = async (decision) => {
    setError('');
    if (NEEDS_REASON.includes(decision) && !reason.trim()) return setError('Write the reason first');
    setBusy(true);
    try {
      await api(`/identity/staff/business/${b._id}`, {method: 'PATCH', body: {decision, reason}});
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const actions = ACTIONS[b.status] ?? [];
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">{b.profile?.legalName ?? b.request.company}</span>
          <span className="text-sm text-muted">
            {b.request.type} · {b.request.email} · {formatDate(b.createdAt)}
          </span>
        </span>
        <Tag tone={['requested', 'live_review'].includes(b.status) ? 'accent' : 'rule'}>
          {b.status.replace('_', ' ')}
        </Tag>
      </summary>
      <div className="space-y-6 pb-8">
        <section className="rounded-[18px] border border-rule p-5">
          <p className="mb-4 font-medium">Request</p>
          <Facts fields={BUSINESS_REQUEST.fields} values={b.request} />
        </section>
        {b.profile && (
          <section className="rounded-[18px] border border-rule p-5">
            <p className="mb-4 font-medium">Company details</p>
            <Facts fields={BUSINESS_PROFILE.fields} values={b.profile} />
          </section>
        )}
        <p className="text-sm text-muted">
          {b.approvedAt && `Approved ${formatDate(b.approvedAt)}. `}
          {b.liveRequestedAt && `Live asked ${formatDate(b.liveRequestedAt)}. `}
          {b.liveAt && `Live since ${formatDate(b.liveAt)}. `}
          {b.status === 'live_review' &&
            'Check the company details against their registration; the server already checked that the person signing in has an issued Bharat ID.'}
        </p>
        {b.reason && <p className="text-sm">Reason given: {b.reason}</p>}
        {b.status !== 'requested' && b.status !== 'rejected' && (
          <>
            <BusinessAccess b={b} onChange={onChange} />
            <AccessLogView b={b} />
          </>
        )}
        {actions.length > 0 && (
          <div className="max-w-xl">
            {actions.some(([d]) => NEEDS_REASON.includes(d)) && (
              <Field
                label="Reason (sent to them; needed to reject, send back or suspend)"
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map(([decision, label], i) => (
                <Button
                  key={decision}
                  onClick={() => decide(decision)}
                  variant={i ? 'outline' : 'primary'}
                  icon={null}
                  disabled={busy}
                >
                  {label}
                </Button>
              ))}
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm">
                ⚠ {error}
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

export const BusinessQueue = () => (
  <>
    <div className="mt-8">
      <BusinessPrices />
    </div>
    <StaffQueue
      path="/identity/staff/business"
      search="Company or email"
      filters={[
        {label: 'Requests', value: 'requested'},
        {label: 'Live review', value: 'live_review'},
        {label: 'Test', value: 'test'},
        {label: 'Live', value: 'live'},
        {label: 'Suspended', value: 'suspended'},
        {label: 'Rejected', value: 'rejected'},
      ]}
      render={(b, reload) => <Business key={b._id} b={b} onChange={reload} />}
    />
  </>
);
