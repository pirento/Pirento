// Home: the company's three ventures, the businesses alongside it, and a short "about us" that leads to /about.
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, ALONGSIDE, COMPANY, PARTNER, PEOPLE, VENTURES} from '../../data/group';
import {Avatar} from './Avatar';
import {OrgCard} from './OrgCard';

export function VenturesSection({n}) {
  return (
    <Section>
      <SectionHeader
        n={n}
        label="Ventures"
        title={`Built with / ${COMPANY.short}.`}
        intro={`Three businesses run with ${COMPANY.name}, beside the Pirento products.`}
      />
      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {VENTURES.map((v) => (
          <OrgCard key={v.name} item={v} />
        ))}
      </div>
    </Section>
  );
}

export function AlongsideSection({n}) {
  return (
    <Section className="pt-0! md:pt-0!">
      <SectionHeader
        n={n}
        label="Alongside"
        title="Close to us, / run on their own."
        intro="A family business and a charitable trust that share our people, not our company."
      />
      <div className="mt-16 grid gap-4 md:grid-cols-2">
        {ALONGSIDE.map((v) => (
          <OrgCard key={v.name} item={v} />
        ))}
      </div>
    </Section>
  );
}

export function AboutTeaser({n}) {
  const people = Object.values(PEOPLE);
  return (
    <Section>
      <SectionHeader n={n} label="About us" title={ABOUT.title} intro={ABOUT.intro} />
      <div className="mt-14 flex flex-wrap items-center justify-between gap-8" data-reveal>
        <ul className="flex flex-wrap gap-y-3 -space-x-3" aria-label="Our people">
          {people.map((p) => (
            <li key={p.name} title={p.name} className="rounded-full ring-4 ring-paper">
              <Avatar person={p} className="size-14 text-sm" />
              <span className="sr-only">{p.name}</span>
            </li>
          ))}
        </ul>
        <Button to="/about" variant="outline">
          Meet the team
        </Button>
      </div>
      <p className="mt-10 max-w-2xl text-sm text-muted" data-reveal>
        {PARTNER.body}
      </p>
    </Section>
  );
}
