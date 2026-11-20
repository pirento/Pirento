// Site footer: motto, links, socials and the site name as a full-width wordmark.
import {Link} from 'react-router-dom';
import {ArrowUp, Instagram, Linkedin, Twitter} from 'lucide-react';
import {brand, nav, socials} from '../../data/site';
import {lenis} from '../../lib/motion';
import {useSession} from '../../lib/api/session';
import {siteName, useProductSite} from '../../lib/site';
import {PirentoLogo} from './PirentoLogo';

const icons = {twitter: Twitter, linkedin: Linkedin, instagram: Instagram};

export function Footer() {
  const product = useProductSite();
  const {user, signOut} = useSession();
  const name = siteName(product);
  const links = product
    ? [
        {label: `${product.short} home`, to: `/${product.slug}`},
        {label: 'Dashboard', to: `/${product.slug}/dashboard`},
        {label: 'All products', to: '/products'},
        {label: 'Verify', to: '/verify'},
        {label: 'Support', to: '/support'},
        {label: 'Pirento Ecosystem', to: '/'},
      ]
    : nav;
  const toTop = () => (lenis ? lenis.scrollTo(0) : scrollTo({top: 0, behavior: 'smooth'}));
  return (
    <footer className="inverse border-t border-rule pt-20 pb-8">
      <div className="container-x">
        <div className="grid gap-12 md:grid-cols-12">
          <p className="display text-3xl md:col-span-5">{product?.quote ?? brand.motto}</p>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-3 text-sm text-muted md:col-span-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-ink">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-ink">
                  Pirento dashboard
                </Link>
                <button onClick={signOut} className="text-left hover:text-ink">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-ink">
                Sign in
              </Link>
            )}
          </nav>
          <div className="flex items-start gap-2 md:col-span-3 md:justify-end">
            {socials.map((s) => {
              const Icon = icons[s.icon];
              return (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-11 items-center justify-center rounded-full border border-rule hover:border-ink"
                >
                  <Icon aria-hidden className="size-4" />
                  <span className="sr-only">{s.name} (opens in a new tab)</span>
                </a>
              );
            })}
            <button
              onClick={toTop}
              aria-label="Back to top"
              className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent"
            >
              <ArrowUp aria-hidden className="size-4" />
            </button>
          </div>
        </div>
        {/* Product sites: their name as the wordmark (the viewBox grows with it so letters keep their shape).
            The ecosystem: the Pirento logo itself. */}
        {product ? (
          <svg viewBox={`0 0 ${name.length * 140} 210`} className="mt-16 w-full" role="img" aria-label={name}>
            <text
              x="0"
              y="180"
              textLength={name.length * 140}
              lengthAdjust="spacingAndGlyphs"
              fill="currentColor"
              style={{font: '600 230px var(--font-display)', letterSpacing: '-0.04em'}}
            >
              {name.toUpperCase()}
            </text>
          </svg>
        ) : (
          <PirentoLogo tone="light" alt="Pirento" className="mt-16 h-auto w-full max-w-5xl" />
        )}
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-1 border-t border-rule pt-6 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} {brand.legalName}
          </span>
          <span>CIN {brand.cin}</span>
          <Link to="/terms" className="hover:text-on-inverse">
            Terms and Conditions
          </Link>
        </p>
      </div>
    </footer>
  );
}
