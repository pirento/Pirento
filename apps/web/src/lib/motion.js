import {useLayoutEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export let lenis = null;
export function startSmoothScroll() {
  if (reducedMotion() || lenis) return;
  lenis = new Lenis({duration: 1.1});
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, {immediate: true});
  else window.scrollTo(0, 0);
}

// The preloader resolves this once its curtain lifts; pages wait for it so the
// hero entrance is not hidden behind the curtain.
let release;
export const preloaderDone = new Promise((r) => (release = r));
export const finishPreloader = () => release();

/**
 * Page entrance + scroll reveals for everything inside `ref`:
 * - `.hero .line > span`: slide up from a mask, then `[data-hero-fade]`.
 * - `[data-lines] .line > span`: section heading lines, at 88% of viewport.
 * - `[data-reveal]`: fade up in batches, once.
 * - `.hl`: highlighter sweep when scrolled into view.
 */
export function usePageMotion(ref, deps = []) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (reducedMotion()) {
      root.querySelectorAll('.hl').forEach((el) => el.classList.add('is-on'));
      return;
    }
    let ctx;
    let cancelled = false;
    const hide = gsap.set(root.querySelectorAll('.hero .line > span, [data-hero-fade]'), {opacity: 0});

    preloaderDone.then(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.fromTo(
          '.hero .line > span',
          {yPercent: 110, opacity: 1},
          {yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09},
        );
        tl.fromTo(
          '[data-hero-fade]',
          {y: 24, opacity: 0},
          {y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08},
          '-=0.9',
        );
        tl.fromTo(
          '[data-hero-visual]',
          {scale: 0.97, opacity: 0},
          {scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out'},
          '-=0.7',
        );
        tl.add(() => root.querySelectorAll('.hero .hl').forEach((el) => el.classList.add('is-on')));

        gsap.utils.toArray('[data-lines]').forEach((el) => {
          gsap.from(el.querySelectorAll('.line > span'), {
            yPercent: 110,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: {trigger: el, start: 'top 88%', once: true},
          });
        });

        gsap.set('[data-reveal]', {y: 28, opacity: 0});
        ScrollTrigger.batch('[data-reveal]', {
          start: 'top 92%',
          once: true,
          onEnter: (batch) => gsap.to(batch, {y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.07}),
        });

        root
          .querySelectorAll('.hl:not(.hero .hl)')
          .forEach((el) =>
            ScrollTrigger.create({trigger: el, start: 'top 85%', once: true, onEnter: () => el.classList.add('is-on')}),
          );
        ScrollTrigger.refresh();
      }, root);
    });

    return () => {
      cancelled = true;
      hide.revert();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Splits "Line one / Line two" into masked heading lines.
export const lines = (text) => text.split(' / ');
