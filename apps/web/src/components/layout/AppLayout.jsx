// The working shell for dashboards and admin: a sidebar instead of the
// marketing navbar and footer, so the page is about the work, not the pitch.
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router-dom';
import {
  Home,
  ArrowLeftRight,
  Briefcase,
  RefreshCw,
  FileText,
  Gem,
  MessagesSquare,
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  Wallet as WalletIcon,
  X,
  Award,
  ClipboardList,
  FolderLock,
  GraduationCap,
  KeyRound,
  Megaphone,
  MessageSquare,
  Share2,
} from 'lucide-react';
import {PirentoLogo, SiteLogo, hasLogo} from './PirentoLogo';
import {CommandPalette, openCommandPalette} from './CommandPalette';
import {useSession} from '../../lib/api/session';
import {siteName, useProductSite} from '../../lib/site';
import {isStaffRole, sectionsFor} from '../../features/admin/adminNav';
import {ThemeToggle} from './ThemeToggle';
import {SINGLE_PAGE_SECTIONS, productDashboards} from '../../data/site';

const SECTION_ICONS = {
  overview: LayoutDashboard,
  orders: ShoppingBag,
  receipts: Receipt,
  services: Briefcase,
  help: LifeBuoy,
  documents: FileText,
  consultations: MessagesSquare,
  wallet: WalletIcon,
  exams: GraduationCap,
  certificates: Award,
  openings: Megaphone,
  files: FolderLock,
  passwords: KeyRound,
  chat: MessageSquare,
  referrals: Share2,
  plans: Gem,
  apply: ClipboardList,
};

const InApp = createContext(false);
/** True inside the app shell; PageHero uses it to render a compact header. */
export const useInApp = () => useContext(InApp);

/** The sidebar groups for where you are: admin, a product's dashboard, or the ecosystem dashboard. */
function useAppNav() {
  const {pathname} = useLocation();
  const {user} = useSession();
  const product = useProductSite();

  // Staff always get the admin sidebar, also on pages both sides use (a ticket, an order).
  if (pathname.startsWith('/admin') || isStaffRole(user?.role)) {
    return {
      title: 'Pirento Admin',
      // One sidebar group per section group (Work, People, Money…), keeping their order.
      groups: Object.entries(Object.groupBy(sectionsFor(user?.role), (s) => s.group)).map(([label, items]) => ({
        label,
        items: items.map((s) => ({...s, to: `/admin/${s.id}`})),
      })),
    };
  }
  // A product's dashboard is its own app: only its sections, never the other products. Wallet and Support
  // appear in every product, but there is one wallet and one support desk behind them.
  if (product) {
    const sections = productDashboards[product.slug] ?? SINGLE_PAGE_SECTIONS;
    return {
      title: product.name,
      groups: [
        {
          label: product.short,
          items: [
            ...sections.map((s, i) => ({
              label: s.label,
              to: s.support
                ? `/support?product=${product.slug}`
                : i === 0
                  ? `/${product.slug}/dashboard`
                  : `/${product.slug}/dashboard/${s.id}`,
              icon: SECTION_ICONS[s.icon],
            })),
            {label: `${product.short} website`, to: `/${product.slug}`, icon: Home},
          ],
        },
      ],
    };
  }
  // The Pirento dashboard is the account's own place: money, records, support and settings for every product.
  // It does not list the products; each one is reached from its own site and keeps its own dashboard.
  return {
    title: 'Pirento Ecosystem',
    groups: [
      {
        label: 'Account',
        items: [
          {label: 'Overview', to: '/dashboard', icon: LayoutDashboard},
          {label: 'Payments', to: '/payments', icon: ArrowLeftRight},
          {label: 'Receipts', to: '/receipts', icon: Receipt},
          {label: 'Orders', to: '/orders', icon: ShoppingBag},
          {label: 'Subscriptions', to: '/subscriptions', icon: RefreshCw},
          {label: 'Wallet', to: '/wallet', icon: WalletIcon},
          {label: 'Support', to: '/support', icon: LifeBuoy},
          {label: 'Account', to: '/account', icon: UserRound},
        ],
      },
    ],
  };
}

function Sidebar({onNavigate}) {
  const {user, signOut} = useSession();
  const staff = isStaffRole(user?.role);
  const inAdmin = useLocation().pathname.startsWith('/admin');
  const {title, groups} = useAppNav();
  const product = useProductSite();
  const {pathname} = useLocation();
  const navRef = useRef(null);
  // A long admin list scrolls; keep the current page's link in view.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({block: 'nearest'});
  }, [pathname]);

  return (
    <div className="flex h-full flex-col">
      <Link
        to={product ? `/${product.slug}` : '/'}
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-3 font-display text-[0.95rem] font-semibold tracking-[0.04em] uppercase"
      >
        {product && hasLogo(product.slug) ? (
          <SiteLogo brand={product.slug} alt={product.name} className="h-9 w-auto" />
        ) : product ? (
          <>
            <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" />
            {title}
          </>
        ) : (
          // Pirento's own shells (ecosystem, admin): the logo, then which one this is.
          <>
            <PirentoLogo alt="Pirento" className="h-6 w-auto" />
            <span className="text-xs font-medium normal-case tracking-normal text-muted">
              {title.replace('Pirento ', '')}
            </span>
          </>
        )}
      </Link>

      <button
        onClick={() => {
          onNavigate?.();
          openCommandPalette();
        }}
        className="mt-6 flex w-full items-center gap-3 rounded-full border border-rule bg-paper px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
      >
        <Search aria-hidden className="size-4" /> Search
        <kbd className="ml-auto rounded-md border border-rule px-1.5 text-[0.7rem]">Ctrl K</kbd>
      </button>

      <nav ref={navRef} aria-label="Dashboard" className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="eyebrow px-3">{g.label}</p>
            <ul className="mt-2 space-y-0.5">
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={!item.to.startsWith('/admin/')}
                    onClick={onNavigate}
                    className={({isActive}) =>
                      `flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors ${
                        isActive ? 'bg-ink text-paper' : 'text-muted hover:bg-stone hover:text-ink'
                      }`
                    }
                  >
                    {item.icon && <item.icon aria-hidden className="size-4 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-6 space-y-1 border-t border-rule pt-4 text-sm">
        {[
          // Staff only: the way back to the admin from a shared page, and to the public site.
          {label: 'Admin', to: '/admin', icon: ShieldCheck, show: staff && !inAdmin},
          {label: 'Pirento website', to: '/', icon: Home, show: staff},
        ]
          .filter((l) => l.show)
          .map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-full px-3 py-2 text-muted hover:bg-stone hover:text-ink"
            >
              <l.icon aria-hidden className="size-4" /> {l.label}
            </Link>
          ))}
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <span className="min-w-0 truncate text-xs text-muted">{user?.email}</span>
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-muted hover:bg-stone hover:text-ink"
        >
          <LogOut aria-hidden className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AppLayout({children}) {
  const [open, setOpen] = useState(false);
  const {pathname} = useLocation();
  const product = useProductSite();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <InApp.Provider value={true}>
      <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Desktop: a fixed sidebar. Phones: a top bar that opens it as a drawer. */}
        <aside className="sticky top-0 hidden h-dvh border-r border-rule bg-stone px-4 py-6 lg:block">
          <Sidebar />
        </aside>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-rule bg-paper/90 px-5 backdrop-blur lg:hidden">
          {product && hasLogo(product.slug) ? (
            <SiteLogo brand={product.slug} alt={product.name} className="h-8 w-auto" />
          ) : product ? (
            <span className="font-display text-sm font-semibold tracking-[0.04em] uppercase">{siteName(product)}</span>
          ) : (
            <PirentoLogo alt="Pirento" className="h-6 w-auto" />
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="flex size-10 items-center justify-center rounded-full border border-rule"
          >
            <Menu aria-hidden className="size-4" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button aria-label="Close menu" className="absolute inset-0 bg-inverse/60" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-stone px-4 py-6">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute top-5 right-4 flex size-9 items-center justify-center rounded-full border border-rule"
              >
                <X aria-hidden className="size-4" />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}
        <main id="main" className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {children}
        </main>
        <CommandPalette />
      </div>
    </InApp.Provider>
  );
}
