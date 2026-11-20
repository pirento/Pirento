// Site footer, in the current site's colours: motto and socials, link columns, the site's logo with the back-to-top
// button, and the company line. Product sites link their own legal pages; Pirento links its own.
import {Link} from 'react-router-dom';
import {ArrowUp} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';
import {brand, footer, nav, socials} from '../../data/site';
import {lenis} from '../../lib/motion';
import {useSession} from '../../lib/api/session';
import {siteName, useProductSite} from '../../lib/site';
import {PirentoLogo, SiteLogo, hasLogo} from './PirentoLogo';
import {SOCIAL_ICONS} from './SocialIcons';
import {homeFor, isStaffRole} from '../../features/admin/adminNav';

const Column = ({title, children}) => (
  <div className="min-w-0">
    <h2 className="text-xs tracking-[0.14em] text-muted uppercase">{title}</h2>
    <ul className="mt-5 space-y-3 text-sm">{children}</ul>
  </div>
);

const FooterLink = ({to, children}) => (
  <li>
    <Link to={to} className="text-muted transition-colors hover:text-ink">
      {children}
    </Link>
  </li>
);

export function Footer() {
  const product = useProductSite();
  const {user, signOut} = useSession();
  const name = siteName(product);
  // Product sites: their own links, help, the way back to Pirento, and their own legal pages.
  const columns = product
    ? [
        {
          title: product.short,
          links: [
            {label: `${product.short} home`, to: `/${product.slug}`},
            {label: 'Dashboard', to: `/${product.slug}/dashboard`},
          ],
          account: true,
        },
        {
          title: 'Help',
          links: [
            {label: 'Support', to: '/support'},
            {label: 'Verify a record', to: '/verify'},
          ],
        },
        {
          title: 'Pirento',
          links: [
            {label: 'Pirento Ecosystem', to: '/'},
            {label: 'All products', to: '/products'},
            {label: 'About us', to: '/about'},
          ],
        },
        {title: 'Policies', links: footer.legal.map((l) => ({...l, to: `/${product.slug}${l.to}`}))},
      ]
    : [
        {title: 'Pirento', links: nav.filter((l) => l.to !== '/about'), account: true},
        {title: 'Products', links: PRODUCTS.map((p) => ({label: p.name, to: `/${p.slug}`}))},
        {title: 'Company', links: footer.company},
        {title: 'Policies', links: footer.legal},
      ];
  const toTop = () => (lenis ? lenis.scrollTo(0) : scrollTo({top: 0, behavior: 'smooth'}));
  return (
    <footer className="inverse border-t border-rule pt-20 pb-8">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="display max-w-sm text-3xl">{product?.quote ?? brand.motto}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.icon];
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-11 items-center justify-center rounded-full border border-rule transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                  >
                    <Icon aria-hidden className="size-[18px]" />
                    <span className="sr-only">{s.name} (opens in a new tab)</span>
                  </a>
                );
              })}
            </div>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-8">
            {columns.map((c) => (
              <Column key={c.title} title={c.title}>
                {c.links.map((l) => (
                  <FooterLink key={l.to} to={l.to}>
                    {l.label}
                  </FooterLink>
                ))}
                {c.account &&
                  (user ? (
                    <>
                      <FooterLink to={homeFor(user)}>
                        {isStaffRole(user.role) ? 'Pirento Admin' : 'Pirento dashboard'}
                      </FooterLink>
                      <li>
                        <button onClick={signOut} className="text-left text-muted transition-colors hover:text-ink">
                          Sign out
                        </button>
                      </li>
                    </>
                  ) : (
                    <FooterLink to="/login">Sign in</FooterLink>
                  ))}
              </Column>
            ))}
          </nav>
        </div>
        {/* The site's logo on the left edge, the same height on every site, with back to top beside it.
            A product without a logo shows its name as a wordmark (the viewBox grows with the name). */}
        <div className="mt-20 flex items-end justify-between gap-6">
          <div className="min-w-0 flex-1">
            {product && hasLogo(product.slug) ? (
              <SiteLogo
                brand={product.slug}
                tone="light"
                alt={product.name}
                className="h-20 w-auto max-w-full object-contain object-left sm:h-28 lg:h-36"
              />
            ) : product ? (
              <svg viewBox={`0 0 ${name.length * 140} 210`} className="w-full" role="img" aria-label={name}>
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
              <PirentoLogo
                tone="light"
                alt="Pirento"
                className="h-20 w-auto max-w-full object-contain object-left sm:h-28 lg:h-36"
              />
            )}
          </div>
          <button
            onClick={toTop}
            aria-label="Back to top"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-transform duration-500 ease-ui hover:-translate-y-1"
          >
            <ArrowUp aria-hidden className="size-5" />
          </button>
        </div>
        <div className="mt-10 grid gap-3 border-t border-rule pt-6 text-xs text-muted md:grid-cols-2">
          <p>
            © {new Date().getFullYear()} {brand.legalName}. {footer.note}
          </p>
          <p className="flex flex-wrap gap-x-6 gap-y-1 md:justify-end">
            <span>CIN {brand.cin}</span>
            <span>GSTIN {brand.gstin}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
