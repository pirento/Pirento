// /terms: the Terms and Conditions people accept when they create an account.
import {useRef} from 'react';
import {TERMS_VERSION} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Section} from '../../components/ui/Heading';
import {terms} from '../../data/site';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function Terms() {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: 'Terms and Conditions — Pirento Ecosystem'});
  return (
    <div ref={ref}>
      <PageHero
        label="Legal"
        title="Terms and / Conditions."
        intro={`Last updated ${terms.updated} · version ${TERMS_VERSION}`}
      />
      <Section className="pt-0! md:pt-0!">
        <ol className="max-w-3xl space-y-12">
          {terms.sections.map((s, i) => (
            <li key={s.title} data-reveal>
              <h2 className="text-2xl">
                <span className="mr-3 text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              {s.body?.map((p) => (
                <p key={p} className="mt-4 leading-relaxed text-muted">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-muted">
                  {s.list.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
