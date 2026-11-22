// Bharat ID for Business, the public page: who it is for, what the API gives, how access works, and the request form.
import {useRef} from 'react';
import {BookOpen, Globe, GraduationCap, HandCoins, Landmark, School} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {Steps} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {bharatIdBusiness as copy} from '../../data/site';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {AUTH_METHODS} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {CALLS, apiBase} from './apiSample';
import {RequestForm} from './RequestForm';

const USE_ICONS = [Landmark, HandCoins, School, GraduationCap, BookOpen, Globe];

export function BharatIdBusiness() {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: copy.label, description: copy.intro});
  return (
    <div ref={ref}>
      <PageHero label={copy.label} title={copy.title} hl={copy.hl} intro={copy.intro}>
        <div className="mt-10 flex flex-wrap gap-3" data-hero-fade>
          <Button href="#request" variant="accent">
            {copy.ask}
          </Button>
          <Button to="/login?next=%2Fbharat-id%2Fbusiness%2Fdashboard" variant="outline">
            Business sign-in
          </Button>
        </div>
      </PageHero>

      <Section>
        <SectionHeader n={1} label={copy.uses.label} title={copy.uses.title} />
        <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {copy.uses.items.map((u, i) => {
            const Icon = USE_ICONS[i];
            return (
              <li
                key={u.title}
                className="group/use rounded-[18px] border border-rule p-6 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
                data-reveal
              >
                <span className="flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover/use:border-accent group-hover/use:bg-accent group-hover/use:text-on-accent">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-8 text-2xl">{u.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{u.body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section>
        <SectionHeader n={2} label={copy.gives.label} title={copy.gives.title} />
        <ul className="mt-16 grid gap-4 md:grid-cols-2">
          {copy.gives.items.map((g) => (
            <li key={g.title} className="rounded-[22px] border border-rule bg-stone p-8" data-reveal>
              <h3 className="text-2xl">{g.title}</h3>
              <p className="body mt-3">{g.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeader n={3} label={copy.how.label} title={copy.how.title} />
        <div className="mt-16">
          <Steps steps={copy.how.steps} />
        </div>
      </Section>

      <Section>
        <SectionHeader n={4} label={copy.checks.label} title={copy.checks.title} intro={copy.checks.intro} />
        <ul className="mt-16 grid gap-3 md:grid-cols-2">
          {AUTH_METHODS.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 rounded-[18px] border border-rule p-5"
              data-reveal
            >
              <span>{m.label}</span>
              <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
                Level {m.level}
                {m.expected && <Tag>Expected</Tag>}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeader n={5} label={copy.sample.label} title={copy.sample.title} intro={copy.sample.intro} />
        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {CALLS.map((c) => (
            <figure key={c.path} className="min-w-0 rounded-[18px] border border-rule p-5" data-reveal>
              <figcaption className="text-sm">
                <span className="font-medium">{c.title}</span>
                <span className="mt-1 block font-mono text-xs text-muted">
                  {c.method} {c.path}
                </span>
              </figcaption>
              <pre className="mt-4 overflow-x-auto rounded-[10px] bg-stone p-4 text-xs leading-relaxed">
                <code>{c.curl(apiBase(), 'bid_test_…')}</code>
              </pre>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="request">
        <SectionHeader n={6} label={copy.form.label} title={copy.form.title} intro={copy.form.intro} />
        <div className="mt-16">
          <RequestForm />
          <p className="mt-8 max-w-3xl text-sm text-muted">{copy.note}</p>
        </div>
      </Section>
    </div>
  );
}
