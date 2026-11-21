// How you sign in to Pirento, and signing out of every device at once (a lost phone, a shared computer).
import {useState} from 'react';
import {LogOut} from 'lucide-react';
import {maskPhone} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';

export function SecurityCard({n, me}) {
  const {signOut} = useSession();
  const [error, setError] = useState('');
  const ways = [
    ['Email code', me.email],
    ['Mobile code', me.phone ? maskPhone(me.phone) : 'Not added'],
    ['User ID and password', me.username ? `${me.username}${me.hasPassword ? '' : ' · no password yet'}` : 'Not set'],
    ['Google', me.googleId ? 'Linked' : 'Not linked'],
  ];
  const everywhere = async () => {
    if (!confirm('Sign out of every device, this one included?')) return;
    try {
      await api('/auth/logout/everywhere', {method: 'POST'});
      signOut();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={n}>Security</Label>
      <dl className="mt-6 divide-y divide-rule border-y border-rule">
        {ways.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="break-all text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      <Button onClick={everywhere} variant="outline" icon={LogOut} className="mt-6">
        Sign out of every device
      </Button>
      {/* Honest about the limit: an open tab keeps its short-lived key until it runs out. */}
      <p className="mt-3 text-xs text-muted">Other devices are signed out within 15 minutes.</p>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
