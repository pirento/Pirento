// /about: who runs Pirento. Founders, the story as a chart, the group as a chart, the people, and our partner.
import {useRef} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {ContactCta} from '../../components/layout/ContactCta';
import {Heading, Section, SectionHeader} from '../../components/ui/Heading';
import {ABOUT, PARTNER, PEOPLE, TOOLS} from '../../data/group';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {Avatar} from './Avatar';
import {GroupChart} from './GroupChart';
import {OrgCard} from './OrgCard';
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

export function About() {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: 'About Pirento — the people and the company behind it'});
  const founders = [PEOPLE.ravikant, PEOPLE.aman];

  return (
    <div ref={ref}>
      <section className="hero relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
        <div aria-hidden className="grid-bg absolute inset-0" />
        <div className="container-x relative">
          <p className="eyebrow" data-hero-fade>
            About us
          </p>
          <Heading as="h1" text={ABOUT.title} className="h-hero mt-6" />
          <p className="body mt-8 max-w-2xl" data-hero-fade>
            {ABOUT.intro}
          </p>
        </div>
      </section>

      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={1} label={ABOUT.founders.label} title={ABOUT.founders.title} />
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {founders.map((p) => (
            <article
              key={p.name}
              className="grid gap-6 rounded-[22px] border border-rule p-6 sm:grid-cols-[auto_1fr] md:p-8"
              data-reveal
            >
              {p.photo ? (
                <img
                  src={p.photo}
                  alt=""
                  width="600"
                  height="750"
                  className="aspect-[4/5] w-36 rounded-[16px] object-cover object-top md:w-44"
                />
              ) : (
                <Avatar person={p} className="aspect-[4/5] h-auto w-36 rounded-[16px]! text-3xl md:w-44" />
              )}
              <div className="flex min-w-0 flex-col">
                <h3 className="text-2xl">{p.name}</h3>
                <p className="mt-1 text-sm text-muted">{p.role}</p>
                <p className="mt-4 leading-relaxed">{p.body}</p>
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
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {TOOLS.map((t) => (
            <OrgCard key={t.name} item={{...t, note: 'Tool'}} />
          ))}
        </div>
      </Section>

      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={4} label={ABOUT.people.label} title={ABOUT.people.title} />
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(PEOPLE).map((p) => (
            <li key={p.name} className="flex flex-col rounded-[18px] border border-rule p-6" data-reveal>
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
        <SectionHeader n={5} label={ABOUT.partner.label} title={ABOUT.partner.title} />
        <div className="mt-12 max-w-3xl rounded-[18px] border border-rule p-6 md:p-8" data-reveal>
          <h3 className="text-2xl">{PARTNER.name}</h3>
          <p className="mt-3 leading-relaxed text-muted">{PARTNER.body}</p>
        </div>
      </Section>

      <ContactCta n={6} />
    </div>
  );
}
