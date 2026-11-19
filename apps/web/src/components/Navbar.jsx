import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router-dom';
import {Menu, Moon, Sun, X} from 'lucide-react';
import gsap from 'gsap';
import {brand, nav, socials} from '../data/site';
import {useSession} from '../lib/api';
import {reducedMotion} from '../lib/motion';
import {Button} from './ui';

export const Logo = () => (
  <Link
    to="/"
    className="flex items-center gap-2.5 font-display text-[0.95rem] font-semibold tracking-[0.04em] uppercase"
  >
    <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" />
    {brand.name}
  </Link>
);

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.mode === 'dark');
  const toggle = (e) => {
    const next = dark ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset.mode = next;
      document.querySelector('meta[name="theme-color"]').content = next === 'dark' ? '#0b1a16' : '#f1f3f0';
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

function PillNav() {
  const {pathname, hash} = useLocation();
  const listRef = useRef(null);
  const [pill, setPill] = useState(null);
  const active = (to) =>
    to.includes('#') ? `${pathname}${hash}` === to : to === '/' ? pathname === '/' && !hash : pathname.startsWith(to);

  useLayoutEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    setPill(el ? {left: el.offsetLeft, width: el.offsetWidth} : null);
  }, [pathname, hash]);

  return (
    <ul ref={listRef} className="relative hidden items-center rounded-full border border-rule p-1 lg:flex">
      {pill && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-ink transition-all duration-500 ease-ui"
          style={pill}
        />
      )}
      {nav.map((item) => (
        <li key={item.to} data-active={active(item.to)}>
          <NavLink
            to={item.to}
            className={`relative block rounded-full px-4 py-1.5 text-sm transition-colors duration-500 ${
              active(item.to) ? 'text-paper' : 'text-muted hover:text-ink'
            }`}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function MobileMenu({open, onClose}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    if (!reducedMotion()) {
      gsap.fromTo(
        ref.current,
        {clipPath: 'inset(0 0 100% 0)'},
        {clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut'},
      );
      gsap.from(ref.current.querySelectorAll('[data-menu-link]'), {
        yPercent: 110,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.06,
        delay: 0.3,
      });
    }
    return () => {
      document.documentElement.style.overflow = '';
      removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      id="mobile-menu"
      inert={!open}
      className={`fixed inset-0 z-40 flex flex-col bg-paper px-5 pt-28 pb-10 lg:hidden ${open ? '' : 'invisible'}`}
    >
      <ol className="space-y-2">
        {nav.map((item, i) => (
          <li key={item.to} className="overflow-hidden">
            <Link
              to={item.to}
              onClick={onClose}
              data-menu-link
              className="flex items-baseline gap-4 font-display text-5xl tracking-tight"
            >
              <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-6 text-sm text-muted">
        <a href={`mailto:${brand.email}`}>{brand.email}</a>
        {socials.map((s) => (
          <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">
            {s.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function Navbar() {
  const {user} = useSession();
  const {pathname} = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      setScrolled(scrollY > 12);
      setHidden(scrollY > last && scrollY > 200);
      last = scrollY;
    };
    addEventListener('scroll', onScroll, {passive: true});
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-[68px] transition-[transform,background-color,border-color] duration-500 ease-ui ${
          scrolled && !open ? 'border-b border-rule bg-paper/80 backdrop-blur-md' : 'border-b border-transparent'
        } ${hidden && !open ? '-translate-y-full' : ''}`}
      >
        <nav aria-label="Main" className="container-x flex h-full items-center justify-between gap-4">
          <Logo />
          <PillNav />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-xs text-muted xl:flex">
              <span aria-hidden className="pulse size-1.5 rounded-full bg-accent" />
              {brand.status}
            </span>
            <ThemeToggle />
            <Button to={user ? '/account' : '/login'} className="hidden px-5! py-2.5! sm:inline-flex">
              {user ? 'Account' : 'Sign in'}
            </Button>
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex size-10 items-center justify-center rounded-full border border-rule lg:hidden"
            >
              {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
