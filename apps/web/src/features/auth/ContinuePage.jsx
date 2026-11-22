// /continue?token=…&next=…: the one-time link from an email or a text. It signs the person in and takes them on,
// e.g. to the Bharat ID application a staffer started for them.
import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {api} from '../../lib/api/client';
import {AuthShell} from './AuthShell';
import {useAuthDoor} from './useAuthDoor';

// Only a path on this site: the link must never send anyone elsewhere.
const safeNext = (raw) => (/^\/(?!\/)/.test(raw ?? '') ? raw : '/dashboard');

export function Continue() {
  const door = useAuthDoor({page: 'Continue'});
  const params = new URLSearchParams(useLocation().search);
  const token = params.get('token') ?? '';
  const next = safeNext(params.get('next'));
  const [error, setError] = useState('');
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return; // the link works once: never post it twice
    tried.current = true;
    api('/auth/otp/link', {method: 'POST', body: {token}}).then(
      (res) => {
        door.signIn(res);
        door.navigate(next, {replace: true});
      },
      (err) => setError(err.message),
    );
  }, [door, token, next]);

  return (
    <AuthShell side={door.side} home={door.home} homeLabel={door.homeLabel} innerRef={door.ref}>
      <p className="eyebrow">Continue</p>
      <h1 className="mt-3 text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">
        {error ? 'This link does not work' : 'Signing you in'}
      </h1>
      <p className="mt-3 text-muted">
        {error ? `${error} You can also sign in with a code sent to your email.` : 'One moment.'}
      </p>
      {error && (
        <Link
          to={`/login?next=${encodeURIComponent(next)}`}
          className="mt-8 inline-block text-sm underline underline-offset-4"
        >
          Sign in
        </Link>
      )}
    </AuthShell>
  );
}
