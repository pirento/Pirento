// "Needs you": the things waiting on you, each with the one button that finishes it.
import {Link} from 'react-router-dom';
import {CircleCheck, CreditCard, Fingerprint, MessageSquare, UserRound} from 'lucide-react';
import {inr} from '../../lib/format';

export function waitingItems(user, {orders, tickets, identity}) {
  return [
    ...(orders ?? [])
      .filter((o) => o.status === 'pending_payment')
      .map((o) => ({
        icon: CreditCard,
        title: `Pay for ${o.serviceName}`,
        note: `Order #${o.orderNo} · ${inr(o.amount / 100)}`,
        cta: 'Pay now',
        to: `/orders/${o._id}`,
      })),
    ...(tickets ?? [])
      .filter((t) => t.status === 'answered')
      .map((t) => ({
        icon: MessageSquare,
        title: 'Support replied',
        note: t.subject,
        cta: 'Read',
        to: `/support/${t._id}`,
      })),
    identity?.status === 'draft' && {
      icon: Fingerprint,
      title: 'Finish your Bharat ID',
      note: 'Your answers are saved',
      cta: 'Continue',
      to: '/bharat-id/dashboard',
    },
    identity?.status === 'rejected' && {
      icon: Fingerprint,
      title: 'Bharat ID needs a change',
      note: identity.reason,
      cta: 'Fix it',
      to: '/bharat-id/dashboard',
    },
    !user.name && {
      icon: UserRound,
      title: 'Add your name',
      note: 'So our team knows what to call you',
      cta: 'Add',
      to: '/account',
    },
  ].filter(Boolean);
}

export function ContinueList({items}) {
  if (items.length === 0)
    return (
      <p className="flex items-center gap-2 text-muted">
        <CircleCheck aria-hidden className="size-4" /> All caught up. Nothing is waiting on you.
      </p>
    );
  return (
    <ul className="border-t border-rule">
      {items.slice(0, 5).map((it) => (
        <li key={it.to + it.title} className="flex items-center gap-4 border-b border-rule py-4" data-reveal>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule">
            <it.icon aria-hidden className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium sm:truncate">{it.title}</span>
            <span className="line-clamp-2 block text-sm text-muted sm:truncate">{it.note}</span>
          </span>
          <Link to={it.to} className="shrink-0 rounded-full border border-rule px-4 py-2 text-sm hover:border-ink">
            {it.cta}
          </Link>
        </li>
      ))}
    </ul>
  );
}
