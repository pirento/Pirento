// One order in the staff queue, with its actions.
import {useState} from 'react';
import {STAFF_TRANSITIONS, checkoutQuestions, statusLabel} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {qty} from './helpers';
import {api} from '../../lib/api/client';
import {formatDate, inr} from '../../lib/format';

const ACTION = {in_progress: 'Start work', completed: 'Mark completed', cancelled: 'Cancel'};
export const FILTERS = [
  {label: 'Open', value: ''},
  {label: 'Paid', value: 'paid'},
  {label: 'In progress', value: 'in_progress'},
  {label: 'Unpaid', value: 'pending_payment'},
  {label: 'Completed', value: 'completed'},
  {label: 'Cancelled', value: 'cancelled'},
];

export function StaffOrder({order, onChange}) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const questions = checkoutQuestions(order.product, order.serviceSlug);
  const act = async (status) => {
    if (status === 'cancelled' && !confirm(`Cancel order #${order.orderNo}? A wallet payment is refunded.`)) return;
    setBusy(true);
    setError('');
    try {
      await api(`/orders/staff/${order._id}`, {method: 'PATCH', body: {status, note}});
      setNote('');
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const refundPending = order.status === 'cancelled' && order.payment?.method === 'wallet' && !order.payment.refunded;
  const actions = refundPending ? ['cancelled'] : STAFF_TRANSITIONS[order.status];

  return (
    <details className="group border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">
            #{order.orderNo} · {order.serviceName}
            {qty(order)}
          </span>
          <span className="text-sm text-muted">
            {order.email} · {formatDate(order.createdAt)}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <Tag tone={order.status === 'paid' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="tabular-nums">{inr(order.amount / 100)}</span>
        </span>
      </summary>
      <div className="grid gap-8 pb-8 md:grid-cols-2">
        <dl className="space-y-3 text-sm">
          {questions
            .filter((q) => order.intake[q.id])
            .map((q) => (
              <div key={q.id}>
                <dt className="text-muted">{q.label}</dt>
                <dd>{order.intake[q.id]}</dd>
              </div>
            ))}
          {order.payment?.method && (
            <div>
              <dt className="text-muted">Payment</dt>
              <dd>
                {order.payment.method}
                {order.payment.razorpayPaymentId && ` · ${order.payment.razorpayPaymentId}`}
                {order.payment.refunded && ' · refunded'}
              </dd>
            </div>
          )}
        </dl>
        {actions.length > 0 && (
          <div>
            <Field
              label="Note for the customer (optional)"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              error={error}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((s) => (
                <Button
                  key={s}
                  onClick={() => act(s)}
                  variant={s === 'cancelled' ? 'outline' : 'primary'}
                  disabled={busy}
                  icon={null}
                >
                  {refundPending ? 'Retry refund' : ACTION[s]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

/** Pill tabs + list, shared by every staff queue. */
