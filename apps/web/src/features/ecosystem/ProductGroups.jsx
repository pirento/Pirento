// Home: the ten products as a 3D carousel (GSAP). The card in front is the one you can open; the others turn away
// around it. Swipe or drag, use the arrows or the keyboard, tap a side card to bring it forward, or pick a need above
// to jump to its first product. Still under reduced motion.
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ArrowLeft, ArrowRight} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {reducedMotion} from '../../lib/motion';
import {ProductCard} from './ProductCard';

const SWIPE = 40; // px of sideways travel that counts as a swipe

export function ProductGroups({copy, n}) {
  const cards = copy.groups.flatMap((g) => g.products.map((slug) => ({product: getProduct(slug), group: g.title})));
  const count = cards.length;
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState(0);
  const stage = useRef(null);
  const items = useRef([]);
  const drag = useRef({x: 0, moved: false});
  const go = (i) => setActive(((i % count) + count) % count);
  // How far a card sits from the front, the short way round, so the ring wraps.
  const offsetOf = (i) => {
    let d = i - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  // Every card takes the tallest card's height, measured afresh when the stage changes width.
  useLayoutEffect(() => {
    if (height) return;
    setHeight(Math.max(...items.current.map((el) => el?.offsetHeight ?? 0)));
  }, [height]);
  useEffect(() => {
    let width = stage.current.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (stage.current.offsetWidth !== width) {
        width = stage.current.offsetWidth;
        setHeight(0);
      }
    });
    ro.observe(stage.current);
    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const still = reducedMotion();
    items.current.forEach((el, i) => {
      if (!el) return;
      const d = offsetOf(i);
      const far = Math.abs(d);
      const to = {
        xPercent: -50,
        x: d * el.offsetWidth * 0.62,
        z: -far * 160,
        rotationY: Math.max(-60, Math.min(60, -d * 28)),
        scale: 1 - Math.min(far, 3) * 0.06,
        autoAlpha: far > 2 ? 0 : 1 - far * 0.2,
        zIndex: 50 - far,
      };
      if (still) gsap.set(el, to);
      else gsap.to(el, {...to, duration: 0.7, ease: 'power3.out', overwrite: true});
    });
    // offsetOf reads `active`; the cards move whenever it or their height changes.
  }, [active, height]);

  const group = cards[active].group;
  return (
    <Section id="products">
      <SectionHeader n={n} label={copy.label} title={copy.title} intro={copy.intro} />

      <div className="mt-14 flex flex-wrap gap-2" role="group" aria-label="Show products for a need">
        {copy.groups.map((g) => (
          <button
            key={g.title}
            type="button"
            aria-pressed={group === g.title}
            onClick={() => go(cards.findIndex((c) => c.group === g.title))}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              group === g.title ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">{copy.groups.find((g) => g.title === group)?.body}</p>

      <div
        ref={stage}
        role="region"
        aria-roledescription="carousel"
        aria-label={copy.label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(active - 1);
          if (e.key === 'ArrowRight') go(active + 1);
        }}
        // Links and pictures would start the browser's own drag and cancel the swipe.
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          drag.current = {x: e.clientX, moved: false};
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - drag.current.x;
          if (Math.abs(dx) > SWIPE) {
            drag.current.moved = true;
            go(active + (dx < 0 ? 1 : -1));
          }
        }}
        className="relative mt-10 touch-pan-y overflow-hidden rounded-[22px] py-6 select-none focus-visible:outline-2"
        style={{perspective: '1600px', height: height ? height + 48 : undefined}}
      >
        {/* The list's own flat layer sits in front of the cards turned back in 3D, so only the cards take clicks. */}
        <ul className="pointer-events-none relative h-full" style={{transformStyle: 'preserve-3d'}}>
          {cards.map(({product, group: g}, i) => {
            const front = i === active;
            return (
              <li
                key={product.slug}
                ref={(el) => {
                  items.current[i] = el;
                }}
                aria-hidden={!front}
                // A swipe never opens a card; a side card comes to the front instead of opening.
                onClickCapture={(e) => {
                  if (drag.current.moved || !front) {
                    e.preventDefault();
                    if (!drag.current.moved) go(i);
                  }
                  drag.current.moved = false;
                }}
                className="pointer-events-auto absolute top-0 left-1/2 w-[min(22rem,78vw)]"
                style={{height: height || undefined}}
              >
                <ProductCard product={product} group={g} tabIndex={front ? 0 : -1} />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Previous product"
          className="flex size-12 items-center justify-center rounded-full border border-rule hover:border-ink"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </button>
        <p className="min-w-24 text-center text-sm tabular-nums" aria-live="polite">
          <span className="sr-only">{cards[active].product.name}, </span>
          {active + 1} / {count}
        </p>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Next product"
          className="flex size-12 items-center justify-center rounded-full border border-rule hover:border-ink"
        >
          <ArrowRight aria-hidden className="size-5" />
        </button>
      </div>
    </Section>
  );
}
