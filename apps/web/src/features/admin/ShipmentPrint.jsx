// /admin/shipments/:id/print: one parcel's shipping label (from, to, the waybill as a Code 128 barcode, weight and
// pieces) and, for an order's box, its packing slip and invoice, to print or save as PDF. The print stylesheet drops
// the sidebar; the label breaks onto its own page.
import {Link, Navigate, useParams} from 'react-router-dom';
import {ArrowLeft, Printer} from 'lucide-react';
import {PirentoLogo, SiteLogo, hasLogo} from '../../components/layout/PirentoLogo';
import {brand, receipt as receiptCopy, shippingCopy as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {useApi} from '../../lib/api/useApi';
import {code128} from '../../lib/barcode';
import {formatDate, inr} from '../../lib/format';
import {usePageMeta} from '../../lib/page';
import {isStaffRole} from './adminNav';

const METHOD = {wallet: 'Pirento wallet', razorpay: 'Card / UPI (Razorpay)'};

/** The waybill as bars, drawn in the ink colour so it prints black. */
function Barcode({value}) {
  const widths = code128(value);
  if (!widths) return null;
  const total = widths.reduce((a, b) => a + b, 0);
  let x = 0;
  return (
    <svg
      viewBox={`0 0 ${total + 20} 60`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className="h-20 w-full"
      role="img"
      aria-label={`Barcode ${value}`}
    >
      {widths.map((w, i) => {
        const bar = i % 2 === 0 && <rect key={i} x={x + 10} y={0} width={w} height={60} fill="var(--ink)" />;
        x += w;
        return bar;
      })}
    </svg>
  );
}

const Block = ({label, a}) => (
  <div>
    <p className="text-[0.65rem] tracking-[0.12em] text-muted uppercase">{label}</p>
    <p className="mt-1 font-medium">{a?.name}</p>
    <p className="text-sm whitespace-pre-line">{a?.address}</p>
    <p className="text-sm">
      {a?.pincode && `PIN ${a.pincode}`}
      {a?.mobile && ` · ${a.mobile}`}
    </p>
  </div>
);

export function ShipmentPrint() {
  const {id} = useParams();
  const {redirect, user} = useSignedIn({loginPath: '/admin/login', area: 'any'});
  const {data} = useApi(user && isStaffRole(user.role) ? `/orders/staff/shipments/${id}` : null);
  usePageMeta({title: data ? `Parcel #${data.shipment.shipmentNo} — Pirento Admin` : 'Parcel — Pirento Admin'});
  if (redirect) return redirect;
  if (user && !isStaffRole(user.role)) return <Navigate to="/dashboard" replace />;
  if (!data) return <div className="min-h-dvh" />;
  const {shipment: s, order, shipper} = data;
  const before = order ? order.amount + (order.discount ?? 0) : 0;

  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link to="/admin/shipments" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {copy.back}
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-sm hover:border-ink"
        >
          <Printer aria-hidden className="size-4" /> {copy.print}
        </button>
      </div>

      {/* The label: about 4 × 6 inches, black on white. */}
      <article className="mx-auto max-w-md rounded-[14px] border-2 border-ink bg-paper p-5 break-after-page">
        <header className="flex items-center justify-between gap-4 border-b-2 border-ink pb-3">
          <PirentoLogo alt="Pirento" className="h-6 w-auto" />
          <p className="text-right text-sm font-medium">
            Blue Dart · {copy.priority}
            <span className="block text-xs text-muted">
              #{s.shipmentNo}
              {s.orderNo && ` · order #${s.orderNo}`}
            </span>
          </p>
        </header>
        <div className="border-b-2 border-ink py-4">
          <Block label={copy.to} a={s.to} />
        </div>
        <div className="border-b-2 border-ink py-4 text-center">
          {s.awb ? (
            <>
              <Barcode value={s.awb} />
              <p className="mt-1 font-mono text-lg tracking-[0.2em]">{s.awb}</p>
            </>
          ) : (
            <p className="py-6 text-sm">{copy.noAwb}</p>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2 border-b-2 border-ink py-3 text-center text-sm">
          <div>
            <dt className="text-[0.65rem] text-muted uppercase">{copy.weight}</dt>
            <dd>{s.weightKg} kg</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] text-muted uppercase">{copy.pieces}</dt>
            <dd>{s.pieces}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] text-muted uppercase">{copy.value}</dt>
            <dd>{inr(s.value ?? 0)}</dd>
          </div>
        </dl>
        <div className="pt-4">
          <Block label={copy.from} a={shipper} />
        </div>
      </article>

      {order && (
        <article className="mx-auto mt-10 max-w-2xl rounded-[22px] border border-rule bg-paper p-6 sm:p-10">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-rule pb-8">
            {hasLogo(order.product) ? (
              <SiteLogo brand={order.product} alt={order.productName} className="h-12 w-auto" />
            ) : (
              <PirentoLogo alt="Pirento" className="h-8 w-auto" />
            )}
            <div className="sm:text-right">
              <h1 className="text-2xl">{copy.invoice}</h1>
              <p className="mt-1 text-sm text-muted tabular-nums">No. {order.orderNo}</p>
            </div>
          </header>
          <dl className="grid gap-x-8 gap-y-4 border-b border-rule py-8 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">{copy.billedTo}</dt>
              <dd className="mt-1 break-words">{order.email}</dd>
            </div>
            <div>
              <dt className="text-muted">{copy.shipTo}</dt>
              <dd className="mt-1">
                {s.to.name}, {s.to.address}, {s.to.pincode}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{copy.paidOn}</dt>
              <dd className="mt-1">{formatDate(order.paidAt ?? order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">{copy.method}</dt>
              <dd className="mt-1">{METHOD[order.payment?.method] ?? '—'}</dd>
            </div>
          </dl>
          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-muted">
                <th className="pb-2 font-normal">{copy.item}</th>
                <th className="pb-2 text-right font-normal">{copy.qty}</th>
                <th className="pb-2 text-right font-normal">{copy.amount}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-rule">
                <td className="py-3">
                  {order.serviceName}
                  {order.package?.name && <span className="text-muted"> · {order.package.name}</span>}
                </td>
                <td className="py-3 text-right tabular-nums">{order.quantity ?? 1}</td>
                <td className="py-3 text-right tabular-nums">{inr(before / 100)}</td>
              </tr>
              {order.discount > 0 && (
                <tr className="border-b border-rule">
                  <td className="py-3" colSpan={2}>
                    {copy.discount}
                    {order.coupon && ` (${order.coupon})`}
                  </td>
                  <td className="py-3 text-right tabular-nums">− {inr(order.discount / 100)}</td>
                </tr>
              )}
              <tr>
                <td className="py-3 text-lg font-medium" colSpan={2}>
                  {copy.total}
                </td>
                <td className="py-3 text-right text-lg font-medium tabular-nums">{inr(order.amount / 100)}</td>
              </tr>
            </tbody>
          </table>
          <footer className="mt-8 space-y-1 text-xs text-muted">
            <p className="text-ink">{brand.legalName}</p>
            <p>
              CIN {brand.cin} · GSTIN {brand.gstin}
            </p>
            <p>{brand.supportEmail}</p>
            <p className="pt-3">
              {copy.awb}: {s.awb ?? '—'}. {receiptCopy.note}
            </p>
          </footer>
        </article>
      )}
    </div>
  );
}
