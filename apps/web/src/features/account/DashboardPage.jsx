// The Pirento Ecosystem dashboard: quick actions, your numbers, what to do next,
// every product, recent orders, the wallet and your account.
import {DeleteAccount} from './DeleteAccount';
import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {LogOut, ShieldCheck} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {PageHero} from '../../components/PageHero';
import {isStaffRole} from '../admin/adminNav';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useSignedIn} from '../auth/useSignedIn';
import {OrdersList} from '../orders/OrdersList';
import {ProductTiles} from './ProductTiles';
import {WalletPanel} from './WalletPanel';
import {NextSteps} from './NextSteps';
import {Overview} from './Overview';
import {useOverview} from './useOverview';
import {dashboard} from '../../data/site';

function ProfileCard({n}) {
  const {user, setUser, signOut} = useSession();
  const [name, setName] = useState(user.name ?? '');
  const [note, setNote] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try {
      setUser(await api('/auth/me', {method: 'PATCH', body: {name}}));
      setNote('Saved.');
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <div className="grid gap-8 rounded-[22px] border border-rule p-8 md:grid-cols-2" data-reveal>
      <div>
        <Label n={n}>Account</Label>
        <p className="mt-6 text-sm text-muted">Signed in as</p>
        <p className="break-all">{user.email}</p>
        <form onSubmit={save} className="mt-6 flex items-end gap-3">
          <div className="flex-1">
            <Field label="Name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" className="mb-px" icon={null}>
            Save
          </Button>
        </form>
        {note && (
          <p role="status" className="mt-3 text-sm">
            {note}
          </p>
        )}
      </div>
      <div className="md:border-l md:border-rule md:pl-8">
        <Button onClick={signOut} variant="outline" icon={LogOut} className="mt-8">
          Sign out
        </Button>
        <DeleteAccount />
      </div>
    </div>
  );
}

export function Dashboard() {
  const {redirect, user} = useSignedIn();
  const data = useOverview();
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Dashboard — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;

  return (
    <div ref={ref} className="space-y-12">
      <PageHero label="Pirento Ecosystem · Dashboard" title={`Hello, ${user.name || user.email.split('@')[0]}.`}>
        <div className="mt-6 flex flex-wrap gap-2">
          {dashboard.actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="rounded-full border border-rule px-4 py-2 text-sm transition-colors hover:border-ink"
            >
              {a.label}
            </Link>
          ))}
          {isStaffRole(user.role) && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper"
            >
              <ShieldCheck aria-hidden className="size-4" /> Admin
            </Link>
          )}
        </div>
      </PageHero>

      <Overview data={data} />
      <NextSteps user={user} data={data} />

      <section aria-labelledby="products-h">
        <h2 id="products-h" className="sr-only">
          Your products
        </h2>
        <Label n={1}>Your products</Label>
        <div className="mt-6">
          <ProductTiles />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section id="orders" className="scroll-mt-24 rounded-[22px] border border-rule p-8 lg:col-span-7" data-reveal>
          <Label n={2}>Recent orders</Label>
          <OrdersList />
        </section>
        <div id="wallet" className="scroll-mt-24 lg:col-span-5">
          <WalletPanel n={3} />
        </div>
      </div>

      <section id="account" className="scroll-mt-24">
        <ProfileCard n={4} />
      </section>
    </div>
  );
}
