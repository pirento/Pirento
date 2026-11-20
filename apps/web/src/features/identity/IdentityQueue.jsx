// Staff review of Bharat ID applications.
import {useState} from 'react';
import {formatBharatId} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {StaffQueue} from '../admin/StaffQueue';
import {SectionSummary} from './SectionSummary';
import {KycVideoPlayer} from './KycVideoPlayer';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';

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
        <SectionSummary sections={doc.sections} email={doc.email} kyc={doc.kyc ?? null} />
        {doc.status === 'submitted' && doc.kyc?.recordedAt && <KycVideoPlayer doc={doc} />}
        <p className="text-sm text-muted">
          Email is verified by sign-in. The mobile number is not verified by SMS yet. Aadhaar passed its checksum. Check
          by eye that the person in the video says their name and the code, and matches the details.
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
