// /admin/shipments/:id/print and /admin/shipments/print?ids=a,b: shipping labels and invoices, each on its own page,
// printed in one go. Two formats: 4 × 6 inch for a thermal label printer, or A4 (the label in a cut-out box). Choose
// labels, invoices or both; the page sets the paper size itself, prints in pure black, and marks the parcels printed.
import {useState} from 'react';
import {Link, Navigate, useParams, useSearchParams} from 'react-router-dom';
import {ArrowLeft, Printer} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {PirentoLogo, SiteLogo, hasLogo} from '../../components/layout/PirentoLogo';
import {brand, receipt as receiptCopy, shippingCopy as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {code128} from '../../lib/barcode';
import {formatDate, inr} from '../../lib/format';
import {usePageMeta} from '../../lib/page';
import {isStaffRole} from './adminNav';
import {InvoiceDoc} from '../orders/InvoiceDoc';
import {FormatPicker, PrintArea, Sheet, useAfterPrint, useFormat, usePrintPaper} from '../orders/print';

const METHOD = {wallet: 'Pirento wallet', razorpay: 'Card / UPI (Razorpay)'};
/** Code 128 bars in the ink colour, crisp so a scanner reads them. */
function Barcode({value, height = 60}) {
  const widths = code128(value);
  if (!widths) return null;
  const total = widths.reduce((a, b) => a + b, 0);
  let x = 0;
  return (
    <svg
      viewBox={`0 0 ${total + 20} ${height}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className="w-full"
      style={{height: height === 60 ? '0.85in' : '0.4in'}}
      role="img"
      aria-label={`Barcode ${value}`}
    >
      {widths.map((w, i) => {
        const bar = i % 2 === 0 && <rect key={i} x={x + 10} y={0} width={w} height={height} fill="var(--ink)" />;
        x += w;
        return bar;
      })}
    </svg>
  );
}

const lines = (a) => [a?.name, a?.address, [a?.pincode && `PIN ${a.pincode}`, a?.mobile].filter(Boolean).join(' · ')];

/** The 4 × 6 inch label: carrier, ship-to with the PIN code large, the waybill barcode, parcel facts, the order with
 * a QR to it, contents and the return address. */
function Label({p}) {
  const {shipment: s, order, shipper} = p;
  const qr = order
    ? `${window.location.origin}/${order.product}/dashboard/orders/${order._id}`
    : `AWB ${s.awb ?? '-'} · Pirento parcel #${s.shipmentNo}`;
  const size = s.size?.lengthCm ? `${s.size.lengthCm}×${s.size.breadthCm}×${s.size.heightCm} cm` : '—';
  return (
    <div className="flex h-full flex-col border-2 border-ink text-[10pt] leading-tight">
      <div className="flex items-center justify-between gap-2 border-b-2 border-ink px-3 py-2">
        <PirentoLogo alt="Pirento" className="h-5 w-auto" />
        <div className="text-right">
          <p className="text-[12pt] font-bold tracking-wide">BLUE DART</p>
          <p className="text-[8pt]">
            {copy.priority}
            {order && ` · ${copy.prepaid}`}
          </p>
        </div>
      </div>
      <div className="flex gap-2 border-b-2 border-ink px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[7pt] font-bold tracking-[0.12em] uppercase">{copy.to}</p>
          <p className="mt-0.5 text-[12pt] font-bold">{s.to?.name}</p>
          <p className="text-[9pt] break-words">{s.to?.address}</p>
          <p className="mt-0.5 text-[9pt]">Mob {s.to?.mobile}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center border-2 border-ink px-2 py-1">
          <p className="text-[7pt] font-bold uppercase">PIN</p>
          <p className="font-mono text-[18pt] leading-none font-bold">{s.to?.pincode}</p>
        </div>
      </div>
      <div className="border-b-2 border-ink px-3 py-2 text-center">
        {s.awb ? (
          <>
            <Barcode value={s.awb} />
            <p className="mt-1 font-mono text-[13pt] font-bold tracking-[0.25em]">{s.awb}</p>
          </>
        ) : (
          <p className="py-6 font-bold">{copy.noAwb}</p>
        )}
      </div>
      <dl className="grid grid-cols-4 border-b-2 border-ink text-center text-[8pt]">
        {[
          [copy.weight, `${s.weightKg} kg`],
          [copy.pieces, s.pieces],
          [copy.value, inr(s.value ?? 0)],
          [copy.box, size],
        ].map(([k, v], i) => (
          <div key={k} className={`px-1 py-1.5 ${i ? 'border-l-2 border-ink' : ''}`}>
            <dt className="text-[6.5pt] font-bold uppercase">{k}</dt>
            <dd className="mt-0.5 font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-1 gap-2 border-b-2 border-ink px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[7pt] font-bold tracking-[0.12em] uppercase">{copy.contents}</p>
          <p className="text-[9pt]">
            {order ? `${order.serviceName}${order.package?.name ? ` · ${order.package.name}` : ''}` : s.purpose}
            {order && ` × ${order.quantity ?? 1}`}
          </p>
          {order && (
            <div className="mt-1">
              <Barcode value={String(order.orderNo)} height={30} />
              <p className="font-mono text-[8pt]">
                {copy.order} #{order.orderNo}
              </p>
            </div>
          )}
        </div>
        <div className="shrink-0 text-center">
          <QRCodeSVG value={qr} size={72} level="M" fgColor="currentColor" bgColor="transparent" />
          <p className="mt-0.5 text-[6pt]">{order ? copy.scanOrder : copy.scanParcel}</p>
        </div>
      </div>
      <div className="px-3 py-2 text-[7.5pt]">
        <p className="font-bold uppercase">{copy.from}</p>
        {lines(shipper)
          .filter(Boolean)
          .map((l) => (
            <p key={l}>{l}</p>
          ))}
        <p className="mt-1">
          {copy.parcel} #{s.shipmentNo}
          {p.invoice && ` · ${copy.invoiceNo} ${p.invoice.invoiceNo}`} · {formatDate(new Date())}
        </p>
      </div>
    </div>
  );
}

/** The packing slip and invoice; tight on a 4 × 6 sheet, roomy on A4. */
/** The packing slip for an order paid before invoices were issued (it has no invoice of its own). */
function PackingSlip({p, a4}) {
  const {shipment: s, order} = p;
  const before = order.amount + (order.discount ?? 0);
  const t = a4
    ? {pad: 'p-[14mm]', big: 'text-2xl', body: 'text-sm', logo: 'h-12'}
    : {pad: 'p-3', big: 'text-[12pt] font-bold', body: 'text-[8pt]', logo: 'h-7'};
  return (
    <div className={`flex h-full flex-col ${t.pad} ${t.body} leading-snug`}>
      {/* div, not header/footer: the site print stylesheet hides those. */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-ink pb-2">
        {hasLogo(order.product) ? (
          <SiteLogo brand={order.product} alt={order.productName} className={`${t.logo} w-auto`} />
        ) : (
          <PirentoLogo alt="Pirento" className={`${t.logo} w-auto`} />
        )}
        <div className="text-right">
          <h2 className={t.big}>{copy.invoice}</h2>
          <p className="tabular-nums">
            No. {order.orderNo} · {formatDate(order.paidAt ?? order.createdAt)}
          </p>
        </div>
      </div>
      <dl className={`grid grid-cols-2 gap-x-3 gap-y-1.5 border-b border-ink py-2 ${a4 ? 'gap-y-4 py-6' : ''}`}>
        <div>
          <dt className="font-bold">{copy.billedTo}</dt>
          <dd className="break-words">{order.email}</dd>
        </div>
        <div>
          <dt className="font-bold">{copy.shipTo}</dt>
          <dd>
            {s.to.name}, {s.to.address}, {s.to.pincode}
          </dd>
        </div>
        <div>
          <dt className="font-bold">{copy.method}</dt>
          <dd>{METHOD[order.payment?.method] ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-bold">{copy.awb}</dt>
          <dd className="font-mono">{s.awb ?? '—'}</dd>
        </div>
      </dl>
      <table className={`w-full ${a4 ? 'mt-6' : 'mt-2'}`}>
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="pb-1">{copy.item}</th>
            <th className="pb-1 text-right">{copy.qty}</th>
            <th className="pb-1 text-right">{copy.amount}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-ink">
            <td className="py-1.5">
              {order.serviceName}
              {order.package?.name && ` · ${order.package.name}`}
            </td>
            <td className="py-1.5 text-right tabular-nums">{order.quantity ?? 1}</td>
            <td className="py-1.5 text-right tabular-nums">{inr(before / 100)}</td>
          </tr>
          {order.discount > 0 && (
            <tr className="border-b border-ink">
              <td className="py-1.5" colSpan={2}>
                {copy.discount}
                {order.coupon && ` (${order.coupon})`}
              </td>
              <td className="py-1.5 text-right tabular-nums">− {inr(order.discount / 100)}</td>
            </tr>
          )}
          <tr>
            <td className="py-1.5 font-bold" colSpan={2}>
              {copy.total}
            </td>
            <td className="py-1.5 text-right font-bold tabular-nums">{inr(order.amount / 100)}</td>
          </tr>
        </tbody>
      </table>
      <div className={`mt-auto space-y-0.5 border-t border-ink pt-2 ${a4 ? 'text-xs' : 'text-[6.5pt]'}`}>
        <p className="font-bold">{brand.legalName}</p>
        <p>
          CIN {brand.cin} · GSTIN {brand.gstin} · {brand.supportEmail}
        </p>
        <p>{receiptCopy.note}</p>
      </div>
    </div>
  );
}

/** Every page to print, in order: per parcel its label, then its invoice (or packing slip). */
function Sheets({items, format, want}) {
  const a4 = format === 'a4';
  return items.flatMap((p) => [
    want.label && (
      <Sheet key={`${p.shipment._id}-l`} format={format} className={a4 ? 'p-[12mm]' : 'p-[0.08in]'}>
        {a4 ? (
          <div className="sheet-4x6 outline-2 outline-offset-4 outline-ink outline-dashed">
            <Label p={p} />
          </div>
        ) : (
          <Label p={p} />
        )}
        {a4 && <p className="mt-4 text-xs">{copy.cutHere}</p>}
      </Sheet>
    ),
    want.invoice && p.order && (
      <Sheet key={`${p.shipment._id}-i`} format={format}>
        {p.invoice ? <InvoiceDoc invoice={p.invoice} size={format} /> : <PackingSlip p={p} a4={a4} />}
      </Sheet>
    ),
  ]);
}

export function ShipmentPrint() {
  const {id} = useParams();
  const [params] = useSearchParams();
  const ids = id ? [id] : (params.get('ids') ?? '').split(',').filter(Boolean);
  const {redirect, user} = useSignedIn({loginPath: '/admin/login', area: 'any'});
  const staff = user && isStaffRole(user.role);
  const one = useApi(staff && id ? `/orders/staff/shipments/${id}` : null);
  const many = useApi(staff && !id && ids.length ? `/orders/staff/shipments/print?ids=${ids.join(',')}` : null);
  const items = id ? one.data && [one.data] : many.data;
  const [format, setFormat] = useFormat();
  const [want, setWant] = useState({label: true, invoice: true});
  usePageMeta({title: `${copy.printTitle} — Pirento Admin`});
  usePrintPaper(format);
  // Once printed, the parcels are marked so the list shows their labels are out.
  useAfterPrint(
    items?.length &&
      (() => {
        api('/orders/staff/shipments/printed', {
          method: 'POST',
          body: {ids: items.map((p) => p.shipment._id)},
        }).catch(() => {});
      }),
    [items],
  );

  if (redirect) return redirect;
  if (user && !staff) return <Navigate to="/dashboard" replace />;
  if (!items) return <div className="min-h-dvh" />;
  const pages = items.reduce((n, p) => n + (want.label ? 1 : 0) + (want.invoice && p.order ? 1 : 0), 0);

  return (
    <div>
      <div className="no-print mb-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/admin/shipments" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" /> {copy.back}
          </Link>
          <button
            onClick={() => window.print()}
            disabled={!pages}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-40"
          >
            <Printer aria-hidden className="size-4" /> {copy.printPages(pages)}
          </button>
        </div>
        <FormatPicker format={format} onChange={setFormat} />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted">{copy.include}</span>
          {['label', 'invoice'].map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={want[k]}
                onChange={(e) => setWant({...want, [k]: e.target.checked})}
                className="size-4"
              />
              {copy.kinds[k]}
            </label>
          ))}
          <span className="text-muted">· {copy.parcels(items.length)}</span>
        </div>
        <p className="text-xs text-muted">{format === 'thermal' ? copy.thermalTip : copy.a4Tip}</p>
      </div>

      <PrintArea>
        <Sheets items={items} format={format} want={want} />
      </PrintArea>
    </div>
  );
}
