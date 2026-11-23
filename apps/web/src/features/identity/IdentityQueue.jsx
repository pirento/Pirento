// Staff review of Bharat ID applications: the details, the Digio video KYC files and the signed declaration.
import {useState} from 'react';
import {declarationSigned, formatBharatId, kycDone} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {StaffQueue} from '../admin/StaffQueue';
import {SectionSummary} from './SectionSummary';
import {useApi} from '../../lib/api/useApi';
import {ChangeQueue} from './ChangeQueue';
import {DigioFiles} from './DigioFiles';
import {KycVideoPlayer} from './KycVideoPlayer';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';

function Application({doc, onChange}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const legacy = Boolean(doc.kyc?.recordedAt && !doc.digio?.kycId);
  const verified = legacy || (kycDone(doc) && declarationSigned(doc));
  const refresh = async () => {
    setError('');
    setBusy(true);
    try {
      await api(`/identity/staff/${doc._id}/refresh`, {method: 'POST'});
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const send = async (path, body) => {
    setError('');
    try {
      await api(`/identity/staff/${doc._id}${path}`, {method: 'PATCH', body});
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  const decide = (decision) => send('', {decision, reason});
  const hold = (action) => send('/hold', {action, reason});
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">{doc.fullName ?? doc.email}</span>
          <span className="text-sm text-muted">
            {doc.email} · {formatDate(doc.submittedAt ?? doc.createdAt)}
          </span>
        </span>
        <span className="flex flex-wrap gap-2">
          {doc.status === 'suspended' && <Tag tone="accent">Suspended</Tag>}
          <Tag tone={doc.status === 'submitted' ? 'accent' : 'rule'}>
            {doc.bharatId ? formatBharatId(doc.bharatId) : doc.status}
          </Tag>
        </span>
      </summary>
      <div className="space-y-6 pb-8">
        <Flags id={doc._id} />
        <SectionSummary doc={doc} email={doc.email} declarationPath={`/api/identity/staff/${doc._id}/declaration`} />
        {legacy ? (
          doc.status === 'submitted' && <KycVideoPlayer doc={doc} />
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">Video KYC on Digio</p>
              <button type="button" onClick={refresh} disabled={busy} className="text-sm underline underline-offset-4">
                {busy ? 'Asking Digio' : 'Refresh from Digio'}
              </button>
            </div>
            <DigioFiles doc={doc} />
          </div>
        )}
        <p className="text-sm text-muted">
          Email is verified by sign-in. Aadhaar passed its checksum; only its last 4 digits are kept. Digio's video KYC
          checks the person; the declaration is signed with their Aadhaar eSign. Check that the KYC files and the signed
          declaration match the details above.
        </p>
        {doc.reason && <p className="text-sm">Reason given: {doc.reason}</p>}
        {doc.status === 'suspended' && (
          <p className="text-sm">
            Suspended on {formatDate(doc.suspension?.at)}: {doc.suspension?.reason}
          </p>
        )}
        {(doc.status === 'approved' || doc.status === 'suspended') && (
          <div className="max-w-xl">
            {doc.status === 'approved' && (
              <Field
                label="Reason (needed to suspend)"
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                error={error}
              />
            )}
            {doc.status === 'suspended' && error && (
              <p role="alert" className="text-sm">
                ⚠ {error}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              {doc.status === 'approved' ? (
                <Button onClick={() => hold('suspend')} variant="outline" icon={null}>
                  Suspend this ID
                </Button>
              ) : (
                <Button onClick={() => hold('restore')} icon={null}>
                  Restore this ID
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              A suspended ID stops working everywhere at once: sign-in, its verify page, business checks, Pirento One
              and Vault. The holder is emailed either way.
            </p>
          </div>
        )}
        {doc.status === 'submitted' && (
          <div className="max-w-xl">
            {!verified && (
              <p className="mb-4 text-sm">
                The video KYC is not finished or the declaration is not signed on Digio yet.
              </p>
            )}
            <Field
              label="Reason (needed to reject)"
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              error={error}
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={() => decide('approve')} icon={null} disabled={!verified}>
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
      {label: 'Suspended', value: 'suspended'},
    ]}
    render={(d, reload) => <Application key={d._id} doc={d} onChange={reload} />}
  />
);

/** Warning signs (the same PAN, mobile, or Aadhaar ending and birth date on another person's application). */
function Flags({id}) {
  const flags = useApi(`/identity/staff/${id}/flags`);
  if (!flags.data?.length) return null;
  return (
    <ul className="space-y-1 rounded-[14px] border border-accent p-4 text-sm" role="alert">
      {flags.data.map((f) => (
        <li key={f.detail}>
          ⚠ <span className="font-medium">{f.flag}:</span> {f.detail}
        </li>
      ))}
      <li className="text-xs text-muted">Check before deciding; a family can share a mobile.</li>
    </ul>
  );
}

/** The Bharat ID admin page: applications and issued IDs, or the changes holders ask for. */
export function IdentityAdmin() {
  const [view, setView] = useState('applications');
  return (
    <>
      <div role="tablist" aria-label="View" className="mt-8 flex flex-wrap gap-2">
        {[
          ['applications', 'Applications and IDs'],
          ['changes', 'Change requests'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`rounded-full border px-4 py-2 text-sm ${view === id ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'changes' ? <ChangeQueue /> : <IdentityQueue />}
    </>
  );
}
