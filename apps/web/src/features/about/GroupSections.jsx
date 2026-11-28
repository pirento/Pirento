// Home: the rest of the Pirento family as cards, and a short "about us" that leads to /about.
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, COMPANY, FAMILY_GROUPS, FOUNDATION, PARTNER, PEOPLE} from '../../data/group';
import {Avatar} from './Avatar';
import {Card} from './FamilyRows';

/**
 * The home page's look at the rest of the family: the Foundation and every other part as one grid of cards (eight,
 * so four across fill two rows), each naming its group. The About page keeps the fuller rows and the Foundation's picture.
 */
export function FamilySection({n}) {
  const foundation = {
    name: FOUNDATION.name,
    body: `${FOUNDATION.tagline} ${FOUNDATION.status.split('.')[0]}.`,
    icon: 'foundation',
    href: FOUNDATION.href,
    domain: 'Visit the Foundation',
  };
  const items = [
    {item: foundation, group: 'Foundation'},
    ...FAMILY_GROUPS.flatMap((g) => g.items.map((item) => ({item, group: g.title}))),
  ];
  return (
    <Section id="family">
      <SectionHeader
        n={n}
        label="The Pirento family"
        title="More than / ten products."
        intro={`Pirento Ecosystem is one part of ${COMPANY.name}. Here is the rest of the family.`}
      />
      <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({item, group}) => (
          <li key={item.name} className="grid">
            <Card item={item} group={group} />
          </li>
        ))}
      </ul>
      <div className="mt-10" data-reveal>
        <Button to="/about#family" variant="outline">
          The whole family
        </Button>
      </div>
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
