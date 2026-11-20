// Customer sign-in: a code by mobile, email or Bharat ID (in that order), or user ID + password below;
// then your name, the first time. Links to create an account and to recover a password or user ID.
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Fingerprint, KeyRound, Mail, Smartphone} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {CodeBoxes} from './CodeBoxes';
import {GoogleButton} from './GoogleButton';
import {PasswordField} from './PasswordField';

const METHODS = {
  mobile: {
    icon: Smartphone,
    tab: 'Mobile',
    label: 'Mobile number',
    placeholder: '98765 43210',
    hint: 'We text a 6-digit code to the mobile on your account.',
    clean: (v) => v.replace(/[^\d +-]/g, ''),
    request: (value, product) => ['/auth/otp/phone/request', {phone: value, product}],
    verify: (value, code) => ['/auth/otp/phone/verify', {phone: value, code}],
  },
  email: {
    icon: Mail,
    tab: 'Email',
    label: 'Email',
    placeholder: 'you@example.com',
    hint: 'We email a 6-digit code. No password needed.',
    clean: (v) => v,
    request: (value, product) => ['/auth/otp/request', {email: value, product}],
    verify: (value, code) => ['/auth/otp/verify', {email: value, code}],
  },
  'bharat-id': {
    icon: Fingerprint,
    tab: 'Bharat ID',
    label: '10-digit Bharat ID',
    placeholder: '0000 0000 00',
    hint: 'The code goes to the email on your issued ID.',
    clean: (v) => v.replace(/[^\d ]/g, ''),
    request: (value, product) => ['/auth/otp/bharat-id/request', {bharatId: value, product}],
    verify: (value, code) => ['/auth/otp/bharat-id/verify', {bharatId: value, code}],
  },
};

/** Seconds left until a new code may be requested. */
function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}

/** An error, with a way forward when the account does not exist yet. */
const Problem = ({error, query}) =>
  error && (
    <p role="alert" className="mt-3 text-sm">
      ⚠ {error.message}{' '}
      {error.code === 'NO_ACCOUNT' && (
        <Link to={`/register${query}`} className="font-medium underline underline-offset-4">
          Create an account
        </Link>
      )}
    </p>
  );

export function CustomerSignIn({title, product, query, onSignedIn, onNamed, onSkip}) {
  const providers = useApi('/auth/providers');
  const mobileOn = providers.data?.mobile !== false;
  const [mode, setMode] = useState('code'); // code | password
  const [step, setStep] = useState('enter'); // enter → code → name
  const [method, setMethod] = useState('mobile');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useCountdown();
  // Without SMS in this install, start on email rather than on a tab that cannot work.
  const active = method === 'mobile' && !mobileOn ? 'email' : method;
  const m = METHODS[active];

  const run = async (work) => {
    setError(null);
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  const finish = (res) => {
    if (res.user.name) return onSignedIn(res);
    onSignedIn(res, {stay: true});
    setStep('name');
  };

  const requestCode = () =>
    run(async () => {
      const [path, body] = m.request(value.trim(), product?.slug);
      const res = await api(path, {method: 'POST', body});
      setSent(res);
      setResendIn(res.resendAfter ?? 30);
      setCode('');
      setStep('code');
    });
  const verifyCode = (c = code) =>
    run(async () => {
      const [path, body] = m.verify(value.trim(), c);
      finish(await api(path, {method: 'POST', body}));
    });
  const passwordSignIn = () =>
    run(async () => finish(await api('/auth/password/login', {method: 'POST', body: {login: login.trim(), password}})));
  const google = (idToken) => run(async () => finish(await api('/auth/google', {method: 'POST', body: {idToken}})));

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'password') passwordSignIn();
    else if (step === 'enter') requestCode();
    else if (step === 'code') verifyCode();
    else run(() => onNamed(name));
  };
  const switchMode = (next) => {
    setMode(next);
    setStep('enter');
    setError(null);
  };

  const heading =
    mode === 'password'
      ? 'Sign in with your user ID'
      : {enter: title, code: active === 'mobile' ? 'Check your phone' : 'Check your email', name: 'One last thing'}[
          step
        ];
  const sub =
    mode === 'password'
      ? 'Your user ID, or the email you signed up with, and your password.'
      : {
          enter: 'Choose how to get your sign-in code.',
          code: (
            <>
              We sent a 6-digit code to <span className="text-ink">{sent?.sentTo ?? value}</span>. It works for 10
              minutes.
            </>
          ),
          name: 'Welcome to Pirento. What should we call you?',
        }[step];

  return (
    <div>
      <h1 className="text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">{heading}</h1>
      <p className="mt-3 text-muted">{sub}</p>

      {mode === 'code' && step === 'enter' && providers.data?.google && (
        <div className="mt-8">
          <GoogleButton clientId={providers.data.google} onCredential={google} />
          <p className="mt-6 flex items-center gap-4 text-xs text-muted">
            <span className="h-px flex-1 bg-rule" /> or use a code <span className="h-px flex-1 bg-rule" />
          </p>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8">
        {mode === 'password' && (
          <div className="space-y-5">
            <Field
              label="User ID or email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
            <PasswordField
              label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <Link to={`/forgot-user-id${query}`} className="text-muted underline underline-offset-4 hover:text-ink">
                Forgot user ID?
              </Link>
              <Link to={`/forgot-password${query}`} className="text-muted underline underline-offset-4 hover:text-ink">
                Forgot password?
              </Link>
            </div>
            <Problem error={error} query={query} />
          </div>
        )}

        {mode === 'code' && step === 'enter' && (
          <>
            <div role="tablist" aria-label="Get a code by" className="grid grid-cols-3 gap-1 rounded-full bg-stone p-1">
              {Object.entries(METHODS).map(([id, x]) => {
                const off = id === 'mobile' && !mobileOn;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active === id}
                    aria-disabled={off || undefined}
                    title={off ? 'Mobile codes are not set up yet' : undefined}
                    onClick={() => {
                      if (off) return;
                      setMethod(id);
                      setValue('');
                      setError(null);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-full px-2 py-2 text-sm transition-colors ${
                      active === id
                        ? 'bg-paper text-ink ring-1 ring-rule'
                        : off
                          ? 'cursor-not-allowed text-muted opacity-60'
                          : 'text-muted hover:text-ink'
                    }`}
                  >
                    <x.icon aria-hidden className="size-4 shrink-0" />
                    <span className="truncate">{x.tab}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              {m.hint}
              {!mobileOn && ' Mobile codes are Expected.'}
            </p>
            <div className="mt-6">
              <Field
                key={active}
                label={m.label}
                type={active === 'email' ? 'email' : 'text'}
                inputMode={active === 'email' ? 'email' : 'numeric'}
                autoComplete={active === 'email' ? 'email' : active === 'mobile' ? 'tel' : 'off'}
                placeholder={m.placeholder}
                maxLength={active === 'email' ? 200 : 16}
                required
                value={value}
                onChange={(e) => setValue(m.clean(e.target.value))}
              />
              <Problem error={error} query={query} />
            </div>
          </>
        )}

        {mode === 'code' && step === 'code' && (
          <>
            <CodeBoxes value={code} onChange={setCode} onComplete={verifyCode} error={error?.message} disabled={busy} />
            {sent?.devCode && (
              <p className="mt-3 text-sm text-muted">
                Test mode code: <span className="text-ink tabular-nums">{sent.devCode}</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={requestCode}
                disabled={resendIn > 0 || busy}
                className="underline underline-offset-4 disabled:text-muted disabled:no-underline"
              >
                {resendIn > 0 ? `New code in ${resendIn}s` : 'Send a new code'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('code')}
                className="text-muted underline underline-offset-4 hover:text-ink"
              >
                Change {m.tab === 'Bharat ID' ? 'ID' : m.tab.toLowerCase()}
              </button>
            </div>
          </>
        )}

        {mode === 'code' && step === 'name' && (
          <Field
            label="Your name"
            required
            autoFocus
            autoComplete="name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error?.message}
          />
        )}

        <Button
          type="submit"
          variant="accent"
          className="mt-8 w-full justify-center"
          disabled={busy || (mode === 'code' && step === 'code' && code.length < 6)}
        >
          {busy
            ? 'Please wait'
            : mode === 'password'
              ? 'Sign in'
              : {enter: 'Send code', code: 'Sign in', name: 'Continue'}[step]}
        </Button>
        {mode === 'code' && step === 'name' && (
          <button type="button" onClick={onSkip} className="mt-4 w-full text-sm text-muted underline">
            Skip for now
          </button>
        )}
      </form>

      {step === 'enter' && (
        <>
          <p className="my-8 flex items-center gap-4 text-xs text-muted">
            <span className="h-px flex-1 bg-rule" /> or <span className="h-px flex-1 bg-rule" />
          </p>
          <button
            type="button"
            onClick={() => switchMode(mode === 'code' ? 'password' : 'code')}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-rule px-6 py-3.5 text-[0.95rem] font-medium transition-colors hover:border-ink"
          >
            {mode === 'code' ? (
              <>
                <KeyRound aria-hidden className="size-4" /> Sign in with user ID and password
              </>
            ) : (
              <>
                <Smartphone aria-hidden className="size-4" /> Sign in with a code instead
              </>
            )}
          </button>
          <p className="mt-8 text-center text-sm text-muted">
            New to Pirento?{' '}
            <Link to={`/register${query}`} className="font-medium text-ink underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
