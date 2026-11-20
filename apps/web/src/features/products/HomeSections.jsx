// The sections of a product home page: features (three layouts), who it is for, how it works (two layouts), related products.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {Illustration} from '../../components/Illustration';
import {productIllustration} from '../../data/site';
import {Heading, Label, Section, SectionHeader} from '../../components/ui/Heading';
import {Steps} from '../../components/ui/Blocks';

const featuresOf = (product) => [...product.highlights, ...(product.more ?? [])];

export function Features({product, variant = 'bento', n}) {
  if (variant === 'rows') return <FeatureRows product={product} n={n} />;
  if (variant === 'cards') return <FeatureCards product={product} n={n} />;
  return <FeatureBento product={product} n={n} />;
}

/** Rows: the heading stays put on the left while numbered lines scroll by on the right. */
function FeatureRows({product, n}) {
  return (
    <Section className="pt-0! md:pt-0!">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeader n={n} label="What you get" title="Six things / it does." />
          </div>
        </div>
        <ol className="border-t border-rule lg:col-span-8">
          {featuresOf(product).map((h, i) => (
            <li key={h.title} className="grid gap-4 border-b border-rule py-8 sm:grid-cols-[5rem_1fr]" data-reveal>
              <span className="num text-[clamp(1.75rem,3vw,2.5rem)]! text-muted">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <h3 className="text-[clamp(1.5rem,2.4vw,2rem)]">{h.title}</h3>
                <p className="mt-2 max-w-xl text-lg leading-relaxed text-muted">{h.body}</p>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/** Cards: six even cards on stone, two rows of three. */
function FeatureCards({product, n}) {
  return (
    <Section className="pt-0! md:pt-0!">
      <SectionHeader n={n} label="What you get" title="Everything / in one place." intro={product.overview} />
      <div className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {featuresOf(product).map((h, i) => (
          <div
            key={h.title}
            className="group bg-stone p-8 transition-colors duration-500 hover:bg-paper md:p-10"
            data-reveal
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-rule text-sm tabular-nums transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-12 text-2xl">{h.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{h.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Bento: the first feature is a wide card, the rest a grid, so the section reads as a story, not a list. */
function FeatureBento({product, n}) {
  const [lead, ...rest] = featuresOf(product);
  return (
    <Section className="pt-0! md:pt-0!">
      <SectionHeader n={n} label="What you get" title="What it does / today." intro={product.overview} />
      <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          className="flex flex-col justify-between rounded-[22px] bg-stone p-8 md:col-span-2 md:p-12 lg:row-span-2"
          data-reveal
        >
          <span className="eyebrow">01 · {product.short}</span>
          <Illustration name={productIllustration[product.slug]} className="mt-8 hidden md:block" />
          <div className="mt-10">
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

export function Audience({product, n}) {
  if (!product.audience) return null;
  return (
    <Section>
      <SectionHeader n={n} label="Who it is for" title="Made for / people like you." />
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
export function Related({product, n}) {
  const list = (product.related ?? []).map(getProduct).filter(Boolean);
  if (!list.length) return null;
  return (
    <Section>
      <SectionHeader n={n} label="Goes well with" title="One account, / more to use." />
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

/** How it works: a dark band with steps across, or a paper timeline down the page. */
export function How({product, variant = 'steps', n}) {
  if (variant === 'timeline') {
    return (
      <Section id="how">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeader n={n} label="How it works" title="Step by / step." />
          </div>
          <ol className="relative border-l border-rule lg:col-span-7">
            {product.steps.map((s, i) => (
              <li key={s.title} className="relative pb-12 pl-10 last:pb-0" data-reveal>
                <span
                  aria-hidden
                  className={`absolute top-1 -left-[9px] size-[17px] rounded-full border-2 ${
                    i === product.steps.length - 1 ? 'border-accent bg-accent' : 'border-ink bg-paper'
                  }`}
                />
                <span className="text-sm text-muted tabular-nums">Step {String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 text-2xl">{s.title}</h3>
                <p className="mt-2 max-w-lg leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    );
  }
  return (
    <section id="how" className="inverse py-28 md:py-40">
      <div className="container-x">
        <Label n={n}>How it works</Label>
        <Heading text="From first click / to done." className="h-section mt-6 mb-20" data-lines />
        <Steps steps={product.steps} />
      </div>
    </section>
  );
}
