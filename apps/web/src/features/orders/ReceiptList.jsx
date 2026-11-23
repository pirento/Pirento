// A list of payment receipts, newest first, each opening its printable receipt.
import {Link} from 'react-router-dom';
import {FileText} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {formatDate, inr} from '../../lib/format';
import {hasReceipt, paidAt} from './receipts';
import {orderTitle} from './helpers';

export function ReceiptList({orders, showProduct = false}) {
  const paid = (orders ?? []).filter(hasReceipt).sort((a, b) => new Date(paidAt(b)) - new Date(paidAt(a)));
  if (orders && paid.length === 0) return <p className="text-muted">No receipts yet. They appear once you pay.</p>;
  return (
    <ul className="border-t border-rule">
      {paid.map((o) => {
        const product = showProduct && getProduct(o.product);
        return (
          <li key={o._id} data-reveal>
            <Link
              to={`/${o.product}/dashboard/receipts/${o._id}`}
              className="group flex items-center gap-4 border-b border-rule py-4"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule transition-colors group-hover:border-ink">
                <FileText aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium group-hover:underline sm:truncate">{orderTitle(o)}</span>
                <span className="block text-sm text-muted">
                  {product && `${product.name} · `}Receipt #{o.orderNo} · {formatDate(paidAt(o))}
                  {o.payment?.refunded && ' · refunded'}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{inr(o.amount / 100)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
