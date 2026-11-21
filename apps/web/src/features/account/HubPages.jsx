// The Pirento dashboard's own pages: payments, receipts, orders and subscriptions across every product.
import {useRef, useState} from 'react';
import {PRODUCTS} from '@pirento/shared';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {useSignedIn} from '../auth/useSignedIn';
import {OrderRow} from '../orders/OrderRow';
import {ReceiptList} from '../orders/ReceiptList';
import {useApi} from '../../lib/api/useApi';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {getProduct} from '@pirento/shared';
import {hub} from '../../data/site';
import {formatDate, inr} from '../../lib/format';
import {paymentHistory} from './payments';

function HubPage({title, children}) {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: `${title} — Pirento Ecosystem`});
  return (
    <div ref={ref} className="space-y-14">
      <header>
        <p className="eyebrow">Pirento Ecosystem · {title}</p>
        <Heading as="h1" text={title} className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02]" />
      </header>
      {children}
    </div>
  );
}

/** A pill row to narrow a list to one product, with how many each has. */
function ProductFilter({orders, value, onChange}) {
  const used = PRODUCTS.filter((p) => orders?.some((o) => o.product === p.slug));
  if (used.length < 2) return null;
  return (
    <div role="tablist" aria-label="Product" className="no-scrollbar flex gap-2 overflow-x-auto">
      {[{slug: '', name: 'All'}, ...used].map((p) => (
        <button
          key={p.slug}
          role="tab"
          aria-selected={value === p.slug}
          onClick={() => onChange(p.slug)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
            value === p.slug ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

export function AllOrders() {
  const {redirect, user} = useSignedIn();
  const orders = useApi(user ? '/orders' : null);
  const [product, setProduct] = useState('');
  if (redirect) return redirect;
  const shown = orders.data?.filter((o) => !product || o.product === product);
  return (
    <HubPage title="Orders">
      <DashSection
        n={1}
        id="all-orders"
        label="Every product"
        title="All your orders."
        action={<ProductFilter orders={orders.data} value={product} onChange={setProduct} />}
      >
        {orders.data && shown.length === 0 ? (
          <p className="text-muted">No orders yet.</p>
        ) : (
          <ul className="border-t border-rule">
            {shown?.map((o) => (
              <OrderRow key={o._id} order={o} showProduct />
            ))}
          </ul>
        )}
      </DashSection>
    </HubPage>
  );
}

export function AllReceipts() {
  const {redirect, user} = useSignedIn();
  const orders = useApi(user ? '/orders' : null);
  const [product, setProduct] = useState('');
  if (redirect) return redirect;
  return (
    <HubPage title="Receipts">
      <DashSection
        n={1}
        id="all-receipts"
        label="Every product"
        title="Every payment, / ready to print."
        action={<ProductFilter orders={orders.data} value={product} onChange={setProduct} />}
      >
        <ReceiptList orders={orders.data?.filter((o) => !product || o.product === product)} showProduct />
      </DashSection>
    </HubPage>
  );
}

export function AllPayments() {
  const {redirect, user} = useSignedIn();
  const wallet = useApi(user ? '/wallet?limit=500' : null);
  const orders = useApi(user ? '/orders' : null);
  if (redirect) return redirect;
  const ready = wallet.data && orders.data;
  const history = ready ? paymentHistory(wallet.data.transactions, orders.data) : [];
  return (
    <HubPage title={hub.payments.title}>
      <DashSection n={1} id="payments" label={hub.payments.label} title={hub.payments.heading}>
        {ready && history.length === 0 && <p className="text-muted">No payments yet.</p>}
        <ul className="border-t border-rule">
          {history.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-4 border-b border-rule py-4" data-reveal>
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.title}</span>
                <span className="text-sm text-muted">
                  {p.product && `${getProduct(p.product)?.name} · `}
                  {p.method} · {formatDate(p.at)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {p.direction === 'in' ? '+' : '−'}
                {inr(p.amount / 100)}
              </span>
            </li>
          ))}
        </ul>
      </DashSection>
    </HubPage>
  );
}

export function Subscriptions() {
  const {redirect} = useSignedIn();
  if (redirect) return redirect;
  return (
    <HubPage title={hub.subscriptions.title}>
      <DashSection n={1} id="subscriptions" label={hub.subscriptions.label} title={hub.subscriptions.heading}>
        <p className="max-w-2xl text-muted">{hub.subscriptions.empty}</p>
      </DashSection>
    </HubPage>
  );
}
