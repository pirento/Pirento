// Home: the three things one Pirento account gives you everywhere, as numbered lines beside a picture of them.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {ArtFigure} from '../../components/ArtFigure';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {processArt} from '../../data/site';

export function Pillars({copy, n}) {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:sticky lg:top-28 lg:col-span-5">
          <SectionHeader n={n} label={copy.label} title={copy.title} />
          <ArtFigure {...processArt.pillars} className="mt-12" />
        </div>
        <ol className="border-t border-rule lg:col-span-6 lg:col-start-7">
          {copy.items.map((item, i) => (
            <li key={item.title} className="grid gap-4 border-b border-rule py-10 sm:grid-cols-[6rem_1fr]" data-reveal>
              <span className="num text-[clamp(2.5rem,5vw,4rem)]! leading-none text-muted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[clamp(1.6rem,2.4vw,2.1rem)]">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{item.body}</p>
                <Link
                  to={item.to}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {item.cta} <ArrowUpRight aria-hidden className="size-4" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
