// Dashboard for order-based products (Legal, Black, Green, Giftox).
import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, MessageSquare} from 'lucide-react';
import {statusLabel} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Label, Section} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {useSignedIn} from '../auth/useSignedIn';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';

const ACTIVE = ['paid', 'in_progress'];

/** Legal, Black, Green and Giftox: your orders for that product. */
export function OrdersDashboard({product}) {
  const {redirect, user} = useSignedIn();
  const orders = useApi(user ? '/orders' : null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(orders.data)]);
  if (redirect) return redirect;
  const mine = orders.data?.filter((o) => o.product === product.slug) ?? [];
  const paid = mine.filter((o) => [...ACTIVE, 'completed'].includes(o.status));
  const browse = product.slug === 'legal' ? '/legal/services' : `/${product.slug}#services`;

  return (
    <div ref={ref}>
      <PageHero
        label={`${product.name} · Dashboard`}
        title={`Hello, / ${user?.name || user?.email.split('@')[0] || ''}.`}
      >
        <div className="mt-8 flex flex-wrap gap-3" data-hero-fade>
          <Button to={browse} variant="accent">
            New order
          </Button>
          <Button to="/support" variant="outline" icon={MessageSquare}>
            Ask support
          </Button>
        </div>
      </PageHero>
      <Section className="pt-0! md:pt-0!">
        <StatsRow
          stats={[
            {value: String(mine.length), label: 'orders'},
            {value: String(mine.filter((o) => ACTIVE.includes(o.status)).length), label: 'in progress'},
            {value: String(mine.filter((o) => o.status === 'completed').length), label: 'completed'},
            {value: inr(paid.reduce((n, o) => n + o.amount, 0) / 100), label: 'paid in all'},
          ]}
        />
        <div className="mt-16">
          <Label n={1}>Your {product.short} orders</Label>
          {orders.data && mine.length === 0 && (
            <p className="body mt-6">
              Nothing yet.{' '}
              <Link to={browse} className="text-ink underline underline-offset-4">
                Browse {product.short} services
              </Link>
              .
            </p>
          )}
          <ul className="mt-6">
            {mine.map((o) => (
              <li key={o._id}>
                <Link
                  to={`/orders/${o._id}`}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-5 hover:border-ink"
                >
                  <span>
                    <span className="block font-medium">
                      {o.serviceName}
                      {o.quantity > 1 && ` × ${o.quantity}`}
                    </span>
                    <span className="text-sm text-muted">
                      #{o.orderNo} · {formatDate(o.createdAt)}
                      {o.code && ` · ${o.code}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag tone={o.status === 'completed' ? 'accent' : 'rule'}>{statusLabel(o.status)}</Tag>
                    <span className="tabular-nums">{inr(o.amount / 100)}</span>
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}
