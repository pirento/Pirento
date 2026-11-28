// One invoice as a document, on A4 or a 4 × 6 inch thermal sheet: seller and buyer, invoice and order numbers, place
// of supply, the line with its SAC/HSN code, taxable value and CGST + SGST or IGST, the total in figures and words,
// payment and shipment, and a credit note when the order was cancelled. Used by the customer's receipt page, admin →
// Invoices and the shipping print. Divs, not header/footer: the site print stylesheet hides those.
import {PirentoLogo, SiteLogo, hasLogo} from '../../components/layout/PirentoLogo';
import {invoiceCopy as copy} from '../../data/site';
import {formatDate, inr} from '../../lib/format';

const rs = (paise) => inr((paise ?? 0) / 100);
const METHOD = {wallet: 'Pirento wallet', razorpay: 'Card / UPI (Razorpay)'};

function Party({label, p, compact}) {
  return (
    <div className="min-w-0">
      <p className="font-bold">{label}</p>
      {p.name && <p className={compact ? '' : 'font-medium'}>{p.name}</p>}
      {p.address && <p className="break-words">{p.address}</p>}
      {p.state && (
        <p>
          {p.state}
          {p.stateCode && ` (${copy.code} ${p.stateCode})`}
        </p>
      )}
      {p.gstin && <p>GSTIN {p.gstin}</p>}
      {p.cin && <p>CIN {p.cin}</p>}
      {(p.email || p.phone) && <p className="break-words">{[p.email, p.phone].filter(Boolean).join(' · ')}</p>}
    </div>
  );
}

export function InvoiceDoc({invoice: i, size = 'a4'}) {
  const a4 = size === 'a4';
  const a = i.amounts;
  const same = a.igst === 0;
  const t = a4
    ? {pad: 'p-5 sm:p-[14mm]', title: 'text-2xl', body: 'text-[9.5pt]', logo: 'h-10', gap: 'gap-6 py-5'}
    : {pad: 'p-3', title: 'text-[12pt] font-bold', body: 'text-[7.5pt]', logo: 'h-6', gap: 'gap-2 py-2'};
  const rows = [
    [copy.taxable, a.taxable],
    ...(i.kind === 'tax'
      ? same
        ? [
            [`CGST ${i.line.rate / 2}%`, a.cgst],
            [`SGST ${i.line.rate / 2}%`, a.sgst],
          ]
        : [[`IGST ${i.line.rate}%`, a.igst]]
      : []),
  ];
  return (
    <div className={`relative flex h-full flex-col ${t.pad} ${t.body} leading-snug`}>
      {i.status === 'cancelled' && (
        <div className="mb-2 border-2 border-ink px-2 py-1 text-center font-bold">
          {copy.cancelled} · {copy.creditNote} {i.creditNote?.no} · {formatDate(i.creditNote?.at)}
        </div>
      )}
      <div className="flex items-start justify-between gap-3 border-b-2 border-ink pb-2">
        {hasLogo(i.product) ? (
          <SiteLogo brand={i.product} alt="" className={`${t.logo} w-auto`} />
        ) : (
          <PirentoLogo alt="Pirento" className={`${t.logo} w-auto`} />
        )}
        <div className="text-right">
          <h2 className={t.title}>{i.kind === 'tax' ? copy.taxTitle : copy.plainTitle}</h2>
          <p className="font-mono">{i.invoiceNo}</p>
          <p>{formatDate(i.issuedAt)}</p>
        </div>
      </div>

      <div
        className={`grid border-b border-ink ${a4 ? `grid-cols-1 sm:grid-cols-2 ${i.shipTo?.name ? 'lg:grid-cols-3 print:grid-cols-3' : ''}` : 'grid-cols-2'} ${t.gap}`}
      >
        <Party label={copy.from} p={i.seller} compact={!a4} />
        <Party label={copy.to} p={i.buyer} compact={!a4} />
        {i.shipTo?.name && <Party label={copy.shipTo} p={i.shipTo} compact={!a4} />}
      </div>

      <dl className={`grid grid-cols-2 gap-x-3 gap-y-1 border-b border-ink ${a4 ? 'py-3 sm:grid-cols-4' : 'py-2'}`}>
        {[
          [copy.order, `#${i.orderNo}`],
          [copy.place, i.placeOfSupply?.state ? `${i.placeOfSupply.state} (${i.placeOfSupply.code})` : '—'],
          [copy.paid, `${formatDate(i.payment?.paidAt)} · ${METHOD[i.payment?.method] ?? '—'}`],
          [copy.shipment, i.shipping?.awb ? `${i.shipping.courier} ${i.shipping.awb}` : '—'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="font-bold">{k}</dt>
            <dd className="break-words">{v}</dd>
          </div>
        ))}
      </dl>

      <table className={`w-full ${a4 ? 'mt-4' : 'mt-2'}`}>
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="pb-1">{copy.item}</th>
            <th className="pb-1">{i.line.codeType}</th>
            <th className="pb-1 text-right">{copy.qty}</th>
            <th className="pb-1 text-right">{copy.amount}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-ink align-top">
            <td className="py-1.5 pr-2">{i.line.description}</td>
            <td className="py-1.5 font-mono">{i.line.code || '—'}</td>
            <td className="py-1.5 text-right tabular-nums">{i.line.qty}</td>
            <td className="py-1.5 text-right tabular-nums">{rs(i.line.gross)}</td>
          </tr>
          {i.line.discount > 0 && (
            <tr className="border-b border-ink">
              <td className="py-1.5" colSpan={3}>
                {copy.discount}
              </td>
              <td className="py-1.5 text-right tabular-nums">− {rs(i.line.discount)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <dl className="mt-2 ml-auto w-full max-w-[60%] text-right">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-0.5">
            <dt>{k}</dt>
            <dd className="tabular-nums">{rs(v)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-3 border-t-2 border-ink pt-1 font-bold">
          <dt>{copy.total}</dt>
          <dd className="tabular-nums">{rs(a.total)}</dd>
        </div>
      </dl>
      <p className="mt-2">{i.words}</p>
      {i.kind === 'tax' && <p className="mt-1">{copy.included}</p>}

      <div className={`mt-auto space-y-0.5 border-t border-ink pt-2 ${a4 ? 'text-[8pt]' : 'text-[6.5pt]'}`}>
        {i.note && <p>{i.note}</p>}
        <p>{i.kind === 'tax' ? copy.taxNote : copy.plainNote}</p>
      </div>
    </div>
  );
}
