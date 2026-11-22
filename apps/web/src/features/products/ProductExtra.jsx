// The section that differs per product site (prices, tracks, steps…).
import {Link} from 'react-router-dom';
import {ID_SECTIONS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {inr} from '../../lib/format';
import {Openings} from '../learning/Openings';
import {useLegalAreas, useServicesFor} from '../../lib/prices';

export function Extra({product, n}) {
  const services = useServicesFor(product.slug).filter((s) => s.price);
  const areas = useLegalAreas();
  if (services.length) {
    // Services and packages made in admin lead, so something new is seen on the home page.
    const list =
      product.slug === 'legal'
        ? [...services.filter((s) => s.custom), ...services.filter((s) => !s.custom)].slice(0, 9)
        : services;
    return (
      <Section id="services" className="pt-0! md:pt-0!">
        <SectionHeader
          n={n}
          label="Services"
          title="Prices you / see first."
          intro={
            product.slug === 'legal' ? `${services.length} services across ${areas.length} categories.` : undefined
          }
        />
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
        {product.slug === 'legal' && (
          <>
            <h3 className="mt-20 text-2xl">Every category</h3>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
              {areas.map((c, i) => (
                <li key={c.title} className="bg-paper" data-reveal>
                  <Link
                    to={`/legal/services#${c.anchor}`}
                    className="flex h-full flex-col p-6 transition-colors duration-300 hover:bg-stone"
                  >
                    <span className="num text-base! text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mt-6 font-medium">{c.title}</span>
                    <span className="mt-1 text-sm text-muted">{c.count} services</span>
                  </Link>
                </li>
              ))}
              {/* Blank cells finish the last row, so the hairline grid never shows a grey gap (2 or 4 across). */}
              {[0, 1, 2].map((k) => (
                <li
                  key={`blank-${k}`}
                  aria-hidden
                  className={`hidden bg-paper ${k < (2 - (areas.length % 2)) % 2 ? 'sm:block' : ''} ${k < (4 - (areas.length % 4)) % 4 ? 'lg:block' : 'lg:hidden'}`}
                />
              ))}
            </ul>
          </>
        )}
        {product.slug === 'legal' && (
          <div className="mt-10" data-reveal>
            <Button to="/legal/services" variant="outline">
              All {services.length} legal services
            </Button>
          </div>
        )}
      </Section>
    );
  }
  const blocks = {
    intern: {title: 'Five tracks, / one exam each.', items: product.tracks},
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
    <Section className="pt-0! md:pt-0!">
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
