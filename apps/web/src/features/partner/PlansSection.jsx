// Pirento One's home page: the plans on offer, each leading into the dashboard to join or buy.
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {appDashboards} from '../../data/site';
import {PlanCards} from './PlanCards';

const copy = appDashboards.one.plans;

export function PlansSection({plans, n}) {
  return (
    <Section>
      <SectionHeader n={n} label={copy.label} title={copy.title} intro={copy.intro} />
      <div className="mt-16">
        <PlanCards
          plans={plans}
          action={(p) => (
            <Button
              to="/one/dashboard/plans"
              variant={p.recommended ? 'accent' : 'outline'}
              className="w-full justify-center"
            >
              {p.price ? copy.choose : copy.join}
            </Button>
          )}
        />
      </div>
      <p className="mt-8 text-sm text-muted">{copy.paid}</p>
    </Section>
  );
}
