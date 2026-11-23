// The Pirento AI home page's own sections: what it does in each product (card grid), and the free allowance and
// plans as pricing cards (read live, so admin's numbers show).
import {Link} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ProductIcon} from '../../components/ui/ProductIcon';
import {appDashboards} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

const copy = appDashboards.ai.home;

export function AiEverywhere({n}) {
  return (
    <Section id="everywhere">
      <SectionHeader n={n} label={copy.everywhere.label} title={copy.everywhere.title} intro={copy.everywhere.intro} />
      <ul className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {copy.everywhere.items.map(([slug, body]) => {
          const product = getProduct(slug);
          return (
            <li key={slug} className="bg-stone" data-reveal>
              <Link
                to={`/${slug}`}
                className="group/card block h-full p-8 transition-colors duration-500 hover:bg-paper"
              >
                <span className="flex size-12 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover/card:border-accent">
                  <ProductIcon product={product} className="size-6" />
                </span>
                <h3 className="mt-10 text-2xl">{product.name}</h3>
                <p className="body mt-3">{body}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function PriceCard({name, price, period, count, action}) {
  return (
    <li className="flex flex-col rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
      <h3 className="eyebrow">{name}</h3>
      <p className="mt-6 display text-5xl tabular-nums md:text-6xl">{price}</p>
      <p className="mt-2 text-sm text-muted">{period}</p>
      <div className="mt-8 flex items-baseline gap-3 rounded-[18px] border border-rule bg-paper px-5 py-4">
        <span className="display text-4xl tabular-nums">{count}</span>
        <span className="text-sm text-muted">{copy.plans.perDay}</span>
      </div>
      <div className="mt-auto pt-8">{action}</div>
    </li>
  );
}

export function AiPlans({n}) {
  const p = useApi('/ai/plans/public').data;
  const choose = (
    <Button to="/ai/dashboard/plans" variant="outline" className="w-full justify-center">
      {copy.plans.choose}
    </Button>
  );
  return (
    <Section id="plans">
      <SectionHeader n={n} label={copy.plans.label} title={copy.plans.title} />
      <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PriceCard
          name={copy.plans.free}
          price={inr(0)}
          period={copy.plans.forever}
          count={p ? p.free : '—'}
          action={
            <Button to="/ai/dashboard" variant="outline" className="w-full justify-center">
              {copy.plans.start}
            </Button>
          }
        />
        {p?.plans.map((plan) => (
          <PriceCard
            key={plan._id}
            name={plan.name}
            price={inr(plan.price / 100)}
            period={copy.plans.months(plan.months)}
            count={plan.dailyLimit}
            action={choose}
          />
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">{copy.plans.note}</p>
    </Section>
  );
}
