// The fixed top bar: logo, page links, status pill, theme toggle and sign-in.
import {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Menu, X} from 'lucide-react';
import {Logo} from './Logo';
import {MobileMenu} from './MobileMenu';
import {PillNav} from './PillNav';
import {ThemeToggle} from './ThemeToggle';
import {useSiteNav} from './useSiteNav';
import {Button} from '../ui/Button';

export function Navbar() {
  const {items, status, cta} = useSiteNav();
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
        <nav aria-label="Main" className="container-x flex h-full items-center justify-between gap-3 sm:gap-4">
          <Logo />
          <PillNav items={items} />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-xs text-muted xl:flex">
              <span aria-hidden className="pulse size-1.5 rounded-full bg-accent" />
              {status}
            </span>
            {/* Under 360px the bar is full with the logo and sign-in; the theme switch moves into the menu. */}
            <span className="hidden min-[360px]:contents">
              <ThemeToggle />
            </span>
            {/* Always on screen, phones included: signing in is one tap from any page. */}
            <Button to={cta[1]} className="px-3.5! py-2! sm:px-5! sm:py-2.5!">
              {cta[0]}
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
      <MobileMenu open={open} onClose={() => setOpen(false)} items={items} />
    </>
  );
}
