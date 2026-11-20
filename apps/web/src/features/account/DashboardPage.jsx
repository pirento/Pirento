// The Pirento Ecosystem dashboard: one place for every product, the wallet,
// recent orders and your profile.
import {DeleteAccount} from './DeleteAccount';
import {useRef, useState} from 'react';
import {LogOut, ShieldCheck} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label, Section} from '../../components/ui/Heading';
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
    <div className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={n}>Profile</Label>
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
      <Button onClick={signOut} variant="outline" icon={LogOut} className="mt-8">
        Sign out
      </Button>
      <DeleteAccount />
    </div>
  );
}

export function Dashboard() {
  const {redirect, user} = useSignedIn();
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Dashboard — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;

  return (
    <div ref={ref}>
      <PageHero label="Pirento Ecosystem · Dashboard" title={`Hello, ${user.name || user.email.split('@')[0]}.`}>
        {isStaffRole(user.role) && (
          <Button to="/admin" icon={ShieldCheck} className="mt-6">
            Admin
          </Button>
        )}
      </PageHero>

      <Section className="pt-0! md:pt-0!">
        <Label n={1}>Your products</Label>
        <div className="mt-6">
          <ProductTiles />
        </div>
      </Section>

      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <WalletPanel n={2} />
            <ProfileCard n={3} />
          </div>
          <div className="rounded-[22px] border border-rule p-8 lg:col-span-7" data-reveal>
            <Label n={4}>Recent orders</Label>
            <OrdersList />
          </div>
        </div>
      </Section>
    </div>
  );
}
