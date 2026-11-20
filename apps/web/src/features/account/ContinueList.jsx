// "Pick up where you left off": the things waiting on you, each with the one button that finishes it.
import {Link} from 'react-router-dom';
import {CircleCheck, CreditCard, Fingerprint, MessageSquare, UserRound} from 'lucide-react';
import {inr} from '../../lib/format';

export function ContinueList({user, data}) {
  const {orders, tickets, identity} = data;
  const items = [
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

  return (
    <section aria-labelledby="continue-h" className="rounded-[22px] border border-rule p-6 md:p-7" data-reveal>
      <h2 id="continue-h" className="text-xl">
        Pick up where you left off
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <CircleCheck aria-hidden className="size-4" /> All caught up. Nothing is waiting on you.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {items.slice(0, 5).map((it) => (
            <li key={it.to + it.title} className="flex items-center gap-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone">
                <it.icon aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium sm:truncate">{it.title}</span>
                <span className="line-clamp-2 block text-sm text-muted sm:truncate">{it.note}</span>
              </span>
              <Link
                to={it.to}
                className="shrink-0 rounded-full border border-rule px-4 py-1.5 text-sm hover:border-ink"
              >
                {it.cta}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
