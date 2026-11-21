// Full-screen menu for phones, revealed from the top.
import {useEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import gsap from 'gsap';
import {brand, socials} from '../../data/site';
import {reducedMotion} from '../../lib/motion';
import {ThemeToggle} from './ThemeToggle';

export function MobileMenu({open, onClose, items}) {
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
        {items.map((item, i) => (
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
      <div className="mt-auto flex items-center gap-3 pb-6 text-sm text-muted min-[360px]:hidden">
        <ThemeToggle /> Light or dark
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-6 text-sm text-muted min-[360px]:mt-auto">
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
