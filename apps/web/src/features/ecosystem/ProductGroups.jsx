// Home: the ten products as a 3D carousel (GSAP). The ring follows a finger or mouse as it is dragged and settles on
// the nearest card when let go, further for a quick flick. The card in front opens its product; a side card comes
// forward on a tap; arrows, dots, the keyboard and the need chips move it too. Still under reduced motion.
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ArrowLeft, ArrowRight} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {reducedMotion} from '../../lib/motion';
import {ProductCard} from './ProductCard';

const GAP = 0.74; // how far apart neighbouring cards sit, as a share of a card's width
const TAP = 6; // px a pointer may move and still count as a tap
const FLICK = 180; // ms of travel a flick adds when let go

// The way round from a to b on a ring of `count`, between -count/2 and count/2.
const around = (a, b, count) => {
  let d = (((b - a) % count) + count) % count;
  if (d > count / 2) d -= count;
  return d;
};

export function ProductGroups({copy, n}) {
  const cards = copy.groups.flatMap((g) => g.products.map((slug) => ({product: getProduct(slug), group: g.title})));
  const count = cards.length;
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState(0);
  const stage = useRef(null);
  const items = useRef([]);
  const veils = useRef([]);
  const ring = useRef({pos: 0}); // the card in front, as a float while moving
  const drag = useRef(null);
  const moved = useRef(false);

  /** Places every card for a ring position: in front, turned away to the sides, or out of sight behind. */
  const layout = (pos) => {
    items.current.forEach((el, i) => {
      if (!el) return;
      const d = around(pos, i, count);
      const far = Math.abs(d);
      gsap.set(el, {
        xPercent: -50,
        x: d * el.offsetWidth * GAP,
        z: -far * 220,
        rotationY: Math.max(-70, Math.min(70, -d * 34)),
        scale: 1 - Math.min(far, 3) * 0.08,
        autoAlpha: far > 2.5 ? 0 : 1,
        zIndex: Math.round(100 - far * 10),
      });
      gsap.set(veils.current[i], {opacity: Math.min(far, 1.5) * 0.45});
    });
  };

  /** Turns the ring to a position (any float); settles the chips, dots and counter on where it lands. */
  const spin = (to) => {
    gsap.killTweensOf(ring.current);
    setActive(((Math.round(to) % count) + count) % count);
    if (reducedMotion()) {
      ring.current.pos = to;
      layout(to);
      return;
    }
    gsap.to(ring.current, {pos: to, duration: 0.8, ease: 'power3.out', onUpdate: () => layout(ring.current.pos)});
  };
  const go = (i) => spin(ring.current.pos + around(ring.current.pos, i, count));
  const step = (by) => spin(Math.round(ring.current.pos) + by);

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
    const state = ring.current;
    return () => {
      ro.disconnect();
      gsap.killTweensOf(state);
    };
  }, []);
  // Redrawn once the cards are measured; layout reads only refs.
  useLayoutEffect(() => {
    layout(ring.current.pos);
  });

  // Dragging: the ring follows the pointer, then settles on the nearest card, carried on by a quick flick.
  const onPointerDown = (e) => {
    if (e.button > 0) return;
    gsap.killTweensOf(ring.current);
    moved.current = false;
    const width = items.current[0]?.offsetWidth ?? 300;
    drag.current = {x: e.clientX, pos: ring.current.pos, width, lastX: e.clientX, lastT: e.timeStamp, v: 0};
    const move = (ev) => {
      const s = drag.current;
      const dx = ev.clientX - s.x;
      if (Math.abs(dx) > TAP) moved.current = true;
      if (!moved.current) return;
      const dt = Math.max(1, ev.timeStamp - s.lastT);
      s.v = (ev.clientX - s.lastX) / dt;
      s.lastX = ev.clientX;
      s.lastT = ev.timeStamp;
      ring.current.pos = s.pos - dx / (s.width * GAP);
      layout(ring.current.pos);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const s = drag.current;
      spin(
        moved.current ? Math.round(ring.current.pos - (s.v * FLICK) / (s.width * GAP)) : Math.round(ring.current.pos),
      );
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

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
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
        // Links and pictures would start the browser's own drag and cancel the swipe.
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        className="relative mt-10 cursor-grab touch-pan-y overflow-hidden rounded-[22px] py-8 select-none focus-visible:outline-2 active:cursor-grabbing"
        style={{perspective: '1800px', height: height ? height + 64 : undefined}}
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
                // A drag never opens a card; a side card comes to the front instead of opening.
                onClickCapture={(e) => {
                  if (moved.current || !front) {
                    e.preventDefault();
                    if (!moved.current) go(i);
                  }
                  moved.current = false;
                }}
                className={`pointer-events-auto absolute top-0 left-1/2 w-[min(22rem,76vw)] rounded-[22px] ${
                  front ? 'shadow-[0_30px_80px_-40px_rgba(15,38,32,0.45)]' : ''
                }`}
                style={{height: height || undefined}}
              >
                <ProductCard product={product} group={g} tabIndex={front ? 0 : -1} />
                {/* A soft veil over the cards to the sides, so they recede without showing through each other. */}
                <div
                  ref={(el) => {
                    veils.current[i] = el;
                  }}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[22px] bg-paper opacity-0"
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous product"
          className="flex size-12 items-center justify-center rounded-full border border-rule hover:border-ink"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </button>
        <ol className="flex items-center gap-1" aria-label="Choose a product">
          {cards.map(({product}, i) => (
            <li key={product.slug}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={product.name}
                aria-current={i === active || undefined}
                className="flex size-6 items-center justify-center"
              >
                <span
                  aria-hidden
                  className={`block rounded-full transition-all duration-500 ${i === active ? 'h-2.5 w-6' : 'size-2 bg-rule'}`}
                  // The dot in front wears its product's colour, from the brand register.
                  style={i === active ? {background: product.color} : undefined}
                />
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next product"
          className="flex size-12 items-center justify-center rounded-full border border-rule hover:border-ink"
        >
          <ArrowRight aria-hidden className="size-5" />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {cards[active].product.name}, {active + 1} of {count}
      </p>
    </Section>
  );
}
