// Every legal service by category, with search.
import {useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Search} from 'lucide-react';
import {LEGAL_CATALOGUE} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {ContactCta} from '../../components/layout/ContactCta';
import {Label} from '../../components/ui/Heading';
import {inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useServicesFor} from '../../lib/prices';

export function Legal() {
  const ref = useRef(null);
  const [q, setQ] = useState('');
  const legal = useServicesFor('legal');
  usePageMotion(ref);
  usePageMeta({
    title: 'Pirento Legal — services and prices',
    description: 'Company registration, licences, GST, ITR, trademark and legal consultations with prices up front.',
  });

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return LEGAL_CATALOGUE.map((c) => ({
      title: c.title,
      items: legal.filter((s) => s.category === c.title && (!needle || s.name.toLowerCase().includes(needle))),
    })).filter((g) => g.items.length);
  }, [q]);

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Legal"
        title="Legal work, / priced up front."
        hl="priced up front."
        intro={`${legal.length} services across ${LEGAL_CATALOGUE.length} categories. Fixed price where the work is fixed; a paid consultation where it depends on your matter.`}
      >
        <label
          className="mt-10 flex max-w-xl items-center gap-3 rounded-full border border-rule bg-paper px-5 py-3.5 focus-within:border-ink"
          data-hero-fade
        >
          <Search aria-hidden className="size-4 text-muted" />
          <span className="sr-only">Search legal services</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search, for example GST or trademark"
            className="w-full bg-transparent outline-none placeholder:text-muted"
          />
        </label>
      </PageHero>

      <div className="container-x pb-28">
        {groups.length === 0 && <p className="body py-16">No service matches “{q}”. Try a shorter word.</p>}
        {groups.map((g, i) => (
          <section
            key={g.title}
            className="grid gap-8 border-t border-rule py-12 md:grid-cols-12"
            aria-labelledby={`cat-${i}`}
          >
            <div className="md:col-span-4">
              <Label n={i + 1}>{g.items.length} services</Label>
              <h2 id={`cat-${i}`} className="mt-4 text-3xl">
                {g.title}
              </h2>
            </div>
            <ul className="grid gap-x-8 sm:grid-cols-2 md:col-span-8">
              {g.items.map((s) => (
                <li key={s.slug}>
                  <Link
                    to={`/services/${s.slug}`}
                    className="group flex items-baseline justify-between gap-4 border-b border-rule py-4 hover:border-ink"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="shrink-0 text-sm text-muted tabular-nums group-hover:text-ink">
                      {s.price ? (s.model === 'consult' ? `from ${inr(s.price)}` : inr(s.price)) : 'Quote'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <ContactCta n={groups.length + 1} />
    </div>
  );
}
