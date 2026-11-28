// Pirento Legal's home: prices as one rail of small cards you swipe (native scroll with snap, so a finger or trackpad
// never gets stuck), the card nearest the middle facing you and the others turning away in 3D. Chips choose what the
// rail shows: the most asked or one category, which ends with a card to all of that category's services.
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import gsap from 'gsap';
import {ArrowLeft, ArrowRight, ArrowUpRight} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {legalCopy as copy} from '../../data/site';
import {inr} from '../../lib/format';
import {reducedMotion} from '../../lib/motion';
import {useLegalAreas, useServicesFor} from '../../lib/prices';

const CARD = 'w-[78%] shrink-0 snap-center sm:w-[46%] md:w-[38%] lg:w-[calc((100%-3rem)/4)]';

export function LegalPrices({n}) {
  const services = useServicesFor('legal').filter((s) => s.price);
  const areas = useLegalAreas();
  const [area, setArea] = useState(null); // null: the most asked
  const rail = useRef(null);

  // Services and packages made in admin lead, so something new is seen first.
  const popular = [...services.filter((s) => s.custom), ...services.filter((s) => !s.custom)].slice(0, 9);
  const chosen = area && areas.find((a) => a.title === area);
  const list = chosen ? services.filter((s) => s.category === area) : popular;

  // Each card turns by how far it sits from the rail's middle: facing you there, turned away toward the edges.
  useEffect(() => {
    const el = rail.current;
    if (!el || reducedMotion()) return undefined;
    let frame = 0;
    const turn = () => {
      frame = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      for (const card of el.children) {
        const off = (card.offsetLeft + card.offsetWidth / 2 - mid) / el.clientWidth;
        const k = Math.max(-1, Math.min(1, off * 1.6));
        gsap.set(card, {rotationY: -k * 22, z: -Math.abs(k) * 60, opacity: 1 - Math.abs(k) * 0.25});
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(turn);
    };
    el.scrollLeft = 0;
    turn();
    el.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [area, list.length]);

  const by = (dir) => {
    const el = rail.current;
    el.scrollBy({left: dir * el.clientWidth * 0.8, behavior: reducedMotion() ? 'auto' : 'smooth'});
  };

  const chip = (on) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
      on ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
    }`;

  return (
    <Section id="services" className="pt-0! md:pt-0!">
      <SectionHeader
        n={n}
        label="Services"
        title="Prices you / see first."
        intro={`${services.length} services across ${areas.length} categories.`}
      />

      <div
        className="no-scrollbar mt-14 -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0"
        role="group"
        aria-label="Show services for"
      >
        <button type="button" aria-pressed={!area} onClick={() => setArea(null)} className={chip(!area)}>
          {copy.popular}
        </button>
        {areas.map((a) => (
          <button
            key={a.title}
            type="button"
            aria-pressed={area === a.title}
            onClick={() => setArea(a.title)}
            className={chip(area === a.title)}
          >
            {a.title} <span className="opacity-60">{a.count}</span>
          </button>
        ))}
      </div>

      <ul
        ref={rail}
        aria-label={chosen ? chosen.title : copy.popular}
        className="no-scrollbar mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-4 sm:mx-0 sm:px-0 sm:[mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]"
        style={{perspective: '1200px'}}
      >
        {list.map((s) => (
          <li key={s.slug} className={CARD}>
            <Link
              to={`/services/${s.slug}`}
              data-cursor="View"
              className="group/price flex h-full flex-col rounded-[22px] border border-rule bg-paper p-6 transition-colors duration-500 ease-ui hover:border-ink"
            >
              <span className="text-xs text-muted">{s.category}</span>
              <span className="mt-2 text-lg leading-snug font-medium">{s.name}</span>
              {s.deliveryTime && <span className="mt-2 text-sm text-muted">{copy.usually(s.deliveryTime)}</span>}
              <span className="mt-auto flex items-end justify-between gap-3 pt-8">
                <span className="num text-[clamp(1.75rem,2.4vw,2.25rem)]!">
                  {s.model === 'consult' && <span className="text-sm text-muted">from </span>}
                  {inr(s.price)}
                </span>
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
                >
                  <ArrowUpRight className="size-4 transition-transform duration-500 group-hover/price:rotate-45" />
                </span>
              </span>
            </Link>
          </li>
        ))}
        {chosen && (
          <li className={CARD}>
            <Link
              to={`/legal/services#${chosen.anchor}`}
              className="flex h-full min-h-48 flex-col justify-between rounded-[22px] bg-ink p-6 text-paper"
            >
              <span className="text-lg">{copy.seeAll(chosen.count, chosen.title)}</span>
              <ArrowUpRight aria-hidden className="size-6" />
            </Link>
          </li>
        )}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Button to="/legal/services" variant="outline">
          All {services.length} legal services
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted md:hidden">{copy.swipe}</span>
          <button
            type="button"
            onClick={() => by(-1)}
            aria-label={copy.prev}
            className="hidden size-11 items-center justify-center rounded-full border border-rule hover:border-ink md:flex"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => by(1)}
            aria-label={copy.next}
            className="hidden size-11 items-center justify-center rounded-full border border-rule hover:border-ink md:flex"
          >
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </Section>
  );
}
