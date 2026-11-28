// A deck of family cards in 3D (GSAP): swipe the front card left and it turns away off the deck, bringing the next
// one forward; swipe right to bring it back. It stops at the last card (no loop) and never holds the page's scroll. The
// names beside it and ← → move it too; on a mouse the front card tilts toward the pointer. Under reduced motion the
// cards simply sit in a grid.
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ArrowLeft} from 'lucide-react';
import {home} from '../../data/site';
import {reducedMotion} from '../../lib/motion';
import {FamilyCard} from './FamilyCard';

const STEP = 22; // px each card behind sits lower
const DEPTH = 3; // cards seen behind the front one
const SLOP = 8; // px a pointer moves before it counts as a swipe or a scroll
const THROW = 50; // px sideways (or a quick flick) that moves to the next card
const WIDTH = 'w-[min(17rem,74vw)] sm:w-[19rem] lg:w-[21rem]';
// A soft light where the pointer is, so the tilt reads as a real card (theme colours only).
const LIGHT =
  'radial-gradient(circle at var(--mx, 50%) var(--my, 0%), color-mix(in srgb, var(--on-inverse) 22%, transparent), transparent 60%)';

const two = (n) => String(n).padStart(2, '0');

export function CardStack({items, label}) {
  const [still] = useState(reducedMotion);
  if (still) {
    return (
      <div className="mt-16 grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.name} className={WIDTH}>
            <FamilyCard item={item} index={i} count={items.length} front />
          </div>
        ))}
      </div>
    );
  }
  return <Deck items={items} label={label} />;
}

function Deck({items, label}) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState(0);
  const stage = useRef(null);
  const cards = useRef([]);
  const tilts = useRef([]);
  const veils = useRef([]);
  const pos = useRef({p: 0}); // which card is in front, as a float while moving
  const drag = useRef(null);
  const moved = useRef(false);
  const shown = useRef(0);

  /** Lays the deck out for a position `p` (0 = first card in front, count-1 = last; between while moving). */
  const render = (p) => {
    cards.current.forEach((el, i) => {
      if (!el) return;
      const k = i - p;
      if (k < 0) {
        // Swiped off to the left: turning away and tipping like a card flicked by hand. It stays solid until most of
        // the way out, so the card behind never shows through it.
        const t = Math.max(k, -1);
        gsap.set(el, {
          x: t * (el.offsetWidth * 1.2 + 80),
          y: -t * 24,
          z: 0,
          rotationX: 0,
          rotationY: t * 32,
          rotationZ: t * 10,
          scale: 1,
          autoAlpha: t > -0.7 ? 1 : (1 + t) / 0.3,
          zIndex: count - i,
        });
        gsap.set(veils.current[i], {opacity: 0});
      } else {
        // Waiting: lower, further back, a little smaller and tipped, under a veil.
        const d = Math.min(k, DEPTH);
        gsap.set(el, {
          x: 0,
          y: d * STEP,
          z: -d * 80,
          rotationX: -d * 5,
          rotationY: 0,
          rotationZ: 0,
          scale: 1 - d * 0.06,
          autoAlpha: Math.max(0, Math.min(1, DEPTH - k)),
          zIndex: count - i,
        });
        gsap.set(veils.current[i], {opacity: Math.min(k, 2) * 0.25});
      }
    });
    const now = Math.min(count - 1, Math.max(0, Math.round(p)));
    if (now !== shown.current) {
      shown.current = now;
      setActive(now);
    }
  };

  // Every card takes the tallest card's height, measured afresh when the stage changes width.
  useLayoutEffect(() => {
    if (height) return;
    setHeight(Math.max(...cards.current.map((el) => el?.firstElementChild?.offsetHeight ?? 0)));
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

  // Placed once the cards are measured, and again whenever the width changes.
  useLayoutEffect(() => {
    if (!height) return;
    gsap.set(cards.current, {xPercent: -50});
    render(pos.current.p);
  });

  /** Brings card `i` to the front (no wrapping: it stops at the first and the last). */
  const go = (i) => {
    const to = Math.max(0, Math.min(count - 1, i));
    gsap.killTweensOf(pos.current);
    if (reducedMotion()) {
      pos.current.p = to;
      render(to);
      return;
    }
    gsap.to(pos.current, {p: to, duration: 0.6, ease: 'power3.out', onUpdate: () => render(pos.current.p)});
  };

  // A sideways swipe moves the deck; an up-and-down one is left to the page, so scrolling never gets stuck here.
  const onPointerDown = (e) => {
    if (e.button > 0) return;
    gsap.killTweensOf(pos.current);
    moved.current = false;
    const d = {
      x: e.clientX,
      y: e.clientY,
      p0: Math.round(pos.current.p),
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      dx: 0,
    };
    drag.current = d;
    const span = (cards.current[0]?.offsetWidth ?? 300) * 1.2 + 80;
    const move = (ev) => {
      d.dx = ev.clientX - d.x;
      const dy = ev.clientY - d.y;
      if (!moved.current) {
        if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(d.dx)) return up(); // a scroll, not a swipe
        if (Math.abs(d.dx) < SLOP) return;
        moved.current = true;
      }
      d.v = (ev.clientX - d.lastX) / Math.max(1, ev.timeStamp - d.lastT);
      d.lastX = ev.clientX;
      d.lastT = ev.timeStamp;
      let p = d.p0 - d.dx / span;
      // Past the first or the last card the deck only gives a little.
      if (p < 0) p *= 0.25;
      if (p > count - 1) p = count - 1 + (p - count + 1) * 0.25;
      pos.current.p = p;
      render(p);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      drag.current = null;
      if (!moved.current) return;
      const next = d.dx < -THROW || d.v < -0.4 ? 1 : d.dx > THROW || d.v > 0.4 ? -1 : 0;
      go(d.p0 + next);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // On a mouse, the front card tilts toward the pointer and the light follows it.
  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse' || drag.current) return;
    const el = tilts.current[active];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, {rotationY: x * 14, rotationX: -y * 10, duration: 0.5, ease: 'power3.out'});
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const onPointerLeave = () => {
    gsap.to(tilts.current, {rotationY: 0, rotationX: 0, duration: 0.7, ease: 'power3.out'});
  };

  return (
    <div className="mt-16 grid items-center gap-12 lg:grid-cols-12">
      <ol className="hidden lg:col-span-5 lg:block" aria-label={label}>
        {items.map((item, i) => (
          <li key={item.name}>
            <button
              type="button"
              onClick={() => go(i)}
              aria-current={i === active || undefined}
              className={`flex w-full items-center gap-4 border-b border-rule py-3.5 text-left transition-colors duration-500 ${
                i === active ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="w-6 font-mono text-xs tabular-nums">{two(i + 1)}</span>
              <span className="flex-1 text-lg">{item.name}</span>
              <span
                aria-hidden
                className={`size-2 rounded-full transition-colors duration-500 ${i === active ? 'bg-accent' : 'bg-rule'}`}
              />
            </button>
          </li>
        ))}
      </ol>

      <div className="lg:col-span-7">
        <div
          ref={stage}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          // Keys reach here from the card in front, which holds the focus.
          onKeyDown={(e) => {
            const by = {ArrowLeft: 1, ArrowRight: -1}[e.key];
            if (!by) return;
            e.preventDefault();
            go(Math.round(pos.current.p) + by);
          }}
          onDragStart={(e) => e.preventDefault()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="group/stage relative cursor-grab touch-pan-y select-none active:cursor-grabbing"
          style={{perspective: '1400px', height: height ? height + DEPTH * STEP + 8 : undefined}}
        >
          {items.map((item, i) => (
            <div
              key={item.name}
              ref={(el) => {
                cards.current[i] = el;
              }}
              aria-hidden={i !== active}
              // A swipe never opens a card; a card behind comes to the front instead of opening.
              onClickCapture={(e) => {
                if (moved.current || i !== active) {
                  e.preventDefault();
                  if (!moved.current) go(i);
                }
                moved.current = false;
              }}
              className={`absolute top-0 left-1/2 origin-[50%_90%] ${WIDTH}`}
              style={{height: height || undefined, transformStyle: 'preserve-3d'}}
            >
              <div
                ref={(el) => {
                  tilts.current[i] = el;
                }}
                className={`relative h-full rounded-[24px] ${
                  i === active ? 'shadow-[0_40px_80px_-40px_rgba(15,38,32,0.55)]' : ''
                }`}
              >
                <FamilyCard item={item} index={i} count={count} front={i === active} />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover/stage:opacity-100"
                  style={{background: LIGHT}}
                />
                <div
                  ref={(el) => {
                    veils.current[i] = el;
                  }}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[24px] bg-paper opacity-0"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted">
          <span className="font-mono tabular-nums">
            {two(active + 1)} / {two(count)}
          </span>
          <span aria-hidden className="h-px w-8 bg-rule" />
          <span className="flex items-center gap-1.5">
            <ArrowLeft aria-hidden className="size-3.5" />
            {home.stackHint}
          </span>
        </div>
        <p className="sr-only" aria-live="polite">
          {items[active].name}, {active + 1} of {count}
        </p>
      </div>
    </div>
  );
}
