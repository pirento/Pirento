// Your account: name, sign-in email, sign out, and asking for deletion.
import {useRef, useState} from 'react';
import {LogOut} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useSignedIn} from '../auth/useSignedIn';
import {DeleteAccount} from './DeleteAccount';
import {PasswordCard} from './PasswordCard';

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

export function Account() {
  const {redirect, user} = useSignedIn();
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Account — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  return (
    <div ref={ref} className="space-y-10">
      <PageHero
        label="Pirento Ecosystem · Account"
        title="Your account"
        intro="One account for every Pirento product."
      />
      <ProfileCard n={1} />
      {user.staffId && <PasswordCard n={2} staffId={user.staffId} />}
    </div>
  );
}
