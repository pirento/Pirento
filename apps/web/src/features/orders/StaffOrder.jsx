// One order in the staff queue, with its actions.
import {useState} from 'react';
import {STAFF_TRANSITIONS, askedQuestions, needsDetails, statusLabel} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {qty} from './helpers';
import {OrderConversation} from './OrderConversation';
import {OrderDocuments} from './OrderDocuments';
import {StaffOrderAi} from './StaffOrderAi';
import {FulfilmentForm, FulfilmentRecord, takesFulfilment} from './Fulfilment';
import {DetailsRecord} from './OrderDetails';
import {api} from '../../lib/api/client';
import {formatDate, inr} from '../../lib/format';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';

const ACTION = {in_progress: 'Start work', completed: 'Mark completed', cancelled: 'Cancel'};
export const FILTERS = [
  {label: 'Open', value: ''},
  {label: 'Mine', value: 'mine=1'},
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
  // The conversation and documents load only once the row is opened, not for every row in the queue.
  const [open, setOpen] = useState(false);
  const {user} = useSession();
  const questions = askedQuestions(order);
  const act = async (status) => {
    if (
      status === 'cancelled' &&
      !confirm(`Cancel order #${order.orderNo}? Any payment is refunded (wallet, or card/UPI through Razorpay).`)
    )
      return;
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
  const send = async (path, body, done) => {
    setBusy(true);
    setError('');
    try {
      await api(`/orders/staff/${order._id}/${path}`, {method: path === 'assign' ? 'PATCH' : 'POST', body});
      done?.();
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const refundPending = order.status === 'cancelled' && Boolean(order.payment?.method) && !order.payment.refunded;
  const actions = refundPending ? ['cancelled'] : STAFF_TRANSITIONS[order.status];

  return (
    <details className="group border-b border-rule" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">
            #{order.orderNo} · {order.serviceName}
            {qty(order)}
          </span>
          <span className="text-sm text-muted">
            {order.email} · {formatDate(order.createdAt)}
            {order.assignee && ` · with ${order.assignee.email}`}
            {order.coupon && ` · ${order.coupon}`}
            {needsDetails(order) && ' · waiting on the customer’s details'}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <Tag tone={order.status === 'paid' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="tabular-nums">{inr(order.amount / 100)}</span>
        </span>
      </summary>
      <div className="grid gap-8 pb-8 md:grid-cols-2">
        <div className="space-y-6 text-sm">
          <dl className="space-y-3">
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
          <DetailsRecord order={order} />
        </div>
        <div className="space-y-6">
          <Assign order={order} busy={busy} onAssign={(assignee) => send('assign', {assignee})} />
          {/* A cancelled order keeps its record to read, but takes no new one. */}
          {takesFulfilment(order) ? (
            <FulfilmentForm key={order.fulfilment?.at} order={order} onSaved={onChange} />
          ) : (
            <FulfilmentRecord order={order} className="text-sm" />
          )}
          {actions.length > 0 && (
            <div>
              <Field
                label="Note on this step for the customer (optional)"
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
      </div>
      {open && (
        <div className="grid gap-8 border-t border-rule py-8 md:grid-cols-2">
          <div>
            <p className="eyebrow">Messages</p>
            <div className="mt-4">
              <OrderConversation
                order={order}
                side="team"
                send={async (note) => {
                  await api(`/orders/staff/${order._id}/message`, {method: 'POST', body: {note}});
                  onChange();
                }}
              />
            </div>
          </div>
          <div>
            <p className="eyebrow">Documents</p>
            <div className="mt-4">
              {/* Support reads documents; operations, finance and superadmins can also send them. */}
              <OrderDocuments order={order} side="team" canAdd={user?.role !== 'support'} />
            </div>
          </div>
          {user?.role !== 'support' && (
            <div className="md:col-span-2">
              <StaffOrderAi order={order} onChange={onChange} />
            </div>
          )}
        </div>
      )}
    </details>
  );
}

/** Pill tabs + list, shared by every staff queue. */

/** Who is working this order: take it, hand it back, or (superadmin) give it to someone. */
function Assign({order, busy, onAssign}) {
  const {user} = useSession();
  const isSuper = user?.role === 'superadmin';
  const team = useApi(isSuper ? '/auth/admin/team' : null);
  const me = {id: user?._id, email: user?.email};
  const mine = order.assignee?.id === me.id;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Working on it:</span>
      <span>{order.assignee?.email ?? 'nobody yet'}</span>
      {isSuper ? (
        <>
          <label className="sr-only" htmlFor={`as-${order._id}`}>
            Assign to
          </label>
          <select
            id={`as-${order._id}`}
            value={order.assignee?.id ?? ''}
            disabled={busy}
            onChange={(e) => {
              const t = team.data?.find((m) => m._id === e.target.value);
              onAssign(t ? {id: t._id, email: t.email} : null);
            }}
            className="rounded-full border border-rule bg-paper px-3 py-1.5"
          >
            <option value="">Nobody</option>
            {team.data?.map((m) => (
              <option key={m._id} value={m._id}>
                {m.email}
              </option>
            ))}
          </select>
        </>
      ) : (
        <Button variant="outline" icon={null} disabled={busy} onClick={() => onAssign(mine ? null : me)}>
          {mine ? 'Hand back' : 'Take it'}
        </Button>
      )}
    </div>
  );
}
