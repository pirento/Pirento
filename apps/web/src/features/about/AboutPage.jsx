// /about: who runs Pirento. The company at a glance, the founders, the story and the group as charts,
// the family of businesses, the people and our partner.
import {useRef} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';
import {ContactCta} from '../../components/layout/ContactCta';
import {Button} from '../../components/ui/Button';
import {Heading, Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, COMPANY, FAMILY, PARTNER, PEOPLE} from '../../data/group';
import {brand} from '../../data/site';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {Avatar} from './Avatar';
import {FamilyGrid} from './FamilyCard';
import {GroupChart} from './GroupChart';
import {StoryChart} from './StoryChart';

const SiteLink = ({person}) =>
  person.href ? (
    <a
      href={person.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
    >
      {person.site} <ArrowUpRight aria-hidden className="size-4" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : null;

// The company at a glance, every line taken from the data files.
const FACTS = [
  ['Company', COMPANY.name],
  ['Brand', `Pirento Ecosystem · ${PRODUCTS.length} products`],
  ['Incorporated', COMPANY.founded],
  ['CIN', brand.cin],
  ['Based in', 'Basti, Uttar Pradesh'],
  ['Partner', PARTNER.name],
];

export function About() {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: 'About Pirento — the people and the company behind it'});
  const founders = [PEOPLE.ravikant, PEOPLE.aman];

  return (
    <div ref={ref}>
      <section className="hero relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
        <div aria-hidden className="grid-bg absolute inset-0" />
        <div className="container-x relative grid gap-14 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow" data-hero-fade>
              About us
            </p>
            <Heading as="h1" text={ABOUT.title} className="h-hero mt-6" />
            <p className="body mt-8 max-w-2xl" data-hero-fade>
              {ABOUT.intro}
            </p>
            <div className="mt-10 flex flex-wrap gap-3" data-hero-fade>
              <Button href="#people" variant="accent">
                Meet the team
              </Button>
              <Button href="#family" variant="outline">
                The Pirento family
              </Button>
            </div>
          </div>
          <dl className="rounded-[22px] border border-rule bg-paper p-6 md:p-8 lg:col-span-5" data-hero-fade>
            {FACTS.map(([k, v]) => (
              <div
                key={k}
                className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-rule py-3.5 first:pt-0 last:border-0 last:pb-0"
              >
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={1} label={ABOUT.founders.label} title={ABOUT.founders.title} />
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {founders.map((p) => (
            <article
              key={p.name}
              className="grid overflow-hidden rounded-[22px] border border-rule sm:grid-cols-[13rem_1fr]"
              data-reveal
            >
              {p.photo ? (
                <img
                  src={p.photo}
                  alt=""
                  width="600"
                  height="750"
                  className="aspect-[4/3] w-full object-cover object-top sm:aspect-auto sm:h-full"
                />
              ) : (
                <Avatar
                  person={p}
                  className="aspect-[4/3] h-auto w-full rounded-none! text-5xl sm:aspect-auto sm:h-full"
                />
              )}
              <div className="flex min-w-0 flex-col p-6 md:p-8">
                <p className="text-xs tracking-[0.12em] text-muted uppercase">Founder</p>
                <h3 className="mt-3 text-[clamp(1.6rem,2.4vw,2.1rem)]">{p.name}</h3>
                <p className="mt-1 text-sm text-muted">{p.role}</p>
                <p className="mt-5 leading-relaxed">{p.body}</p>
                <div className="mt-auto pt-6">
                  <SiteLink person={p} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section inverse>
        <SectionHeader n={2} label={ABOUT.story.label} title={ABOUT.story.title} />
        <StoryChart />
      </Section>

      <Section>
        <SectionHeader n={3} label={ABOUT.structure.label} title={ABOUT.structure.title} />
        <GroupChart />
      </Section>

      <Section id="family" className="pt-0! md:pt-0!">
        <SectionHeader
          n={4}
          label="The Pirento family"
          title="Every part, / one card each."
          intro="Open a card to visit its website."
        />
        <FamilyGrid items={FAMILY} />
      </Section>

      <Section id="people" className="pt-0! md:pt-0!">
        <SectionHeader n={5} label={ABOUT.people.label} title={ABOUT.people.title} />
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(PEOPLE).map((p) => (
            <li key={p.name} className="flex flex-col rounded-[22px] border border-rule p-6" data-reveal>
              <div className="flex items-center gap-4">
                <Avatar person={p} className="size-16 text-base" />
                <div className="min-w-0">
                  <h3 className="text-lg">{p.name}</h3>
                  <p className="text-sm text-muted">{p.role}</p>
                </div>
              </div>
              <p className="mt-4 leading-relaxed text-muted">{p.body}</p>
              {p.href && (
                <div className="mt-auto pt-5">
                  <SiteLink person={p} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={6} label={ABOUT.partner.label} title={ABOUT.partner.title} />
        <div
          className="mt-12 grid gap-6 rounded-[22px] border border-rule p-6 md:grid-cols-12 md:items-center md:p-8"
          data-reveal
        >
          <h3 className="text-3xl md:col-span-4">{PARTNER.name}</h3>
          <p className="leading-relaxed text-muted md:col-span-8">{PARTNER.body}</p>
        </div>
      </Section>

      <ContactCta n={7} />
    </div>
  );
}
