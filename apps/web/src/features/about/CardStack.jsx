// A deck of family cards in 3D (GSAP): the front card follows a finger or mouse up and flies off the top on a swipe
// up, going to the back; a swipe down brings the last card back. The names beside it, the keyboard (↑ ↓) and a tap
// on a name move it too. No box around it. Still under reduced motion.
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ArrowUp} from 'lucide-react';
import {home} from '../../data/site';
import {reducedMotion} from '../../lib/motion';
import {FamilyCard} from './FamilyCard';

const STEP = 24; // px each card behind sits lower
const DEPTH = 3; // cards seen behind the front one
const TAP = 6; // px a pointer may move and still count as a tap
const THROW = 70; // px up (or a quick flick) that sends the front card away

export function CardStack({items, label}) {
  const count = items.length;
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(0);
  const cards = useRef([]);
  const veils = useRef([]);
  const stage = useRef(null);
  const moved = useRef(false);
  const busy = useRef(false);
  const first = useRef(true);
  const depth = (i, t) => (i - t + count) % count;

  /** Settles every card at its depth: the front one flat, the others lower, smaller and veiled. */
  const place = (t, animate) => {
    cards.current.forEach((el, i) => {
      if (!el) return;
      const d = depth(i, t);
      const vars = {
        xPercent: -50,
        y: Math.min(d, DEPTH) * STEP,
        z: -d * 50,
        rotationX: 0,
        scale: 1 - Math.min(d, DEPTH) * 0.05,
        autoAlpha: d > DEPTH - 1 ? 0 : 1,
        zIndex: count - d,
      };
      const veil = {opacity: Math.min(d, 2) * 0.28};
      if (animate && !reducedMotion()) {
        gsap.to(el, {...vars, duration: 0.6, ease: 'power3.out', overwrite: true});
        gsap.to(veils.current[i], {...veil, duration: 0.6, overwrite: true});
      } else {
        gsap.set(el, vars);
        gsap.set(veils.current[i], veil);
      }
    });
  };

  // Every card takes the tallest card's height, measured afresh when the width changes.
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
  useLayoutEffect(() => {
    place(top, !first.current);
    first.current = false;
  });

  const focusFront = (t) => {
    requestAnimationFrame(() => {
      cards.current[t]?.firstElementChild?.focus({preventScroll: true});
    });
  };

  /** Sends the front card off the top; it comes back in at the back. */
  const next = () => {
    if (busy.current) return;
    const el = cards.current[top];
    const t = (top + 1) % count;
    if (reducedMotion()) return setTop(t);
    busy.current = true;
    gsap.to(el, {
      y: -(height || 400) * 0.9,
      rotationX: 32,
      autoAlpha: 0,
      duration: 0.45,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        gsap.set(el, {y: DEPTH * STEP + 30, rotationX: 0, scale: 0.8});
        busy.current = false;
        setTop(t);
      },
    });
  };
  /** Brings the card at the back down onto the front. */
  const prev = () => {
    if (busy.current) return;
    const t = (top - 1 + count) % count;
    if (!reducedMotion()) gsap.set(cards.current[t], {y: -(height || 400) * 0.6, rotationX: -24, autoAlpha: 0});
    setTop(t);
  };

  // Dragging the front card: up follows the pointer and tilts back; let go far or fast enough and it flies.
  const onPointerDown = (e) => {
    if (e.button > 0 || busy.current) return;
    const el = cards.current[top];
    if (!el?.contains(e.target)) return;
    moved.current = false;
    const s = {y: e.clientY, lastY: e.clientY, lastT: e.timeStamp, v: 0, dy: 0};
    const move = (ev) => {
      s.dy = ev.clientY - s.y;
      if (Math.abs(s.dy) > TAP) moved.current = true;
      if (!moved.current) return;
      s.v = (ev.clientY - s.lastY) / Math.max(1, ev.timeStamp - s.lastT);
      s.lastY = ev.clientY;
      s.lastT = ev.timeStamp;
      gsap.set(el, {y: s.dy < 0 ? s.dy : s.dy * 0.3, rotationX: s.dy < 0 ? Math.min(30, -s.dy / 6) : 0});
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!moved.current) return;
      if (s.dy < -THROW || s.v < -0.6) next();
      else if (s.dy > THROW || s.v > 0.6) prev();
      else place(top, true);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  return (
    <div className="mt-16 grid items-center gap-12 lg:grid-cols-12">
      <ol className="order-2 lg:order-1 lg:col-span-5" aria-label={label}>
        {items.map((item, i) => (
          <li key={item.name}>
            <button
              type="button"
              onClick={() => setTop(i)}
              aria-current={i === top || undefined}
              className={`flex w-full items-center gap-4 border-b border-rule py-3.5 text-left transition-colors duration-500 ${
                i === top ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="w-6 font-mono text-xs tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-lg">{item.name}</span>
              <span
                aria-hidden
                className={`size-2 rounded-full transition-colors duration-500 ${i === top ? 'bg-accent' : 'bg-rule'}`}
              />
            </button>
          </li>
        ))}
      </ol>

      <div className="order-1 lg:order-2 lg:col-span-7">
        <div
          ref={stage}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          // Keys reach here from the card in front, which holds the focus; the stage itself draws no box.
          onKeyDown={(e) => {
            const by = {ArrowUp: 1, ArrowDown: -1}[e.key];
            if (!by) return;
            e.preventDefault();
            if (by > 0) next();
            else prev();
            focusFront((top + by + count) % count);
          }}
          onDragStart={(e) => e.preventDefault()}
          onPointerDown={onPointerDown}
          className="relative select-none"
          style={{perspective: '1200px', height: height ? height + DEPTH * STEP + 8 : undefined}}
        >
          {items.map((item, i) => {
            const front = i === top;
            return (
              <div
                key={item.name}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                aria-hidden={!front}
                // A drag never opens a card; a card behind comes to the front instead of opening.
                onClickCapture={(e) => {
                  if (moved.current || !front) {
                    e.preventDefault();
                    if (!moved.current) setTop(i);
                  }
                  moved.current = false;
                }}
                className={`absolute top-0 left-1/2 w-[min(19rem,78vw)] origin-bottom rounded-[24px] ${
                  front
                    ? 'cursor-grab touch-none shadow-[0_30px_70px_-40px_rgba(15,38,32,0.5)] active:cursor-grabbing'
                    : ''
                }`}
                style={{height: height || undefined}}
              >
                <FamilyCard item={item} index={i} count={count} front={front} />
                <div
                  ref={(el) => {
                    veils.current[i] = el;
                  }}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[24px] bg-paper opacity-0"
                />
              </div>
            );
          })}
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <ArrowUp aria-hidden className="size-3.5" />
          {home.stackHint}
        </p>
        <p className="sr-only" aria-live="polite">
          {items[top].name}, {top + 1} of {count}
        </p>
      </div>
    </div>
  );
}
