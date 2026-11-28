// Pirento Foundation: the company's social-impact arm, its four programmes as a deck of cards that each open the
// Foundation's site, and its registration status.
import {Section, SectionHeader} from '../../components/ui/Heading';
import {FOUNDATION} from '../../data/group';
import {home} from '../../data/site';
import {CardStack} from './CardStack';

const programmes = FOUNDATION.programmes.map((p) => ({
  name: p.title,
  body: p.body,
  href: FOUNDATION.href,
  linkLabel: home.foundationLink,
}));

export function FoundationSection({n}) {
  return (
    <Section inverse>
      <SectionHeader n={n} label={FOUNDATION.name} title="People. / Planet. / Possibility." intro={FOUNDATION.body} />
      <CardStack items={programmes} label={`${FOUNDATION.name} programmes`} />
      <p className="mt-10 text-sm text-muted" data-reveal>
        {FOUNDATION.status}
      </p>
    </Section>
  );
}
