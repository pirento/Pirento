// Home: the rest of the Pirento family as a short directory, and a short "about us" that leads to /about.
import {ArrowUpRight} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, COMPANY, FAMILY_GROUPS, FOUNDATION, PARTNER, PEOPLE} from '../../data/group';
import {Avatar} from './Avatar';

/**
 * The home page's look at the rest of the family: the Foundation on one line, then every other part as a short
 * directory in columns. The full cards (and the Foundation's picture) live on the About page.
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
      <a
        href={FOUNDATION.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group/fdn mt-16 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-y border-rule py-8"
        data-reveal
      >
        <span className="min-w-0">
          <span className="block text-[clamp(1.6rem,3vw,2.4rem)] leading-tight group-hover/fdn:underline">
            {FOUNDATION.name}
          </span>
          <span className="mt-1 block text-muted">
            {FOUNDATION.tagline} {FOUNDATION.status.split('.')[0]}.
          </span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          Visit the Foundation <ArrowUpRight aria-hidden className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </a>
      <div className="mt-12 grid gap-12 md:grid-cols-3">
        {FAMILY_GROUPS.map((g) => (
          <div key={g.title} data-reveal>
            <h3 className="eyebrow">{g.title}</h3>
            <p className="mt-2 text-sm text-muted">{g.body}</p>
            <ul className="mt-5 border-t border-rule">
              {g.items.map((item) => (
                <li key={item.name} className="border-b border-rule py-3">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-baseline justify-between gap-4 hover:underline"
                    >
                      <span className="min-w-0 break-words">{item.name}</span>
                      <ArrowUpRight aria-hidden className="size-4 shrink-0" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className="block break-words">{item.name}</span>
                  )}
                  {item.meta && <span className="block text-xs text-muted">{item.meta}</span>}
                </li>
              ))}
            </ul>
          </div>
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
