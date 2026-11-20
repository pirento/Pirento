// Home: the three things one Pirento account gives you everywhere.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {Section, SectionHeader} from '../../components/ui/Heading';

export function Pillars({copy, n}) {
  return (
    <Section>
      <SectionHeader n={n} label={copy.label} title={copy.title} />
      <ol className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule md:grid-cols-3">
        {copy.items.map((item, i) => (
          <li key={item.title} className="flex flex-col bg-paper p-8 md:p-10" data-reveal>
            <span className="num text-[clamp(3rem,6vw,5rem)]! leading-none text-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-10 text-[clamp(1.6rem,2.4vw,2.1rem)]">{item.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{item.body}</p>
            <Link
              to={item.to}
              className="mt-auto inline-flex items-center gap-2 pt-10 text-sm font-medium underline-offset-4 hover:underline"
            >
              {item.cta} <ArrowUpRight aria-hidden className="size-4" />
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}
