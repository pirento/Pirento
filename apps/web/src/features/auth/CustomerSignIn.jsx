// Customer sign-in: Google (when set up), or tabs for email and Bharat ID; then the code, then your name the first time.
import {useEffect, useState} from 'react';
import {Fingerprint, Mail, Smartphone} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {CodeBoxes} from './CodeBoxes';
import {GoogleButton} from './GoogleButton';

const METHODS = {
  email: {
    icon: Mail,
    tab: 'Email',
    label: 'Email',
    hint: 'We email you a 6-digit code. No password.',
    request: (value, product) => ['/auth/otp/request', {email: value, product}],
    verify: (value, code) => ['/auth/otp/verify', {email: value, code}],
  },
  'bharat-id': {
    icon: Fingerprint,
    tab: 'Bharat ID',
    label: '10-digit Bharat ID',
    hint: 'The code goes to the email on your issued ID.',
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

export function CustomerSignIn({title, product, onSignedIn, onNamed, onSkip}) {
  const providers = useApi('/auth/providers');
  const [step, setStep] = useState('enter'); // enter → code → name
  const [method, setMethod] = useState('email');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useCountdown();
  const m = METHODS[method];

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
  const google = (idToken) => run(async () => finish(await api('/auth/google', {method: 'POST', body: {idToken}})));

  const submit = (e) => {
    e.preventDefault();
    if (step === 'enter') requestCode();
    else if (step === 'code') verifyCode();
    else run(() => onNamed(name));
  };

  const heading = {enter: title, code: 'Check your email', name: 'One last thing'}[step];
  const sub = {
    enter: 'New here? Signing in creates your account.',
    code: (
      <>
        We sent a 6-digit code to <span className="text-ink">{sent?.sentTo ?? value}</span>. It works for 10 minutes.
      </>
    ),
    name: 'Welcome to Pirento. What should we call you?',
  }[step];

  return (
    <div>
      <h1 className="text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">{heading}</h1>
      <p className="mt-3 text-muted">{sub}</p>

      {step === 'enter' && providers.data?.google && (
        <div className="mt-8">
          <GoogleButton clientId={providers.data.google} onCredential={google} />
          <p className="mt-6 flex items-center gap-4 text-xs text-muted">
            <span className="h-px flex-1 bg-rule" /> or use a code <span className="h-px flex-1 bg-rule" />
          </p>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8">
        {step === 'enter' && (
          <>
            <div role="tablist" aria-label="Sign in with" className="grid grid-cols-3 gap-1 rounded-full bg-stone p-1">
              {Object.entries(METHODS).map(([id, x]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={method === id}
                  onClick={() => {
                    setMethod(id);
                    setValue('');
                    setError('');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-full px-2 py-2 text-sm transition-colors ${
                    method === id ? 'bg-paper text-ink ring-1 ring-rule' : 'text-muted hover:text-ink'
                  }`}
                >
                  <x.icon aria-hidden className="size-4 shrink-0" />
                  <span className="truncate">{x.tab}</span>
                </button>
              ))}
              {/* Listed, not hidden: people look for it. It opens when an SMS provider is connected. */}
              <button
                type="button"
                role="tab"
                aria-selected={false}
                aria-disabled="true"
                title="SMS codes are not set up yet"
                className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full px-2 py-2 text-sm text-muted opacity-70"
              >
                <Smartphone aria-hidden className="size-4 shrink-0" />
                <span className="truncate">Mobile</span>
                <span className="sr-only">(Expected, not available yet)</span>
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">{m.hint} Mobile sign-in is Expected.</p>
            <div className="mt-6">
              <Field
                key={method}
                label={m.label}
                type={method === 'email' ? 'email' : 'text'}
                inputMode={method === 'email' ? 'email' : 'numeric'}
                autoComplete={method === 'email' ? 'email' : 'off'}
                placeholder={method === 'email' ? 'you@example.com' : '0000 0000 00'}
                maxLength={method === 'email' ? 200 : 14}
                required
                value={value}
                onChange={(e) => setValue(method === 'email' ? e.target.value : e.target.value.replace(/[^\d ]/g, ''))}
                error={error}
              />
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <CodeBoxes value={code} onChange={setCode} onComplete={verifyCode} error={error} disabled={busy} />
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
                onClick={() => {
                  setStep('enter');
                  setError('');
                }}
                className="text-muted underline underline-offset-4 hover:text-ink"
              >
                Use another {method === 'email' ? 'email' : 'ID'}
              </button>
            </div>
          </>
        )}

        {step === 'name' && (
          <Field
            label="Your name"
            required
            autoFocus
            autoComplete="name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
        )}

        <Button
          type="submit"
          variant="accent"
          className="mt-8 w-full justify-center"
          disabled={busy || (step === 'code' && code.length < 6)}
        >
          {busy ? 'Please wait' : {enter: 'Send code', code: 'Sign in', name: 'Continue'}[step]}
        </Button>
        {step === 'name' && (
          <button type="button" onClick={onSkip} className="mt-4 w-full text-sm text-muted underline">
            Skip for now
          </button>
        )}
      </form>
    </div>
  );
}
