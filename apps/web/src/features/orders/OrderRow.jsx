// One order as a row: name, number and date, where it has got to, its status and amount. Used by every dashboard;
// it opens the order inside its own product's dashboard.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {ORDER_STEPS, getProduct, statusLabel} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {formatDate, inr} from '../../lib/format';
import {ProductIcon} from '../../components/ui/ProductIcon';

/** Where an order is, as four joined dots: awaiting payment → paid → in progress → completed. */
export function Progress({status}) {
  const at = ORDER_STEPS.findIndex((s) => s.status === status);
  if (at < 0) return null; // cancelled: the tag says so
  return (
    <span className="flex items-center" aria-hidden>
      {ORDER_STEPS.map((s, i) => (
        <span key={s.status} className="flex items-center">
          {i > 0 && <span className={`h-px w-4 sm:w-6 ${i <= at ? 'bg-ink' : 'bg-rule'}`} />}
          <span className={`size-2 rounded-full ${i <= at ? 'bg-accent' : 'border border-rule'}`} />
        </span>
      ))}
    </span>
  );
}

/** `showProduct` names the product too, for the Pirento hub where every product's orders sit together. */
export function OrderRow({order, showProduct = false}) {
  const product = showProduct && getProduct(order.product);
  return (
    <li data-reveal>
      <Link
        to={`/${order.product}/dashboard/orders/${order._id}`}
        className="group grid gap-x-6 gap-y-3 border-b border-rule py-5 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <span className="min-w-0">
          <span className="block font-medium group-hover:underline">
            {order.serviceName}
            {order.quantity > 1 && ` × ${order.quantity}`}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            {product && (
              <span className="inline-flex items-center gap-1.5">
                <ProductIcon product={product} className="size-4" />
                {product.name} ·
              </span>
            )}
            #{order.orderNo} · {formatDate(order.createdAt)}
            {order.code && ` · code ${order.code}`}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Progress status={order.status} />
          <Tag tone={order.status === 'completed' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="tabular-nums">{inr(order.amount / 100)}</span>
          <ArrowUpRight aria-hidden className="hidden size-4 text-muted sm:block" />
        </span>
      </Link>
    </li>
  );
}
