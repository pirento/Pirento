// First-visit curtain: counts 000 → 100, then lifts.
import {useLayoutEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {finishPreloader, reducedMotion} from '../../lib/motion';
import {siteName, useProductSite} from '../../lib/site';

const seen = () => {
  try {
    return sessionStorage.getItem('preloaded') === '1';
  } catch {
    return false;
  }
};

// First load of a session only: counter 000 → 100, accent bar, curtain lifts.
export function Preloader() {
  const name = siteName(useProductSite());
  const [show] = useState(() => !seen() && !reducedMotion());
  const [gone, setGone] = useState(!show);
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!show) return finishPreloader();
    const el = ref.current;
    const counter = el.querySelector('[data-count]');
    const n = {v: 0};
    document.documentElement.style.overflow = 'hidden';
    const tl = gsap.timeline({
      onComplete: () => {
        try {
          sessionStorage.setItem('preloaded', '1');
        } catch {
          /* shows again next load */
        }
        document.documentElement.style.overflow = '';
        setGone(true);
      },
    });
    tl.from(el.querySelectorAll('[data-top] > span'), {yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.08})
      .to(
        n,
        {
          v: 100,
          duration: 1.1,
          ease: 'power2.inOut',
          onUpdate: () => (counter.textContent = String(Math.round(n.v)).padStart(3, '0')),
        },
        0.1,
      )
      .fromTo(el.querySelector('[data-bar]'), {scaleX: 0}, {scaleX: 1, duration: 1.1, ease: 'power2.inOut'}, 0.1)
      .to(el, {yPercent: -100, duration: 0.9, ease: 'expo.inOut'}, '+=0.15')
      .add(finishPreloader, '-=0.45');
    return () => tl.kill();
  }, [show]);

  if (gone) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col justify-between preloader p-5 sm:p-8 lg:p-12"
    >
      <div className="flex justify-between font-display text-sm tracking-[0.04em] uppercase">
        <span className="overflow-hidden" data-top>
          <span className="block">{name}</span>
        </span>
        <span className="overflow-hidden" data-top>
          <span className="block">© {new Date().getFullYear()}</span>
        </span>
      </div>
      <div>
        <div
          data-count
          className="font-display leading-none font-medium tracking-tighter tabular-nums"
          style={{fontSize: 'clamp(5rem, 20vw, 16rem)'}}
        >
          000
        </div>
        <div data-bar className="mt-6 h-px origin-left bg-accent" />
      </div>
    </div>
  );
}
