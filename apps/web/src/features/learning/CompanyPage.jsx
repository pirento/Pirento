// /intern/companies/:id: a company that hires on Pirento Intern, with what it does and its open roles.
import {useRef} from 'react';
import {useParams} from 'react-router-dom';
import {PageHero} from '../../components/PageHero';
import {Section} from '../../components/ui/Heading';
import {useApi} from '../../lib/api/useApi';
import {safeHref} from '../../lib/links';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {NotFound} from '../ecosystem/NotFoundPage';
import {OpeningCard} from './Openings';

export function CompanyPage() {
  const {id} = useParams();
  const c = useApi(`/learning/companies/${id}`);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(c.data)]);
  usePageMeta({title: c.data ? `${c.data.company} · Pirento Intern` : 'Company · Pirento Intern'});
  if (c.error) return <NotFound />;
  if (!c.data) return <div className="min-h-dvh" />;
  return (
    <div ref={ref}>
      <PageHero label="Pirento Intern · Company" title={c.data.company} intro={c.data.about} />
      <Section className="pt-0! md:pt-0!">
        {safeHref(c.data.website) && (
          <a
            href={safeHref(c.data.website)}
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-4"
          >
            {c.data.website}
          </a>
        )}
        <h2 className="mt-12 text-2xl">Open roles</h2>
        {c.data.openings.length === 0 && <p className="mt-4 text-muted">No open roles right now.</p>}
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {c.data.openings.map((o) => (
            <OpeningCard key={o._id} o={o} />
          ))}
        </ul>
      </Section>
    </div>
  );
}
