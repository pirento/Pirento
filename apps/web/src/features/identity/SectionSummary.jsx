// Read-only list of every saved step (applicant and staff see the same).
import {Pencil} from 'lucide-react';
import {ID_SECTIONS} from '@pirento/shared';
import {formatDate} from '../../lib/format';

export function SectionSummary({sections, email, kyc, onEdit}) {
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
      {kyc !== undefined && (
        <div className="grid gap-3 p-5 sm:grid-cols-[12rem_1fr_auto]">
          <p className="font-medium">Video verification</p>
          <p className="text-sm">
            {kyc?.deletedAt
              ? `Checked, then deleted on ${formatDate(kyc.deletedAt)}`
              : kyc?.recordedAt
                ? `Recorded ${formatDate(kyc.recordedAt)}`
                : 'Not recorded yet'}
          </p>
          {onEdit && (
            <button
              onClick={() => onEdit(ID_SECTIONS.length)}
              className="inline-flex items-center gap-1 self-start text-sm underline underline-offset-4"
            >
              <Pencil aria-hidden className="size-3.5" /> {kyc?.recordedAt ? 'Record again' : 'Record'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
