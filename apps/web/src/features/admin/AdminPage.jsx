// Admin dashboard shell: role-aware sidebar and the selected section.
import {useSearchParams} from 'react-router-dom';
import {BadgeCheck, Inbox, LayoutDashboard, ShoppingBag, Users} from 'lucide-react';
import {Overview} from './Overview';
import {People} from './People';
import {STAFF_SECTIONS} from './sections';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {usePageMeta} from '../../lib/page';

const TABS = [
  {id: 'Overview', icon: LayoutDashboard, superOnly: false},
  {id: 'Orders', icon: ShoppingBag},
  {id: 'Bharat ID', icon: BadgeCheck},
  {id: 'Tickets', icon: Inbox},
  {id: 'People', icon: Users, superOnly: true},
];

export function Admin() {
  const {redirect, user} = useSignedIn({loginPath: '/admin/login'});
  const [params, setParams] = useSearchParams();
  const isSuper = user?.role === 'superadmin';
  const isStaff = isSuper || user?.role === 'staff';
  usePageMeta({title: 'Admin — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (user && !isStaff) return <NotFound />;
  if (!user) return <div className="min-h-dvh" />;

  const tabs = TABS.filter((t) => !t.superOnly || isSuper);
  // An unknown or not-allowed tab falls back to the first one, so links can deep-link safely.
  const tab = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0];
  const Queue = STAFF_SECTIONS[tab.id];
  const body =
    tab.id === 'Overview' ? <Overview isSuper={isSuper} /> : tab.id === 'People' ? <People me={user._id} /> : <Queue />;

  return (
    <div className="pt-28 pb-28 md:pt-32">
      <div className="container-x grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{isSuper ? 'Superadmin' : 'Staff'}</p>
          <h1 className="mt-3 text-4xl">Admin</h1>
          <nav
            aria-label="Admin sections"
            className="no-scrollbar mt-8 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setParams({tab: t.id})}
                aria-current={t.id === tab.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-colors ${
                  t.id === tab.id ? 'bg-ink text-paper' : 'text-muted hover:bg-stone hover:text-ink'
                }`}
              >
                <t.icon aria-hidden className="size-4" />
                {t.id}
              </button>
            ))}
          </nav>
        </aside>
        <section aria-labelledby="admin-tab" className="min-w-0">
          <h2 id="admin-tab" className="display text-3xl">
            {tab.id}
          </h2>
          <div className="mt-8">
            <div key={tab.id}>{body}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
