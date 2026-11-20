// /<product>/dashboard/receipts/:id: the payment receipt for one paid order, to print or save as PDF.
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, Printer} from 'lucide-react';
import {getProduct, statusLabel} from '@pirento/shared';
import {PirentoLogo, SiteLogo, hasLogo} from '../../components/layout/PirentoLogo';
import {brand, receipt as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {usePageMeta} from '../../lib/page';
import {hasReceipt, paidAt} from './receipts';

const METHOD = {wallet: 'Pirento wallet', razorpay: 'Card / UPI (Razorpay)'};

const Row = ({label, children, strong = false}) => (
  <div className={`flex justify-between gap-6 py-3 ${strong ? 'text-lg font-medium' : ''}`}>
    <dt className={strong ? '' : 'text-muted'}>{label}</dt>
    <dd className="text-right tabular-nums">{children}</dd>
  </div>
);

export function Receipt() {
  const {slug, id} = useParams();
  const {redirect, user} = useSignedIn({area: 'any'});
  const {data: order, error} = useApi(user ? `/orders/${id}` : null);
  usePageMeta({title: order ? `Receipt #${order.orderNo} — Pirento` : 'Receipt — Pirento'});
  if (redirect) return redirect;
  // The receipt lives under its own product's dashboard, so a Legal receipt never opens in Black's colours.
  if (error || (order && (!hasReceipt(order) || order.product !== slug))) return <NotFound />;
  if (!order) return <div className="min-h-dvh" />;

  const product = getProduct(order.product);
  const before = order.amount + (order.discount ?? 0);

  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          to={`/${slug}/dashboard/receipts`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" /> Back
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-sm hover:border-ink"
        >
          <Printer aria-hidden className="size-4" /> Print or save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-2xl rounded-[22px] border border-rule bg-paper p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-rule pb-8">
          {hasLogo(order.product) ? (
            <SiteLogo brand={order.product} alt={product?.name} className="h-12 w-auto" />
          ) : (
            <PirentoLogo alt="Pirento" className="h-8 w-auto" />
          )}
          <div className="sm:text-right">
            <h1 className="text-2xl">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted tabular-nums">No. {order.orderNo}</p>
          </div>
        </header>

        <dl className="grid gap-x-8 gap-y-4 border-b border-rule py-8 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Paid on</dt>
            <dd className="mt-1">{formatDate(paidAt(order))}</dd>
          </div>
          <div>
            <dt className="text-muted">Paid by</dt>
            <dd className="mt-1 break-words">
              {order.userId === user._id && user.name ? `${user.name}, ` : ''}
              {order.email}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Method</dt>
            <dd className="mt-1">
              {METHOD[order.payment.method]}
              {order.payment.razorpayPaymentId && (
                <span className="block text-muted">{order.payment.razorpayPaymentId}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Order status</dt>
            <dd className="mt-1">
              {statusLabel(order.status)}
              {order.payment.refunded && ' · refunded to your wallet'}
            </dd>
          </div>
        </dl>

        <div className="py-8">
          <p className="text-xs tracking-[0.12em] text-muted uppercase">{product?.name}</p>
          <p className="mt-2 font-medium">
            {order.serviceName}
            {order.quantity > 1 && ` × ${order.quantity}`}
          </p>
          <dl className="mt-6 divide-y divide-rule border-y border-rule">
            <Row label="Price">{inr(before / 100)}</Row>
            {order.discount > 0 && (
              <Row label={`Discount${order.coupon ? ` (${order.coupon})` : ''}`}>− {inr(order.discount / 100)}</Row>
            )}
            <Row label="Total paid" strong>
              {inr(order.amount / 100)}
            </Row>
          </dl>
        </div>

        <footer className="space-y-1 text-xs text-muted">
          <p className="text-ink">{brand.legalName}</p>
          <p>
            CIN {brand.cin} · GSTIN {brand.gstin}
          </p>
          <p>{brand.supportEmail}</p>
          <p className="pt-3">{copy.note}</p>
        </footer>
      </article>
    </div>
  );
}
