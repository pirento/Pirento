// One order inside its product's dashboard (/<product>/dashboard/orders/:id): where it is, the conversation with the
// team, its documents, paying, the answers given at checkout and after payment, and the receipt once paid.
import {useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, BadgeCheck, FileText} from 'lucide-react';
import {askedQuestions, getProduct, needsDetails, statusLabel} from '@pirento/shared';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {productDashboards} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {OrderConversation, customerSend} from './OrderConversation';
import {OrderDocuments} from './OrderDocuments';
import {FulfilmentRecord} from './Fulfilment';
import {DetailsForm} from './OrderDetails';
import {PayPanel} from './PayPanel';
import {Timeline} from './Timeline';
import {hasReceipt} from './receipts';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function OrderDetail() {
  const {slug, id} = useParams();
  const {redirect, user} = useSignedIn();
  const fetched = useApi(user ? `/orders/${id}` : null);
  const [fresh, setFresh] = useState(null);
  const [error, setError] = useState('');
  const ref = useRef(null);
  const order = fresh?._id === id ? fresh : fetched.data;
  usePageMotion(ref, [Boolean(order)]);
  usePageMeta({title: order ? `${order.serviceName} · #${order.orderNo}` : 'Order'});
  if (redirect) return redirect;
  // An order opens only under its own product, and only for its customer (staff use the admin).
  if (fetched.error || (order && (order.product !== slug || order.userId !== user._id))) return <NotFound />;
  if (!order) return <div className="min-h-dvh" />;

  const product = getProduct(slug);
  const ordersLabel = productDashboards[slug]?.find((s) => s.id === 'orders')?.label ?? 'Orders';
  const base = `/${slug}/dashboard`;
  const questions = askedQuestions(order).filter((q) => order.intake?.[q.id]);
  const cancel = async () => {
    if (!confirm('Cancel this order? You have not paid for it yet.')) return;
    try {
      setFresh(await api(`/orders/${order._id}/cancel`, {method: 'POST'}));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div ref={ref} className="space-y-14">
      <header>
        <Link to={`${base}/orders`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {ordersLabel}
        </Link>
        <p className="eyebrow mt-8">
          {product.name} · #{order.orderNo}
        </p>
        <Heading
          as="h1"
          text={order.serviceName}
          className="mt-5 text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] break-words"
        />
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <Tag tone={order.status === 'completed' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="text-muted">
            Placed {formatDate(order.createdAt)} · {inr(order.amount / 100)}
            {order.quantity > 1 && ` · ${order.quantity} items`}
          </span>
          {hasReceipt(order) && (
            <Link
              to={`${base}/receipts/${order._id}`}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
            >
              <FileText aria-hidden className="size-4" /> Receipt
            </Link>
          )}
          <Link to={`/support?product=${slug}&order=${order.orderNo}`} className="underline-offset-4 hover:underline">
            Ask support about this order
          </Link>
          {order.status === 'pending_payment' && (
            <button onClick={cancel} className="text-muted underline underline-offset-4 hover:text-ink">
              Cancel order
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm">
            ⚠ {error}
          </p>
        )}
      </header>

      {/* Waiting on the customer: first thing on the page, on a phone too. */}
      {needsDetails(order) && (
        <div className="max-w-2xl">
          <DetailsForm order={order} onSaved={setFresh} />
        </div>
      )}

      <div className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 space-y-14 lg:col-span-7">
          <DashSection n={1} id="progress" label="Progress" title="Where it is.">
            <Timeline order={order} />
          </DashSection>
          <DashSection n={2} id="messages" label="Messages" title="Talk to / the team.">
            <OrderConversation order={order} side="customer" send={customerSend(order, setFresh)} />
          </DashSection>
          <DashSection n={3} id="documents" label="Documents" title="Papers, / both ways.">
            <OrderDocuments order={order} side="customer" />
          </DashSection>
        </div>
        <div className="min-w-0 space-y-6 lg:col-span-5">
          {order.status === 'pending_payment' && <PayPanel order={order} onPaid={setFresh} />}
          {!needsDetails(order) && <DetailsForm key={order.detailsAt ?? 'new'} order={order} onSaved={setFresh} />}
          {order.code && (
            <div className="flex items-center gap-4 rounded-[22px] border border-rule p-6" data-reveal>
              <BadgeCheck aria-hidden className="size-6 shrink-0" />
              <div>
                <p className="text-sm text-muted">Completion code, anyone can check it</p>
                <Link to={`/verify/${order.code}`} className="display text-2xl underline underline-offset-4">
                  {order.code}
                </Link>
              </div>
            </div>
          )}
          <FulfilmentRecord order={order} className="rounded-[22px] border border-accent p-6 md:p-8" />
          {questions.length > 0 && (
            <dl className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
              <p className="eyebrow">Your answers</p>
              {questions.map((q) => (
                <div key={q.id} className="mt-5 border-t border-rule pt-4">
                  <dt className="text-sm text-muted">{q.label}</dt>
                  <dd className="mt-1 break-words">{order.intake[q.id]}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
