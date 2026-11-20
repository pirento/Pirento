// Home: the rest of the Pirento family as linked cards, and a short "about us" that leads to /about.
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, COMPANY, FAMILY, PARTNER, PEOPLE} from '../../data/group';
import {Avatar} from './Avatar';
import {FamilyGrid} from './FamilyCard';

export function FamilySection({n}) {
  return (
    <Section id="family">
      <SectionHeader
        n={n}
        label="The Pirento family"
        title="More than / ten products."
        intro={`Pirento Ecosystem is one part of ${COMPANY.name}. Here is the rest of the family; open any card to visit its site.`}
      />
      <FamilyGrid items={FAMILY} />
    </Section>
  );
}

export function AboutTeaser({n}) {
  const people = Object.values(PEOPLE);
  return (
    <Section className="pt-0! md:pt-0!">
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
