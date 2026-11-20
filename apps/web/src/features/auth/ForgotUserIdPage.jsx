// Forgot user ID: your email or mobile → your user ID by email (never shown on screen).
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {MailCheck} from 'lucide-react';
import {AuthButton} from './AuthButtons';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {AuthShell} from './AuthShell';
import {useAuthDoor} from './useAuthDoor';

export function ForgotUserId() {
  const door = useAuthDoor({page: 'Find your user ID'});
  const [contact, setContact] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/auth/username/forgot', {
        method: 'POST',
        body: {contact: contact.trim(), product: door.product?.slug},
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell side={door.side} home={door.home} homeLabel={door.homeLabel} innerRef={door.ref}>
      <h1 className="text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">
        {done ? 'Check your email' : 'Forgot your user ID?'}
      </h1>
      {done ? (
        <div className="mt-6 flex items-start gap-4 rounded-[18px] border border-rule p-5" role="status">
          <MailCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
          <p className="text-muted">
            If an account uses <span className="text-ink">{contact}</span>, we have emailed its user ID to the email on
            that account. It can take a minute to arrive.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-muted">Enter the email or mobile on your account. We email you your user ID.</p>
          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            <Field
              label="Email or mobile number"
              autoComplete="email"
              autoCapitalize="none"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              error={error}
            />
            <AuthButton
              arrow
              type="submit"

              disabled={busy || contact.trim().length < 3}
            >
              {busy ? 'Please wait' : 'Email my user ID'}
            </AuthButton>
          </form>
        </>
      )}
      <p className="mt-8 text-center text-sm text-muted">
        <Link to={`/login${door.query}`} className="font-medium text-ink underline underline-offset-4">
          Back to sign in
        </Link>
        {' · '}
        <Link to={`/forgot-password${door.query}`} className="underline underline-offset-4 hover:text-ink">
          Forgot password?
        </Link>
      </p>
    </AuthShell>
  );
}
