// Your account: name, how you sign in (email, mobile, user ID, password), sign out, and asking for deletion.
import {useRef, useState} from 'react';
import {LogOut} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useSignedIn} from '../auth/useSignedIn';
import {DeleteAccount} from './DeleteAccount';
import {PasswordCard} from './PasswordCard';
import {SecurityCard} from './SecurityCard';

/** Pick a user ID once (accounts made by email code have none). */
function UserIdForm({me, onDone}) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try {
      await api('/auth/me/username', {method: 'PATCH', body: {username: value.trim().toLowerCase()}});
      onDone();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} className="mt-2 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 basis-48">
        <Field
          label="Choose a user ID"
          autoCapitalize="none"
          placeholder="asha.verma"
          maxLength={30}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" variant="outline" className="mb-px" icon={null}>
        Save
      </Button>
      <button
        type="button"
        onClick={() => setValue(me.email)}
        className="w-full text-left text-xs text-muted underline underline-offset-4"
      >
        Use my email as my user ID
      </button>
      {note && (
        <p role="status" className="w-full text-sm">
          {note}
        </p>
      )}
    </form>
  );
}

function ProfileCard({n, me, onDone}) {
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
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Mobile</dt>
            <dd>{me?.phone ?? 'Not added'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">User ID</dt>
            <dd className="break-all">{me?.username ?? (me ? <UserIdForm me={me} onDone={onDone} /> : '—')}</dd>
          </div>
        </dl>
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
  // Fresh from the server: it knows whether a password is set, which the session copy may not.
  const me = useApi(user ? '/auth/me' : null);
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
      <ProfileCard n={1} me={me.data} onDone={me.reload} />
      {me.data && <PasswordCard n={2} me={me.data} onDone={me.reload} />}
      {me.data && <SecurityCard n={3} me={me.data} />}
    </div>
  );
}
