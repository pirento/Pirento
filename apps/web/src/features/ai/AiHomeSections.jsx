// The Pirento AI home page's own sections: what it does in each product, and the free allowance and plans
// (read live, so admin's numbers show).
import {Sparkles} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {appDashboards} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

const copy = appDashboards.ai.home;

export function AiEverywhere({n}) {
  return (
    <Section id="everywhere">
      <SectionHeader n={n} label={copy.everywhere.label} title={copy.everywhere.title} intro={copy.everywhere.intro} />
      <ul className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {copy.everywhere.items.map(([name, body]) => (
          <li key={name} className="rounded-[22px] border border-rule p-6" data-reveal>
            <Sparkles aria-hidden className="size-5" />
            <p className="mt-5 text-lg font-medium">{name}</p>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function AiPlans({n}) {
  const p = useApi('/ai/plans/public').data;
  return (
    <Section id="plans">
      <SectionHeader n={n} label={copy.plans.label} title={copy.plans.title} />
      <ul className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li className="rounded-[22px] border border-rule p-6" data-reveal>
          <p className="eyebrow">Free</p>
          <p className="num mt-6">{p ? p.free : '—'}</p>
          <p className="mt-2 text-sm text-muted">{copy.plans.free}</p>
        </li>
        {p?.plans.map((plan) => (
          <li key={plan._id} className="rounded-[22px] border border-rule p-6" data-reveal>
            <p className="eyebrow">{plan.name}</p>
            <p className="num mt-6">{plan.dailyLimit}</p>
            <p className="mt-2 text-sm text-muted">
              {copy.plans.perDay} · {plan.months} month{plan.months === 1 ? '' : 's'}
            </p>
            <p className="mt-4 text-lg">{inr(plan.price / 100)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button to="/ai/dashboard/plans" variant="outline">
          {copy.plans.choose}
        </Button>
        <p className="text-sm text-muted">{copy.plans.note}</p>
      </div>
    </Section>
  );
}
