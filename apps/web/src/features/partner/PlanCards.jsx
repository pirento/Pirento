// Pirento One plans as pricing cards, for its home page and its dashboard; `action` adds each card's button.
import {CheckList} from '../../components/ui/Blocks';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {inr} from '../../lib/format';

const copy = appDashboards.one.plans;

export function PlanCards({plans, current, action}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((p) => {
        const mine = current?.id === String(p._id);
        return (
          <li
            key={p._id}
            data-reveal
            className={`flex flex-col rounded-[22px] border p-6 md:p-8 ${p.recommended ? 'border-accent' : 'border-rule'}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="mr-auto text-2xl">{p.name}</h3>
              {p.recommended && <Tag tone="accent">{copy.recommended}</Tag>}
              {mine && <Tag>{copy.current}</Tag>}
            </div>
            <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
              <span className="display text-5xl tabular-nums">{p.price ? inr(p.price / 100) : copy.free}</span>
              {p.price > 0 && <span className="text-muted">{copy.period(p.months)}</span>}
            </p>
            <p className="mt-3 font-medium">{copy.rate(p.commissionPct)}</p>
            {p.features.length > 0 && (
              <div className="mt-6">
                <CheckList items={p.features} />
              </div>
            )}
            {action && <div className="mt-auto pt-8">{action(p, mine)}</div>}
          </li>
        );
      })}
    </ul>
  );
}
