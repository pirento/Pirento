// The Pirento hub's own pages: every order and every receipt across all products, in one place.
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
