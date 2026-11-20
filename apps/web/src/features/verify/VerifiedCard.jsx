// The result card for a verified ID, certificate or completion code.
import {BadgeCheck} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {formatBharatId} from '@pirento/shared';
import {formatDate} from '../../lib/format';

export const verifyPath = (code) =>
  /^\d{10}$/.test(code)
    ? `/identity/verify/${code}`
    : code.startsWith('PC-')
      ? `/learning/verify/${code}`
      : `/orders/verify/${code}`;

export function VerifiedCard({code, data}) {
  const rows = /^\d{10}$/.test(code)
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
    <div className="flex max-w-2xl flex-wrap items-start justify-between gap-8 rounded-[22px] border border-accent p-8">
      <div>
        <p className="flex items-center gap-2 font-medium">
          <BadgeCheck aria-hidden className="size-5" /> Verified
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
