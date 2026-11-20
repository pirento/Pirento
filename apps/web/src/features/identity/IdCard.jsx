// The issued Bharat ID card with its QR code, print and copy-link.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react';
import {Check, Copy, Printer} from 'lucide-react';
import {formatBharatId} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {formatDate} from '../../lib/format';

export function IdCard({doc}) {
  const [copied, setCopied] = useState(false);
  const link = `https://pirento.com/verify/${doc.bharatId}`;
  return (
    <div className="max-w-3xl">
      <div className="grid overflow-hidden rounded-[22px] border border-rule sm:grid-cols-[1fr_auto]" data-reveal>
        <div className="p-8">
          <p className="eyebrow">Bharat ID · by Pirento</p>
          <p className="display mt-6 text-[clamp(2rem,5vw,3.25rem)] tabular-nums">{formatBharatId(doc.bharatId)}</p>
          <p className="mt-6 text-xl">{doc.fullName}</p>
          <p className="mt-1 text-sm text-muted">
            {doc.state} · issued {formatDate(doc.issuedAt)}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 border-t border-rule bg-stone p-8 sm:border-t-0 sm:border-l">
          <QRCodeSVG
            value={link}
            size={128}
            bgColor="transparent"
            fgColor="currentColor"
            title="QR code that opens this ID's verify page"
          />
          <Link to={`/verify/${doc.bharatId}`} className="text-sm underline underline-offset-4">
            Verify page
          </Link>
        </div>
      </div>
      <div className="no-print mt-6 flex flex-wrap gap-3">
        <Button onClick={() => window.print()} variant="outline" icon={Printer}>
          Print
        </Button>
        <Button
          variant="outline"
          icon={copied ? Check : Copy}
          onClick={() =>
            navigator.clipboard.writeText(link).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            })
          }
        >
          {copied ? 'Copied' : 'Copy verify link'}
        </Button>
      </div>
    </div>
  );
}
