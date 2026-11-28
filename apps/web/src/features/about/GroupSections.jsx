// Home: the rest of the Pirento family (the Foundation, then a panel per group), and a short "about us" that leads to /about.
import {ArrowUpRight, Sparkles} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, COMPANY, FAMILY_GROUPS, FOUNDATION, PARTNER, PEOPLE} from '../../data/group';
import {Avatar} from './Avatar';
import {ICONS} from './FamilyRows';

/** One part of the family as a short line: its icon, name, what it is, and its website when it has one. */
function FamilyLine({item}) {
  const Icon = ICONS[item.icon] ?? Sparkles;
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rule">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium break-words">{item.name}</span>
        <span className="block text-sm break-words text-muted">{item.meta ?? item.body}</span>
        {item.domain && (
          <span className="mt-1 inline-flex items-center gap-1 text-sm">
            {item.domain}
            {item.href && <ArrowUpRight aria-hidden className="size-3.5" />}
          </span>
        )}
      </span>
    </>
  );
  const cls = 'flex gap-4 rounded-[16px] border border-rule bg-paper p-4';
  return item.href ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} transition-colors duration-500 hover:border-ink`}
    >
      {body}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * The home page's look at the rest of the family, in its own shape: the Foundation as one wide panel with its
 * programmes, then each group in a panel of its own. The About page keeps the full cards and the Foundation's picture.
 */
export function FamilySection({n}) {
  return (
    <Section id="family">
      <SectionHeader
        n={n}
        label="The Pirento family"
        title="More than / ten products."
        intro={`Pirento Ecosystem is one part of ${COMPANY.name}. Here is the rest of the family.`}
      />
      <article className="mt-16 grid gap-10 rounded-[22px] bg-stone p-6 md:p-10 lg:grid-cols-12" data-reveal>
        <div className="lg:col-span-5">
          <p className="eyebrow">Foundation · {FOUNDATION.status.split('.')[0]}</p>
          <h3 className="mt-4 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-tight">{FOUNDATION.name}</h3>
          <p className="mt-2 text-muted">{FOUNDATION.tagline}</p>
          <div className="mt-8">
            <Button href={FOUNDATION.href} target="_blank" rel="noopener noreferrer" variant="outline">
              Visit the Foundation <span className="sr-only">(opens in a new tab)</span>
            </Button>
          </div>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-[16px] border border-rule bg-rule sm:grid-cols-2 lg:col-span-7">
          {FOUNDATION.programmes.map((p) => (
            <li key={p.title} className="bg-paper p-5">
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </article>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {FAMILY_GROUPS.map((g) => (
          <section
            key={g.title}
            aria-labelledby={`family-${g.title}`}
            className="flex flex-col rounded-[22px] border border-rule p-5 md:p-6"
            data-reveal
          >
            <h3 id={`family-${g.title}`} className="text-xl">
              {g.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{g.body}</p>
            <ul className="mt-5 space-y-3">
              {g.items.map((item) => (
                <li key={item.name}>
                  <FamilyLine item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
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
