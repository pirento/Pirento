// Home: the company's three ventures and the businesses alongside it, each as a deck of cards, and a short "about us" that leads to /about.
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, ALONGSIDE, COMPANY, PARTNER, PEOPLE, VENTURES} from '../../data/group';
import {Avatar} from './Avatar';
import {CardStack} from './CardStack';

export function VenturesSection({n}) {
  return (
    <Section id="family">
      <SectionHeader
        n={n}
        label="Ventures"
        title={`Built with / ${COMPANY.short}.`}
        intro={`Three businesses run with ${COMPANY.name}, beside the Pirento products.`}
      />
      <CardStack items={VENTURES.map((v) => ({...v, lead: PEOPLE[v.lead]}))} label="Ventures" />
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
      <CardStack items={ALONGSIDE.map((a) => ({...a, meta: a.note}))} label="Alongside" />
    </Section>
  );
}

export function AboutTeaser({n}) {
  const people = Object.values(PEOPLE);
  return (
    <Section>
      <SectionHeader n={n} label="About us" title={ABOUT.title} intro={ABOUT.intro} />
      <div
        className="mt-14 grid gap-8 rounded-[22px] border border-rule p-6 md:p-8 lg:grid-cols-12 lg:items-center"
        data-reveal
      >
        <ul className="flex flex-wrap gap-y-3 -space-x-3 lg:col-span-5" aria-label="Our people">
          {people.map((p) => (
            <li key={p.name} title={p.name} className="rounded-full ring-4 ring-paper">
              <Avatar person={p} className="size-14 text-sm" />
              <span className="sr-only">{p.name}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted lg:col-span-5">{PARTNER.body}</p>
        <div className="lg:col-span-2 lg:justify-self-end">
          <Button to="/about" variant="outline">
            Meet the team
          </Button>
        </div>
      </div>
    </Section>
  );
}
