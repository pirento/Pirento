// The result card for a verified ID, certificate or completion code.
import {BadgeCheck, XCircle} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {formatBharatId, parseGreenRef} from '@pirento/shared';
import {formatDate, formatDay} from '../../lib/format';

// A Pirento Green certificate (PG-/PF-) or an order number (6–9 digits) is checked as a Green certificate.
const isGreen = (code) => Boolean(parseGreenRef(code));

export const verifyPath = (code) =>
  /^\d{10}$/.test(code)
    ? `/identity/verify/${code}`
    : code.startsWith('PC-')
      ? `/learning/verify/${code}`
      : isGreen(code)
        ? `/orders/green/certificates/${code}`
        : `/orders/verify/${code}`;

export function VerifiedCard({code, data}) {
  const rows = isGreen(code)
    ? {
        title: data.donation ? 'Tree donation certificate' : 'Tree investment certificate',
        lines: [
          `${data.donation ? 'Pirento Foundation' : 'Pirento Green'} · ${data.number} · order #${data.orderNo}`,
          `${data.trees} tree${data.trees === 1 ? '' : 's'} · ${data.drive.replace(/^Sponsor trees · /, '')}`,
          `Planted at ${data.site}${data.plantedOn ? ` on ${formatDay(data.plantedOn)}` : ''} · issued ${formatDay(data.issuedAt)}`,
        ],
      }
    : /^\d{10}$/.test(code)
      ? {
          title: data.name,
          lines: [`Bharat ID ${formatBharatId(data.bharatId)}`, `${data.state} · issued ${formatDate(data.issuedAt)}`],
        }
      : code.startsWith('PC-')
        ? {
            title: data.fullName,
            lines: [
              `${data.trackName} · scored ${data.percent}%`,
              `Theory ${data.skills?.theoretical ?? '—'}% · Practical ${data.skills?.practical ?? '—'}%`,
              `Issued ${formatDate(data.issuedAt)} · ${data.code}`,
            ],
          }
        : {title: data.serviceName, lines: [`Completed ${formatDate(data.completedAt)} · ${data.code}`]};
  return (
    <div
      className={`flex max-w-2xl flex-wrap items-start justify-between gap-8 rounded-[22px] border p-8 ${data.valid === false ? 'border-ink' : 'border-accent'}`}
    >
      <div>
        <p className="flex items-center gap-2 font-medium">
          {data.valid === false ? (
            <>
              <XCircle aria-hidden className="size-5" /> No longer valid: its order was cancelled
            </>
          ) : (
            <>
              <BadgeCheck aria-hidden className="size-5" /> Verified
            </>
          )}
        </p>
        <p className="display mt-6 text-3xl">{rows.title}</p>
        {rows.lines.map((l) => (
          <p key={l} className="mt-2 text-muted">
            {l}
          </p>
        ))}
      </div>
      <QRCodeSVG
        value={`https://pirento.com/verify/${code}`}
        size={112}
        bgColor="transparent"
        fgColor="currentColor"
        title={`QR code for verify link ${code}`}
      />
    </div>
  );
}
