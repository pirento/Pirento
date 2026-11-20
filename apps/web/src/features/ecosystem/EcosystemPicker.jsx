// Home hero widget: pick any of the ten products and preview its own site, in its own colours.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';

export function EcosystemPicker() {
  const [slug, setSlug] = useState(PRODUCTS[0].slug);
  const p = PRODUCTS.find((x) => x.slug === slug);
  return (
    <div className="rounded-[22px] border border-rule bg-paper p-3 shadow-[0_30px_80px_-40px_rgba(15,38,32,0.4)]">
      {/* The preview: a slice of the chosen product's site, its dark field and accent. */}
      <div
        style={{'--brand': p.color, '--brand-dark': p.dark}}
        className="relative overflow-hidden rounded-[16px] bg-(--brand-dark) p-6 text-white md:p-8"
        aria-live="polite"
      >
        <div aria-hidden className="grid-bg absolute inset-0 opacity-20" />
        <div className="relative">
          <p className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.04em] uppercase">
            <span aria-hidden className="size-2.5 rounded-[3px] bg-(--brand)" />
            {p.name}
            {p.status === 'expected' && (
              <span className="ml-auto text-xs font-normal tracking-normal normal-case text-white/75">Expected</span>
            )}
          </p>
          <p className="mt-10 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight">{p.quote}</p>
          <p className="mt-4 max-w-md text-sm text-white/75">{p.overview}</p>
          <Link
            to={`/${p.slug}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--brand) px-5 py-2.5 text-sm font-medium"
            style={{color: p.onColor}}
          >
            Visit {p.name} <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
      <div role="tablist" aria-label="Pirento products" className="mt-3 grid grid-cols-5 gap-1">
        {PRODUCTS.map((x) => (
          <button
            key={x.slug}
            role="tab"
            aria-selected={x.slug === slug}
            onClick={() => setSlug(x.slug)}
            onMouseEnter={() => setSlug(x.slug)}
            className={`flex flex-col items-center gap-1.5 rounded-[12px] px-1 py-2.5 text-[0.7rem] transition-colors ${
              x.slug === slug ? 'bg-stone text-ink' : 'text-muted hover:bg-stone hover:text-ink'
            }`}
          >
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{background: x.color}} />
            <span className="truncate">{x.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
