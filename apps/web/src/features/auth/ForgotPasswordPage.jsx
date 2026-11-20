// Forgot password: your user ID or email → a code to your email → a new password, and you are signed in.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {passwordProblem} from '@pirento/shared';
import {AuthButton} from './AuthButtons';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {AuthShell} from './AuthShell';
import {CodeBoxes} from './CodeBoxes';
import {PasswordField} from './PasswordField';
import {useAuthDoor} from './useAuthDoor';

export function ForgotPassword() {
  const door = useAuthDoor({page: 'Reset your password'});
  const [step, setStep] = useState('ask'); // ask → reset
  const [login, setLogin] = useState('');
  const [sent, setSent] = useState(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (work) => {
    setError('');
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const ask = () =>
    run(async () => {
      setSent(
        await api('/auth/password/forgot', {method: 'POST', body: {login: login.trim(), product: door.product?.slug}}),
      );
      setStep('reset');
    });
  const reset = () =>
    run(async () => {
      if (password !== confirm) throw new Error('The two passwords do not match');
      door.signIn(await api('/auth/password/reset', {method: 'POST', body: {login: login.trim(), code, password}}));
      door.navigate(door.next);
    });
  const pwProblem = password && passwordProblem(password);

  return (
    <AuthShell side={door.side} home={door.home} homeLabel={door.homeLabel} innerRef={door.ref}>
      <h1 className="text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">
        {step === 'ask' ? 'Forgot your password?' : 'Set a new password'}
      </h1>
      <p className="mt-3 text-muted">
        {step === 'ask' ? (
          'Enter your user ID or email. We email you a code to set a new one.'
        ) : (
          <>
            We sent a code to <span className="text-ink">{sent?.sentTo}</span>. Every device signed in with the old
            password is signed out.
          </>
        )}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          (step === 'ask' ? ask : reset)();
        }}
        noValidate
        className="mt-8 space-y-5"
      >
        {step === 'ask' ? (
          <Field
            label="User ID or email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        ) : (
          <>
            <CodeBoxes value={code} onChange={setCode} disabled={busy} />
            {sent?.devCode && (
              <p className="text-sm text-muted">
                Test mode code: <span className="text-ink tabular-nums">{sent.devCode}</span>
              </p>
            )}
            <PasswordField
              label="New password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={pwProblem || undefined}
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={confirm && confirm !== password ? 'The two passwords do not match' : undefined}
            />
          </>
        )}
        {error && (
          <p role="alert" className="text-sm">
            ⚠ {error}
          </p>
        )}
        <AuthButton
          arrow
          type="submit"

          disabled={
            busy || (step === 'ask' ? !login.trim() : code.length < 6 || !password || pwProblem || password !== confirm)
          }
        >
          {busy ? 'Please wait' : step === 'ask' ? 'Send code' : 'Save and sign in'}
        </AuthButton>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{' '}
        <Link to={`/login${door.query}`} className="font-medium text-ink underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
