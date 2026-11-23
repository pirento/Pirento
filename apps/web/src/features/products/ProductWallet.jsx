// /<product>/dashboard/wallet: the one Pirento wallet shown inside a product, with what was paid from it here.
import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {orderDashboard as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {WalletPanel} from '../account/WalletPanel';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function ProductWallet({product}) {
  const {redirect, user} = useSignedIn();
  // Only the order products take payments; the others show the wallet alone.
  const orders = useApi(user ? '/orders' : null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: `Wallet — ${product.name}`});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  const paidHere = (orders.data ?? []).filter((o) => o.product === product.slug && o.payment?.method === 'wallet');

  return (
    <div ref={ref} className="space-y-14">
      <header>
        <p className="eyebrow">{product.name} · Wallet</p>
        <Heading as="h1" text={copy.wallet.title} className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02]" />
        <p className="body mt-4">{copy.wallet.intro}</p>
      </header>
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <WalletPanel n={1} />
        </div>
        {paidHere.length > 0 && (
          <div className="min-w-0 lg:col-span-5">
            <DashSection n={2} id="paid-here" label={product.short} title={copy.wallet.paid}>
              <ul className="border-t border-rule">
                {paidHere.map((o) => (
                  <li key={o._id}>
                    <Link
                      to={`/${product.slug}/dashboard/orders/${o._id}`}
                      className="flex items-center justify-between gap-4 border-b border-rule py-3.5 hover:underline"
                    >
                      <span className="min-w-0">
                        <span className="block break-words">{o.serviceName}</span>
                        <span className="text-xs text-muted">
                          #{o.orderNo} · {formatDate(o.createdAt)}
                          {o.payment.refunded && ' · refunded'}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums">{inr(o.amount / 100)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </DashSection>
          </div>
        )}
      </div>
    </div>
  );
}
