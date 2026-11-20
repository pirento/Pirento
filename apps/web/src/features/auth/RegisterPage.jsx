// Create an account: your details → codes to your email and mobile → a user ID, a password and the terms.
import {useEffect, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';
import {isUsername, passwordProblem} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {AuthShell} from './AuthShell';
import {CodeBoxes} from './CodeBoxes';
import {PasswordField} from './PasswordField';
import {useAuthDoor} from './useAuthDoor';

const STEPS = ['Your details', 'Verify', 'User ID and password'];

/** "Free" / "Taken" for a user ID, asked of the server a moment after typing stops. */
function useUsernameCheck(name, skip) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (skip || !isUsername(name)) {
      setState(null);
      return;
    }
    const t = setTimeout(() => {
      api(`/auth/register/username/${encodeURIComponent(name)}`).then(
        (r) => setState(r.free ? 'free' : 'taken'),
        () => setState(null),
      );
    }, 350);
    return () => clearTimeout(t);
  }, [name, skip]);
  return state;
}

export function Register() {
  const door = useAuthDoor({page: 'Create an account'});
  const [step, setStep] = useState(0);
  const [f, setF] = useState({name: '', email: '', phone: ''});
  const [codes, setCodes] = useState({email: '', phone: ''});
  const [sent, setSent] = useState(null);
  const [ticket, setTicket] = useState('');
  const [username, setUsername] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const idState = useUsernameCheck(username.trim().toLowerCase(), useEmail);

  if (door.user && step < 2) return <Navigate to={door.next} replace />;

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
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));

  const start = () =>
    run(async () => {
      setSent(await api('/auth/register/start', {method: 'POST', body: {...f, product: door.product?.slug}}));
      setCodes({email: '', phone: ''});
      setStep(1);
    });
  const verify = () =>
    run(async () => {
      const res = await api('/auth/register/verify', {
        method: 'POST',
        body: {...f, emailCode: codes.email, phoneCode: codes.phone},
      });
      setTicket(res.ticket);
      setStep(2);
    });
  const create = () =>
    run(async () => {
      if (password !== confirm) throw new Error('The two passwords do not match');
      const res = await api('/auth/register', {
        method: 'POST',
        body: {
          ticket,
          useEmail,
          username: useEmail ? undefined : username.trim().toLowerCase(),
          password,
          acceptTerms: terms,
        },
      });
      door.signIn(res);
      door.navigate(door.next);
    });

  const submit = (e) => {
    e.preventDefault();
    [start, verify, create][step]();
  };
  const pwProblem = password && passwordProblem(password);
  const ready = [
    f.name.trim().length > 1 && f.email.includes('@') && f.phone.replace(/\D/g, '').length >= 10,
    codes.email.length === 6 && codes.phone.length === 6,
    terms && password && !pwProblem && password === confirm && (useEmail || idState === 'free'),
  ][step];

  return (
    <AuthShell side={door.side} home={door.home} homeLabel={door.homeLabel} innerRef={door.ref}>
      <ol className="mb-8 flex gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === step ? 'step' : undefined}>
            <span className={`block h-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-rule'}`} />
            <span className={`mt-2 block text-xs ${i === step ? 'text-ink' : 'text-muted'}`}>{s}</span>
          </li>
        ))}
      </ol>
      <h1 className="text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">
        {['Create your account', 'Verify your email and mobile', 'Choose how you sign in'][step]}
      </h1>
      <p className="mt-3 text-muted">
        {
          [
            'One account for every Pirento product. It takes about a minute.',
            'We sent one code to each. Both work for 10 minutes.',
            'Pick a user ID (or use your email) and a password.',
          ][step]
        }
      </p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        {step === 0 && (
          <>
            <Field
              label="Full name"
              required
              autoComplete="name"
              maxLength={80}
              value={f.name}
              onChange={set('name')}
            />
            <Field label="Email" type="email" required autoComplete="email" value={f.email} onChange={set('email')} />
            <Field
              label="Mobile number"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="98765 43210"
              maxLength={16}
              value={f.phone}
              onChange={set('phone')}
            />
          </>
        )}

        {step === 1 && (
          <>
            <CodeBoxes
              label="Email code"
              hint={`sent to ${sent?.sentTo.email}`}
              value={codes.email}
              onChange={(v) => setCodes((c) => ({...c, email: v}))}
              disabled={busy}
            />
            <CodeBoxes
              label="Mobile code"
              hint={`sent to ${sent?.sentTo.phone}`}
              value={codes.phone}
              onChange={(v) => setCodes((c) => ({...c, phone: v}))}
              disabled={busy}
            />
            {sent?.devCodes && (
              <p className="text-sm text-muted">
                Test mode codes: email <span className="text-ink tabular-nums">{sent.devCodes.email}</span>, mobile{' '}
                <span className="text-ink tabular-nums">{sent.devCodes.phone}</span>
              </p>
            )}
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <button type="button" onClick={start} disabled={busy} className="underline underline-offset-4">
                Send new codes
              </button>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-muted underline underline-offset-4 hover:text-ink"
              >
                Change details
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <Field
                label="User ID"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="asha.verma"
                maxLength={30}
                disabled={useEmail}
                value={useEmail ? f.email : username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="mt-2 text-xs text-muted" aria-live="polite">
                {useEmail
                  ? 'You will sign in with your email.'
                  : idState === 'free'
                    ? '✓ This user ID is free.'
                    : idState === 'taken'
                      ? 'This user ID is taken. Try another.'
                      : '3–30 letters, digits, dots, dashes or underscores, starting with a letter.'}
              </p>
              <label className="mt-3 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={useEmail}
                  onChange={(e) => setUseEmail(e.target.checked)}
                  className="size-4"
                />
                Use my email as my user ID
              </label>
            </div>
            <PasswordField
              label="Password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={pwProblem || undefined}
            />
            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={confirm && confirm !== password ? 'The two passwords do not match' : undefined}
            />
            <label className="flex items-start gap-3 rounded-[14px] border border-rule p-4 text-sm">
              <input
                type="checkbox"
                required
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                I have read and accept the{' '}
                <Link to="/terms" target="_blank" rel="noopener" className="font-medium underline underline-offset-4">
                  Terms and Conditions
                </Link>
                .
              </span>
            </label>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm">
            ⚠ {error}
          </p>
        )}
        <Button type="submit" variant="accent" className="w-full justify-center" disabled={busy || !ready}>
          {busy ? 'Please wait' : ['Send codes', 'Verify', 'Create account'][step]}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to={`/login${door.query}`} className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
