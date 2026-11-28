// The section that differs per product site (prices, tracks, steps…).
import {Link} from 'react-router-dom';
import {ID_SECTIONS} from '@pirento/shared';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {inr} from '../../lib/format';
import {Openings} from '../learning/Openings';
import {LegalPrices} from '../legal/LegalPrices';
import {useServicesFor} from '../../lib/prices';

/** Legal has its own price rail; every other product shows its prices or its own list. */
export function Extra({product, n}) {
  return product.slug === 'legal' ? <LegalPrices n={n} /> : <OtherExtra product={product} n={n} />;
}

function OtherExtra({product, n}) {
  const services = useServicesFor(product.slug).filter((s) => s.price);
  if (services.length) {
    const list = services;
    return (
      <Section id="services" className="pt-0! md:pt-0!">
        <SectionHeader n={n} label="Services" title="Prices you / see first." />
        <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => (
            // Two across on a tablet: an odd last card takes the whole row instead of leaving a hole.
            <li
              key={s.slug}
              className={list.length % 2 && i === list.length - 1 ? 'md:col-span-2 lg:col-span-1' : ''}
              data-reveal
            >
              <Link
                to={`/services/${s.slug}`}
                data-cursor="View"
                className="group flex h-full flex-col rounded-[22px] border border-rule p-8 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
              >
                <span className="text-sm text-muted">{s.category}</span>
                <span className="mt-2 text-lg font-medium">{s.name}</span>
                {s.description && <span className="mt-2 text-sm text-muted">{s.description}</span>}
                {(s.items ?? s.includes)?.length > 0 && (
                  <span className="mt-6 flex flex-wrap gap-2">
                    {(s.items ?? s.includes).map((item) => (
                      <span key={item} className="rounded-full border border-rule px-3 py-1 text-xs text-muted">
                        {item}
                      </span>
                    ))}
                  </span>
                )}
                {s.deliveryTime && <span className="mt-4 text-sm text-muted">Usually {s.deliveryTime}</span>}
                <span className="num mt-auto pt-8">
                  {inr(s.price)}
                  {s.unit && <span className="text-base text-muted"> / {s.unit}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  const blocks = {
    intern: {title: 'Pick a track, / take its exam.', items: product.tracks},
    'bharat-id': {
      title: 'Seven steps, / then Digio.',
      items: [
        ...ID_SECTIONS.map((s) => s.title),
        'Video KYC on Digio',
        'Aadhaar eSign of the declaration',
        'Review and submit',
      ],
    },
    vault: {
      title: 'What happens / to your files.',
      items: [
        'Sealed with AES-256-GCM, a fresh IV per item',
        'Files up to 5 MB, 50 MB in all',
        'Passwords never shown in lists, only on request',
        'Downloads are never opened in the browser',
        'Pirento holds the key: not end-to-end encrypted',
      ],
    },
    ai: {title: 'Ask it / like this.', items: product.examples},
  };
  const b = blocks[product.slug];
  if (!b) return null;
  return (
    <Section id="more" className="pt-0! md:pt-0!">
      <SectionHeader n={n} label={product.short} title={b.title} />
      <ol className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {b.items.map((item, i) => (
          <li key={item} className="flex items-start gap-4 rounded-[22px] border border-rule bg-stone p-8" data-reveal>
            <span className="num text-base! text-muted">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-lg">{item}</span>
          </li>
        ))}
      </ol>
      {product.slug === 'intern' && <Openings />}
    </Section>
  );
}
