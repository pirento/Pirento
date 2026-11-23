// One order: timeline, payment panel and the customer's answers.
import {useRef, useState} from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import {BadgeCheck} from 'lucide-react';
import {askedQuestions, statusLabel} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Label, Section} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {PayPanel} from './PayPanel';
import {DetailsRecord} from './OrderDetails';
import {Timeline} from './Timeline';
import {qty, orderTitle} from './helpers';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function OrderPage() {
  const {id} = useParams();
  const {redirect, user} = useSignedIn({area: 'any'});
  const {data: fetched, error, setData} = useOrder(user ? id : null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(fetched)]);
  usePageMeta({title: fetched ? `Order #${fetched.orderNo} — Pirento` : 'Order — Pirento'});
  if (redirect) return redirect;
  if (error) return <NotFound />;
  if (!fetched) return <div className="min-h-dvh" />;
  // A customer's own order lives in their product dashboard; this page stays for staff.
  if (fetched.userId === user._id)
    return <Navigate to={`/${fetched.product}/dashboard/orders/${fetched._id}`} replace />;
  const order = fetched;
  const questions = askedQuestions(order);

  return (
    <div ref={ref}>
      <PageHero label={`Order #${order.orderNo}${qty(order)}`} title={orderTitle(order)}>
        <div className="mt-8 flex flex-wrap items-center gap-3" data-hero-fade>
          <Tag tone={order.status === 'completed' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="text-sm text-muted">Placed {formatDate(order.createdAt)}</span>
        </div>
      </PageHero>
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Timeline order={order} />
            {order.code && (
              <div
                className="mt-12 flex flex-wrap items-center gap-4 rounded-[18px] border border-rule p-6"
                data-reveal
              >
                <BadgeCheck aria-hidden className="size-6" />
                <div>
                  <p className="text-sm text-muted">Completion code, anyone can check it</p>
                  <Link to={`/verify/${order.code}`} className="display text-2xl underline underline-offset-4">
                    {order.code}
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6 lg:col-span-5">
            {order.status === 'pending_payment' && <PayPanel order={order} onPaid={setData} />}
            <dl className="rounded-[22px] border border-rule p-8" data-reveal>
              <Label n={order.status === 'pending_payment' ? 2 : 1}>Your answers</Label>
              {questions
                .filter((q) => order.intake[q.id])
                .map((q) => (
                  <div key={q.id} className="mt-5 border-t border-rule pt-4">
                    <dt className="text-sm text-muted">{q.label}</dt>
                    <dd className="mt-1">{order.intake[q.id]}</dd>
                  </div>
                ))}
            </dl>
            <DetailsRecord order={order} className="rounded-[22px] border border-rule p-8" />
          </div>
        </div>
      </Section>
    </div>
  );
}

function useOrder(id) {
  const res = useApi(id ? `/orders/${id}` : null);
  const [override, setData] = useState(null);
  return {...res, data: override?._id === id ? override : res.data, setData};
}
