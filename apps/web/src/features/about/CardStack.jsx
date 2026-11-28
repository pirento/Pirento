// A deck of family cards in 3D that the page's own scroll plays (GSAP ScrollTrigger): the deck holds in view while
// each card in turn is swiped off to the left, and once the last card is in front the page scrolls on. No loop, no box. On a
// mouse the front card tilts toward the pointer. Under reduced motion the cards simply sit in a grid.
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {ArrowDown} from 'lucide-react';
import {home} from '../../data/site';
import {lenis, reducedMotion} from '../../lib/motion';
import {FamilyCard} from './FamilyCard';

gsap.registerPlugin(ScrollTrigger);

const STEP = 22; // px each card behind sits lower
const DEPTH = 3; // cards seen behind the front one
const PER_CARD = 0.7; // share of the viewport's height scrolled per card
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
  const wrap = useRef(null);
  const stage = useRef(null);
  const cards = useRef([]);
  const tilts = useRef([]);
  const veils = useRef([]);
  const trigger = useRef(null);
  const shown = useRef(0);

  /** Lays the deck out for a scroll position `p` (0 = first card in front, count-1 = last). */
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

  // The scroll plays the deck: pinned in the middle of the screen for one stretch per card, then let go.
  useLayoutEffect(() => {
    if (!height) return undefined;
    const ctx = gsap.context(() => {
      gsap.set(cards.current, {xPercent: -50});
      render(0);
      trigger.current = ScrollTrigger.create({
        trigger: wrap.current,
        start: 'center center',
        end: () => `+=${(count - 1) * window.innerHeight * PER_CARD}`,
        pin: true,
        // The page wrapper carries a transform (its fade-in), which breaks a fixed pin; a transform pin is unaffected.
        pinType: 'transform',
        onUpdate: (self) => render(self.progress * (count - 1)),
      });
    });
    ScrollTrigger.refresh();
    return () => {
      trigger.current = null;
      ctx.revert();
    };
  }, [height, count]);

  /** Scrolls the page to where card `i` is in front. */
  const goTo = (i) => {
    const st = trigger.current;
    if (!st) return;
    const y = st.start + ((st.end - st.start) * i) / Math.max(1, count - 1) + 1;
    if (lenis) lenis.scrollTo(y, {duration: 1});
    else window.scrollTo({top: y, behavior: 'smooth'});
  };

  // On a mouse, the front card tilts toward the pointer and the light follows it.
  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
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
    <div ref={wrap} className="mt-16 grid items-center gap-12 lg:grid-cols-12">
      <ol className="hidden lg:col-span-5 lg:block" aria-label={label}>
        {items.map((item, i) => (
          <li key={item.name}>
            <button
              type="button"
              onClick={() => goTo(i)}
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
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="group/stage relative"
          style={{perspective: '1400px', height: height ? height + DEPTH * STEP + 8 : undefined}}
        >
          {items.map((item, i) => (
            <div
              key={item.name}
              ref={(el) => {
                cards.current[i] = el;
              }}
              aria-hidden={i !== active}
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
            <ArrowDown aria-hidden className="size-3.5" />
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
