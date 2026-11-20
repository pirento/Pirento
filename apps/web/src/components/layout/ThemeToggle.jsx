// Light/dark switch with a circular reveal where supported.
import {useState} from 'react';
import {Moon, Sun} from 'lucide-react';
import {reducedMotion} from '../../lib/motion';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.mode === 'dark');
  const toggle = (e) => {
    const next = dark ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset.mode = next;
      document.querySelector('meta[name="theme-color"]').content = next === 'dark' ? '#0e171c' : '#ffffff';
      setDark(!dark);
    };
    try {
      localStorage.setItem('mode', next);
    } catch {
      /* choice lasts this visit only */
    }
    if (!document.startViewTransition || reducedMotion()) return apply();
    const {clientX: x, clientY: y} = e;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document
      .startViewTransition(apply)
      .ready.then(() =>
        document.documentElement.animate(
          {clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`]},
          {duration: 600, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)'},
        ),
      );
  };
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-rule transition-colors hover:border-ink"
    >
      <Sun
        aria-hidden
        className={`absolute size-4 transition-all duration-500 ease-ui ${dark ? 'rotate-90 opacity-0' : ''}`}
      />
      <Moon
        aria-hidden
        className={`absolute size-4 transition-all duration-500 ease-ui ${dark ? '' : '-rotate-90 opacity-0'}`}
      />
    </button>
  );
}
