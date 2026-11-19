import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUp, Copy, Check, Instagram, Linkedin, Twitter, Mail} from 'lucide-react';
import {brand, home, nav, socials} from '../data/site';
import {lenis} from '../lib/motion';
import {siteName, useProductSite} from '../lib/site';
import {Button, Heading, Label} from './ui';

const icons = {twitter: Twitter, linkedin: Linkedin, instagram: Instagram};

export function ContactCta({n}) {
  const product = useProductSite();
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard.writeText(brand.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  return (
    <section id="contact" className="inverse py-28 md:py-40">
      <div className="container-x">
        <Label n={n}>{home.contact.label}</Label>
        <Heading
          text={product ? `Questions about / ${product.short}? Ask us.` : home.contact.title}
          className="h-cta mt-8"
          data-lines
        />
        <div className="mt-12 flex flex-wrap gap-3" data-reveal>
          <Button to={product ? `/${product.slug}/dashboard` : '/legal/services'} variant="inverse">
            {product ? `Open ${product.short} dashboard` : 'Browse legal services'}
          </Button>
          <Button href={`mailto:${brand.email}?subject=Enquiry from pirento.com`} variant="outline" icon={Mail}>
            Email us
          </Button>
        </div>
        <div className="mt-20 flex flex-wrap items-end gap-4 border-t border-rule pt-10" data-reveal>
          <a
            href={`mailto:${brand.email}`}
            className="display text-[clamp(1.75rem,5vw,4rem)] underline decoration-1 underline-offset-[0.2em] hover:decoration-accent"
          >
            {brand.email}
          </a>
          <button
            onClick={copy}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1 text-xs text-muted hover:border-ink hover:text-ink"
          >
            {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p className="body mt-6">
          Support:{' '}
          <a className="text-ink underline underline-offset-4" href={`mailto:${brand.supportEmail}`}>
            {brand.supportEmail}
          </a>
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  const product = useProductSite();
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
            <Link to="/login" className="hover:text-ink">
              Sign in
            </Link>
            <Link to="/account" className="hover:text-ink">
              Account
            </Link>
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
        {/* The site's own name as the wordmark; the viewBox grows with the name so letters keep their shape. */}
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
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-1 border-t border-rule pt-6 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} {brand.legalName}
          </span>
          <span>CIN {brand.cin}</span>
        </p>
      </div>
    </footer>
  );
}
