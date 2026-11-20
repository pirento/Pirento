// The legal pages (/terms, /privacy, /refunds): one layout, numbered sections, text from the data files.
import {useRef} from 'react';
import {TERMS_VERSION} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Section} from '../../components/ui/Heading';
import {privacy, refunds} from '../../data/legal';
import {terms} from '../../data/site';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

const PAGES = {
  terms: {doc: terms, name: 'Terms and Conditions', title: 'Terms and / Conditions.', version: TERMS_VERSION},
  privacy: {doc: privacy, name: 'Privacy Policy', title: 'Privacy / Policy.'},
  refunds: {doc: refunds, name: 'Refund and Cancellation Policy', title: 'Refunds and / cancellations.'},
};

function LegalPage({page}) {
  const {doc, name, title, version} = PAGES[page];
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: `${name} — Pirento Ecosystem`});
  return (
    <div ref={ref}>
      <PageHero
        label="Legal"
        title={title}
        intro={[doc.intro, `Last updated ${doc.updated}${version ? ` · version ${version}` : ''}`]
          .filter(Boolean)
          .join(' ')}
      />
      <Section className="pt-0! md:pt-0!">
        <ol className="max-w-3xl space-y-12">
          {doc.sections.map((s, i) => (
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

export const Terms = () => <LegalPage page="terms" />;
export const Privacy = () => <LegalPage page="privacy" />;
export const Refunds = () => <LegalPage page="refunds" />;
