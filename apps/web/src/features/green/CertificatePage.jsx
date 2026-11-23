// /green/dashboard/certificates/:id: the certificate of one planted sponsorship (investment or donation), to print
// or save as PDF, with the number and QR anyone can check on Verify.
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, Printer} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {greenCertNo, hasGreenCert, isDonation} from '@pirento/shared';
import {SiteLogo} from '../../components/layout/PirentoLogo';
import {brand, green} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {useApi} from '../../lib/api/useApi';
import {formatDay, inr} from '../../lib/format';
import {usePageMeta} from '../../lib/page';

const copy = green.certificate;

export function Certificate() {
  const {id} = useParams();
  const {redirect, user} = useSignedIn();
  const {data: order, error} = useApi(user ? `/orders/${id}` : null);
  const number = order && greenCertNo(order);
  usePageMeta({title: number ? `Certificate ${number} — Pirento Green` : 'Certificate — Pirento Green'});
  if (redirect) return redirect;
  if (error || (order && (!hasGreenCert(order) || order.status === 'cancelled'))) return <NotFound />;
  if (!order) return <div className="min-h-dvh" />;

  const kind = isDonation(order) ? copy.donate : copy.invest;
  const f = order.fulfilment;
  const link = `https://pirento.com/verify/${number}`;
  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/green/dashboard/certificates"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" /> Back
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-sm hover:border-ink"
        >
          <Printer aria-hidden className="size-4" /> Download as PDF
        </button>
      </div>

      <article className="mx-auto max-w-3xl rounded-[22px] border-2 border-ink bg-paper p-6 text-center sm:p-12">
        <SiteLogo brand="green" alt="Pirento Green" className="mx-auto h-12 w-auto" />
        <p className="eyebrow mt-8">{kind.issuer}</p>
        <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight">{kind.title}</h1>
        <p className="mt-10 text-muted">This certifies that</p>
        <p className="display mt-3 text-[clamp(1.75rem,4vw,2.5rem)] break-words">{user.name || order.email}</p>
        <p className="mt-6 text-muted">{kind.line}</p>
        <p className="mt-3 text-xl font-medium">
          {order.quantity} tree{order.quantity === 1 ? '' : 's'} · {order.serviceName.replace(/^Sponsor trees · /, '')}
        </p>
        <p className="mt-2 break-words text-muted">
          Planted at {f.site}
          {f.plantedOn && ` on ${formatDay(f.plantedOn)}`}
        </p>

        <dl className="mx-auto mt-10 grid max-w-xl gap-4 border-y border-rule py-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Certificate</dt>
            <dd className="mt-1 font-medium tabular-nums">{number}</dd>
          </div>
          <div>
            <dt className="text-muted">{isDonation(order) ? 'Donated' : 'Invested'}</dt>
            <dd className="mt-1 font-medium tabular-nums">{inr(order.amount / 100)}</dd>
          </div>
          <div>
            <dt className="text-muted">Issued</dt>
            <dd className="mt-1 font-medium">{formatDay(f.at)}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col items-center gap-3">
          <QRCodeSVG value={link} size={96} bgColor="transparent" fgColor="currentColor" title={`Verify ${number}`} />
          <p className="text-sm text-muted">
            {copy.verify} <span className="break-all text-ink">pirento.com/verify/{number}</span>
          </p>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-xs text-muted">{kind.note}</p>
        <p className="mt-4 text-xs text-muted">
          {brand.legalName} · Order #{order.orderNo}
        </p>
      </article>
    </div>
  );
}
