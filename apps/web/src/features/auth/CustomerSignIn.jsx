// Customer sign-in: a code by mobile, email or Bharat ID (in that order); or, below, a password or Google;
// then your name, the first time. Ends with "New to Pirento?" and the way to create an account.
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Fingerprint, KeyRound, Mail, Smartphone} from 'lucide-react';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {AuthButton, AuthLink, OrDivider, authButton} from './AuthButtons';
import {CodeBoxes} from './CodeBoxes';
import {GoogleButton} from './GoogleButton';
import {PasswordField} from './PasswordField';

const METHODS = {
  mobile: {
    icon: Smartphone,
    tab: 'Mobile',
    label: 'Mobile number',
    placeholder: '10-digit mobile number',
    hint: 'Receive your sign-in code by SMS.',
    clean: (v) => v.replace(/\D/g, '').slice(0, 10),
    request: (value, product) => ['/auth/otp/phone/request', {phone: value, product}],
    verify: (value, code) => ['/auth/otp/phone/verify', {phone: value, code}],
  },
  email: {
    icon: Mail,
    tab: 'Email',
    label: 'Email',
    placeholder: 'you@example.com',
    hint: 'Receive your sign-in code by email.',
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

/** The mobile number field, with +91 in its own box in front. */
export function MobileInput({value, onChange}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">Mobile number</span>
      <span className="joined-field mt-2 flex overflow-hidden rounded-[8px] border border-rule bg-paper focus-within:border-ink">
        <span className="flex items-center border-r border-rule bg-stone px-4 text-muted">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="10-digit mobile number"
          required
          value={value}
          onChange={onChange}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none"
        />
      </span>
    </label>
  );
}

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
      ? 'Sign in with password'
      : {enter: title, code: active === 'mobile' ? 'Check your phone' : 'Check your email', name: 'One last thing'}[
          step
        ];
  const sub =
    mode === 'password'
      ? 'Your user ID, or the email you signed up with, and your password.'
      : {
          enter: 'Sign in with your mobile number, email or Bharat ID.',
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
      <p className="eyebrow">Account sign in</p>
      <h1 className="mt-3 text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">{heading}</h1>
      <p className="mt-3 text-muted">{sub}</p>

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
            <div
              role="tablist"
              aria-label="Get a code by"
              className="grid grid-cols-3 gap-1 rounded-full border border-rule bg-stone p-1"
            >
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
                    className={`flex h-[38px] items-center justify-center gap-2 rounded-full px-2 text-sm transition-colors ${
                      active === id
                        ? 'border border-rule bg-paper font-medium text-ink'
                        : off
                          ? 'cursor-not-allowed text-muted opacity-60'
                          : 'text-muted hover:text-ink'
                    }`}
                  >
                    {/* Icons only where there is room; on a phone the three names need the space. */}
                    <x.icon aria-hidden className="hidden size-4 shrink-0 sm:block" />
                    <span className="truncate">{x.tab}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              {active === 'mobile' ? (
                <MobileInput value={value} onChange={(e) => setValue(m.clean(e.target.value))} />
              ) : (
                <Field
                  key={active}
                  label={m.label}
                  type={active === 'email' ? 'email' : 'text'}
                  inputMode={active === 'email' ? 'email' : 'numeric'}
                  autoComplete={active === 'email' ? 'email' : 'off'}
                  placeholder={m.placeholder}
                  maxLength={active === 'email' ? 200 : 16}
                  required
                  value={value}
                  onChange={(e) => setValue(m.clean(e.target.value))}
                />
              )}
              <p className="mt-2 text-xs text-muted">
                {m.hint}
                {!mobileOn && ' Mobile codes are Expected.'}
              </p>
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

        <AuthButton
          type="submit"
          arrow
          className="mt-6"
          disabled={busy || (mode === 'code' && step === 'code' && code.length < 6)}
        >
          {busy
            ? 'Please wait'
            : mode === 'password'
              ? 'Sign in'
              : {enter: 'Send code', code: 'Sign in', name: 'Continue'}[step]}
        </AuthButton>
        {mode === 'code' && step === 'name' && (
          <button type="button" onClick={onSkip} className="mt-4 w-full text-sm text-muted underline">
            Skip for now
          </button>
        )}
      </form>

      {step === 'enter' && (
        <>
          <OrDivider />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => switchMode(mode === 'code' ? 'password' : 'code')}
              className={authButton('outline')}
            >
              {mode === 'code' ? (
                <>
                  <KeyRound aria-hidden className="size-4" /> Use password
                </>
              ) : (
                <>
                  <Smartphone aria-hidden className="size-4" /> Use a code
                </>
              )}
            </button>
            <GoogleButton
              clientId={providers.data?.google}
              onCredential={google}
              onUnavailable={() =>
                setError(new Error('Google sign-in is not set up yet. Use a code or your password.'))
              }
            />
          </div>

          <div className="mt-8 border-t border-rule pt-8">
            <h2 className="text-xl">New to Pirento?</h2>
            <p className="mt-2 text-sm text-muted">
              {product ? `Create an account to use ${product.name}.` : 'Create one account for every Pirento product.'}
            </p>
            <AuthLink to={`/register${query}`} className="mt-5">
              Create an account
            </AuthLink>
          </div>
        </>
      )}
    </div>
  );
}
