// The shared sections of every product home page: features, who it is for, related products.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {Section, SectionHeader} from '../../components/ui/Heading';

/** Six features: the first is a wide card, the rest a grid, so the section reads as a story, not a list. */
export function Features({product}) {
  const [lead, ...rest] = [...product.highlights, ...(product.more ?? [])];
  return (
    <Section className="pt-0! md:pt-0!">
      <SectionHeader n={1} label="What you get" title="What it does / today." intro={product.overview} />
      <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          className="flex flex-col justify-between rounded-[22px] bg-stone p-8 md:col-span-2 md:p-12 lg:row-span-2"
          data-reveal
        >
          <span className="eyebrow">01 · {product.short}</span>
          <div className="mt-16">
            <h3 className="text-[clamp(1.75rem,3vw,2.75rem)] leading-tight">{lead.title}</h3>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{lead.body}</p>
          </div>
        </div>
        {rest.map((h, i) => (
          <div
            key={h.title}
            className="group flex flex-col rounded-[22px] border border-rule p-8 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
            data-reveal
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-rule text-sm tabular-nums transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
              {String(i + 2).padStart(2, '0')}
            </span>
            <h3 className="mt-10 text-2xl">{h.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{h.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Audience({product}) {
  if (!product.audience) return null;
  return (
    <Section>
      <SectionHeader n={3} label="Who it is for" title="Made for / people like you." />
      <ul className="mt-16 grid border-t border-rule md:grid-cols-3">
        {product.audience.map((a, i) => (
          <li
            key={a.title}
            className="border-b border-rule py-10 md:border-b-0 md:px-8 md:first:pl-0 md:[&:not(:first-child)]:border-l"
            data-reveal
          >
            <span className="num text-base! text-muted">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-6 text-[clamp(1.5rem,2.4vw,2rem)]">{a.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-muted">{a.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Cross-links to the products that go well with this one, each in its own colour. */
export function Related({product}) {
  const list = (product.related ?? []).map(getProduct).filter(Boolean);
  if (!list.length) return null;
  return (
    <Section>
      <SectionHeader n={6} label="Goes well with" title="One account, / more to use." />
      <ul className="mt-16 grid gap-4 md:grid-cols-3">
        {list.map((p) => (
          <li key={p.slug} data-reveal>
            <Link
              to={`/${p.slug}`}
              data-cursor="Open"
              className="group flex h-full flex-col rounded-[22px] border border-rule p-8 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-3 font-medium">
                  {/* A product's own colour, used only as a small mark. */}
                  <span aria-hidden className="size-3 rounded-full" style={{background: p.color}} />
                  {p.name}
                </span>
                <ArrowUpRight aria-hidden className="size-5 transition-transform duration-500 group-hover:rotate-45" />
              </span>
              <p className="mt-8 text-lg leading-relaxed text-muted">{p.overview}</p>
              {p.status === 'expected' && <span className="mt-6 text-sm text-muted">Expected</span>}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
