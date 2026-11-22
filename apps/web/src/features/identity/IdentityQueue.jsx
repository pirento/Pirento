// Staff review of Bharat ID applications: the details, the Digio video KYC files and the signed declaration.
import {useState} from 'react';
import {declarationSigned, formatBharatId, kycDone} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {StaffQueue} from '../admin/StaffQueue';
import {SectionSummary} from './SectionSummary';
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
    ]}
    render={(d, reload) => <Application key={d._id} doc={d} onChange={reload} />}
  />
);
