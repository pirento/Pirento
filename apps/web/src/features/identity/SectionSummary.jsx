// Read-only list of every saved step, then the Digio verification (applicant and staff see the same).
import {Pencil} from 'lucide-react';
import {ID_SECTIONS, declarationSigned, kycDone, kycFailed} from '@pirento/shared';
import {formatDate} from '../../lib/format';
import {DeclarationLink} from './DeclarationLink';

const KYC_STEP = ID_SECTIONS.length;
const SIGN_STEP = KYC_STEP + 1;

/** The video KYC line: Digio's state, or a video recorded on Pirento by older applications. */
function kycLine(doc) {
  if (doc?.kyc?.recordedAt && !doc.digio?.kycId) {
    return doc.kyc.deletedAt
      ? `Recorded on Pirento, checked, then deleted on ${formatDate(doc.kyc.deletedAt)}`
      : `Recorded on Pirento ${formatDate(doc.kyc.recordedAt)}`;
  }
  if (kycDone(doc)) return doc.digio.kycStatus === 'approved' ? 'Done and approved on Digio' : 'Done on Digio';
  if (kycFailed(doc)) return `Not passed on Digio (${doc.digio.kycStatus})`;
  return doc?.digio?.kycId ? 'Started on Digio, not finished' : 'Not started';
}

function Row({title, children, onEdit, editLabel}) {
  return (
    <div className="grid gap-3 p-5 sm:grid-cols-[12rem_1fr_auto]">
      <p className="font-medium">{title}</p>
      <div className="min-w-0 space-y-2 text-sm">{children}</div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 self-start text-sm underline underline-offset-4"
        >
          <Pencil aria-hidden className="size-3.5" /> {editLabel}
        </button>
      )}
    </div>
  );
}

export function SectionSummary({doc, email, onEdit, declarationPath}) {
  const sections = doc?.sections;
  const signed = declarationSigned(doc);
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
      <Row
        title="Video KYC"
        onEdit={onEdit && !kycDone(doc) ? () => onEdit(KYC_STEP) : null}
        editLabel={doc?.digio?.kycId ? 'Continue' : 'Start'}
      >
        <p>{kycLine(doc)}</p>
      </Row>
      {(doc?.digio?.kycId || !doc?.kyc?.recordedAt) && (
        <Row title="Declaration" onEdit={onEdit && !signed ? () => onEdit(SIGN_STEP) : null} editLabel="Sign">
          <p>
            {signed
              ? `Signed with Aadhaar eSign on ${formatDate(doc.digio.signedAt)}${doc.digio.stamped ? ', on e-stamp paper' : ''}`
              : 'Not signed yet'}
          </p>
          {signed && <DeclarationLink path={declarationPath} />}
        </Row>
      )}
    </div>
  );
}
