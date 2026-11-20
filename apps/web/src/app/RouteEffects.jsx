// Runs on every page change: keeps a partner code, resets the scroll and fades the new page in.
import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import gsap from 'gsap';
import {lenis, reducedMotion, scrollToTop} from '../lib/motion';

/** What happens on every page change: remember a partner code, scroll, fade the page in. */
export function RouteEffects() {
  const {pathname, hash, search} = useLocation();

  // A Pirento One link (?ref=P1A2B3C) is remembered; checkout sends it with the order.
  useEffect(() => {
    const ref = new URLSearchParams(search).get('ref');
    if (!ref || !/^P[0-9A-F]{6}$/i.test(ref)) return;
    try {
      localStorage.setItem('pirento.ref', ref.toUpperCase());
    } catch {
      /* storage blocked: the referral is simply not recorded */
    }
  }, [search]);

  useEffect(() => {
    const target = hash && document.querySelector(hash);
    if (target) {
      if (lenis) lenis.scrollTo(target);
      else target.scrollIntoView({behavior: 'smooth'});
      return;
    }
    scrollToTop();
    if (!reducedMotion()) {
      gsap.fromTo('#main', {opacity: 0, y: 12}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'});
    }
  }, [pathname, hash]);

  return null;
}
