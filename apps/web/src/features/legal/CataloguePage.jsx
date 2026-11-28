// Every legal service by category: search with a count, a bar of categories that stays at the top and marks the one
// you are in, and on a phone the first few services of each category with the rest a tap away.
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Search, X} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {ContactCta} from '../../components/layout/ContactCta';
import {Label} from '../../components/ui/Heading';
import {inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useLegalAreas, useServicesFor} from '../../lib/prices';
import {ArtFigure} from '../../components/ArtFigure';
import {legalCopy as copy, processArt} from '../../data/site';

const FIRST = 4; // services a category shows on a phone before "Show all"

export function Legal() {
  const ref = useRef(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(() => new Set());
  const [here, setHere] = useState(null);
  const legal = useServicesFor('legal');
  const areas = useLegalAreas();
  usePageMotion(ref);
  usePageMeta({
    title: 'Pirento Legal — services and prices',
    description: 'Company registration, licences, GST, ITR, trademark and legal consultations with prices up front.',
  });

  // Worked out on every render, so admin edits arriving after the first paint show too.
  const needle = q.trim().toLowerCase();
  const groups = areas
    .map((a) => ({
      ...a,
      items: legal.filter((s) => s.category === a.title && (!needle || s.name.toLowerCase().includes(needle))),
    }))
    .filter((g) => g.items.length);
  const found = groups.reduce((t, g) => t + g.items.length, 0);

  // The bar marks the category nearest the top of the screen.
  useEffect(() => {
    const seen = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setHere(top.target.id);
      },
      {rootMargin: '-20% 0px -70% 0px'},
    );
    document.querySelectorAll('[data-category]').forEach((el) => seen.observe(el));
    return () => {
      seen.disconnect();
    };
  }, [groups.length, needle]);

  // On a phone the bar slides so the marked category is in view.
  const bar = useRef(null);
  useEffect(() => {
    const list = bar.current;
    const chip = list?.querySelector('[aria-current]');
    if (!chip) return;
    list.scrollTo({left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth'});
  }, [here]);

  // Opening a category from the bar (or a link to its anchor) shows all its services.
  const show = (anchor) => setOpen((s) => new Set(s).add(anchor));
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) show(hash);
  }, []);

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Legal"
        title="Legal work, / priced up front."
        hl="priced up front."
        intro={`${legal.length} services across ${areas.length} categories. Fixed price where the work is fixed; a paid consultation where it depends on your matter.`}
      >
        <div className="mt-10 max-w-xl" data-hero-fade>
          <label className="flex items-center gap-3 rounded-full border border-rule bg-paper px-5 py-3.5 focus-within:border-ink">
            <Search aria-hidden className="size-4 text-muted" />
            <span className="sr-only">Search legal services</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search, for example GST or trademark"
              className="w-full bg-transparent outline-none placeholder:text-muted"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label={copy.clear}
                className="text-muted hover:text-ink"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </label>
          {needle && (
            <p className="mt-3 px-5 text-sm text-muted" aria-live="polite">
              {copy.results(found)}
            </p>
          )}
        </div>
      </PageHero>

      {groups.length > 0 && (
        <nav aria-label={copy.jump} className="sticky top-0 z-20 border-y border-rule bg-paper/90 backdrop-blur">
          <ul ref={bar} className="no-scrollbar container-x flex gap-2 overflow-x-auto py-3">
            {groups.map((g) => (
              <li key={g.anchor} className="shrink-0">
                <a
                  href={`#${g.anchor}`}
                  onClick={() => show(g.anchor)}
                  aria-current={here === g.anchor || undefined}
                  className={`block rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                    here === g.anchor ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
                  }`}
                >
                  {g.title} <span className="opacity-60">{g.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="container-x pt-16 pb-28">
        <ArtFigure {...processArt.catalogue} className="mb-16 max-w-3xl" />
        {groups.length === 0 && <p className="body py-16">No service matches “{q}”. Try a shorter word.</p>}
        {groups.map((g, i) => {
          const all = Boolean(needle) || open.has(g.anchor);
          return (
            <section
              key={g.title}
              id={g.anchor}
              data-category
              className="scroll-mt-24 grid gap-8 border-t border-rule py-12 lg:grid-cols-12"
              aria-labelledby={`cat-${i}`}
            >
              <div className="lg:col-span-4">
                <Label n={i + 1}>{g.items.length} services</Label>
                <h2 id={`cat-${i}`} className="mt-4 text-3xl">
                  {g.title}
                </h2>
              </div>
              <div className="lg:col-span-8">
                <ul className="grid gap-x-8 sm:grid-cols-2">
                  {g.items.map((s, k) => (
                    // On a phone only the first few show until the category is opened; wider screens show all.
                    <li key={s.slug} className={!all && k >= FIRST ? 'hidden sm:block' : ''}>
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
                {!all && g.items.length > FIRST && (
                  <button
                    type="button"
                    onClick={() => show(g.anchor)}
                    className="mt-4 rounded-full border border-rule px-4 py-2 text-sm hover:border-ink sm:hidden"
                  >
                    {copy.showAll(g.items.length)}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <ContactCta n={groups.length + 1} />
    </div>
  );
}
