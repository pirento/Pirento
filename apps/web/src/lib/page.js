// Each page's title, description and canonical URL, set from inside the page.
import {useEffect, useRef} from 'react';
import {reducedMotion} from './motion';

const SITE = 'https://pirento.com';

export function usePageMeta({title, description}) {
  useEffect(() => {
    document.title = title;
    const set = (selector, attr, value) => value && document.querySelector(selector)?.setAttribute(attr, value);
    set('meta[name="description"]', 'content', description);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', description);
    set('link[rel="canonical"]', 'href', SITE + location.pathname);
    set('meta[property="og:url"]', 'content', SITE + location.pathname);
  }, [title, description]);
}

// Tilts the element toward the pointer, max 6°.
export function useTilt() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !matchMedia('(pointer: fine)').matches) return;
    const move = (e) => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      el.style.transform = `perspective(1200px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    };
    addEventListener('pointermove', move);
    return () => removeEventListener('pointermove', move);
  }, []);
  return ref;
}
