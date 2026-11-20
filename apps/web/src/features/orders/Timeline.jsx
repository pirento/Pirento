// The order's steps on a rail filled up to where it is now.
import {ORDER_STEPS, statusLabel} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {formatDate} from '../../lib/format';

export function Timeline({order}) {
  const cancelled = order.status === 'cancelled';
  const reached = ORDER_STEPS.findIndex((s) => s.status === order.status);
  const at = (status) => order.timeline.findLast((t) => t.status === status);
  const steps = cancelled
    ? [...order.timeline.map((t) => ({status: t.status, label: statusLabel(t.status)}))]
    : ORDER_STEPS;
  const current = cancelled ? steps.length - 1 : reached;

  return (
    <ol className="relative ml-2 border-l border-rule">
      <span
        aria-hidden
        className="absolute top-0 -left-px w-0.5 bg-accent transition-[height] duration-1000 ease-ui"
        style={{height: `${(current / Math.max(steps.length - 1, 1)) * 100}%`}}
      />
      {steps.map((s, i) => {
        const entry = cancelled ? order.timeline[i] : at(s.status);
        const state = i < current ? 'Done' : i === current ? 'Now' : 'Expected';
        return (
          <li key={`${s.status}-${i}`} className="relative pb-10 pl-8 last:pb-0" data-reveal>
            <span
              aria-hidden
              className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 ${
                state === 'Expected' ? 'border-rule bg-paper' : 'border-accent bg-accent'
              }`}
            />
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl">{s.label}</h3>
              <Tag tone={state === 'Now' ? 'accent' : 'rule'}>{state}</Tag>
            </div>
            {entry && (
              <p className="mt-1 text-sm text-muted">
                {formatDate(entry.at)}
                {entry.note && ` · ${entry.note}`}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
