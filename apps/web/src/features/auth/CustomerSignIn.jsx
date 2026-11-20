// Customer sign-in: pick a way in (Google, Bharat ID, email; mobile is Expected), get a code, and name yourself the first time.
import {useEffect, useState} from 'react';
import {Fingerprint, Mail, Smartphone} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {GoogleButton} from './GoogleButton';

const METHODS = {
  'bharat-id': {
    icon: Fingerprint,
    title: 'Bharat ID',
    body: 'We send a code to the email on your ID',
    label: '10-digit Bharat ID',
    request: (value, product) => ['/auth/otp/bharat-id/request', {bharatId: value, product}],
    verify: (value, code) => ['/auth/otp/bharat-id/verify', {bharatId: value, code}],
  },
  email: {
    icon: Mail,
    title: 'Email',
    body: 'A 6-digit code, no password',
    label: 'Email',
    request: (value, product) => ['/auth/otp/request', {email: value, product}],
    verify: (value, code) => ['/auth/otp/verify', {email: value, code}],
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

export function CustomerSignIn({product, onSignedIn, onNamed, onSkip}) {
  const providers = useApi('/auth/providers');
  const [step, setStep] = useState('method'); // method → input → code → name
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
  const finish = (res) => (res.user.name ? onSignedIn(res) : (onSignedIn(res, {stay: true}), setStep('name')));

  const requestCode = () =>
    run(async () => {
      const [path, body] = m.request(value.trim(), product?.slug);
      const res = await api(path, {method: 'POST', body});
      setSent(res);
      setResendIn(res.resendAfter ?? 30);
      setCode('');
      setStep('code');
    });
  const verifyCode = () =>
    run(async () => {
      const [path, body] = m.verify(value.trim(), code);
      finish(await api(path, {method: 'POST', body}));
    });
  const google = (idToken) => run(async () => finish(await api('/auth/google', {method: 'POST', body: {idToken}})));
  const saveName = () => run(() => onNamed(name));

  if (step === 'method') {
    const p = providers.data;
    return (
      <div>
        <p className="eyebrow">Sign in or create your account</p>
        <p className="body mt-3 mb-8 text-base">One account for every Pirento product. Choose how to sign in.</p>
        {p?.google && (
          <>
            <GoogleButton clientId={p.google} onCredential={google} />
            <p className="my-6 flex items-center gap-4 text-xs text-muted">
              <span className="h-px flex-1 bg-rule" /> or <span className="h-px flex-1 bg-rule" />
            </p>
          </>
        )}
        <ul className="space-y-3">
          {Object.entries(METHODS).map(([id, x]) => (
            <li key={id}>
              <button
                onClick={() => {
                  setMethod(id);
                  setValue('');
                  setError('');
                  setStep('input');
                }}
                className="flex w-full items-center gap-4 rounded-[18px] border border-rule p-4 text-left transition-colors hover:border-ink"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-stone">
                  <x.icon aria-hidden className="size-5" />
                </span>
                <span>
                  <span className="block font-medium">Continue with {x.title}</span>
                  <span className="text-sm text-muted">{x.body}</span>
                </span>
              </button>
            </li>
          ))}
          <li>
            {/* Shown, not hidden: people look for it. It opens when an SMS provider is connected. */}
            <div
              aria-disabled="true"
              className="flex w-full items-center gap-4 rounded-[18px] border border-dashed border-rule p-4 text-muted"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-stone">
                <Smartphone aria-hidden className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-medium">Mobile number</span>
                <span className="text-sm">SMS codes are not set up yet</span>
              </span>
              <span className="rounded-full border border-rule px-2.5 py-0.5 text-xs">Expected</span>
            </div>
          </li>
        </ul>
        {error && (
          <p role="alert" className="mt-4 text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    ({input: requestCode, code: verifyCode, name: saveName})[step]();
  };
  const stepNo = {input: 1, code: 2, name: 3}[step];

  return (
    <form onSubmit={submit} noValidate>
      <p className="eyebrow">
        {step === 'name' ? 'Welcome' : `With ${m.title}`} · Step {stepNo} of {step === 'name' ? 3 : 2}
      </p>
      {step !== 'name' && (
        <button
          type="button"
          onClick={() => setStep('method')}
          className="mt-3 mb-8 text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Use another way
        </button>
      )}

      {step === 'input' && (
        <Field
          label={m.label}
          type={method === 'email' ? 'email' : 'text'}
          inputMode={method === 'email' ? 'email' : 'numeric'}
          autoComplete={method === 'email' ? 'email' : 'off'}
          maxLength={method === 'email' ? 200 : 14}
          required
          value={value}
          onChange={(e) => setValue(method === 'email' ? e.target.value : e.target.value.replace(/[^\d ]/g, ''))}
          error={error}
        />
      )}

      {step === 'code' && (
        <>
          <p className="mb-6 text-sm text-muted">
            We sent a code to <span className="text-ink">{sent?.sentTo ?? value}</span>. It works for 10 minutes.
          </p>
          <Field
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            error={error}
          />
          {sent?.devCode && (
            <p className="mt-3 text-sm text-muted">
              Test mode code: <span className="text-ink tabular-nums">{sent.devCode}</span>
            </p>
          )}
          <button
            type="button"
            onClick={requestCode}
            disabled={resendIn > 0 || busy}
            className="mt-4 text-sm underline underline-offset-4 disabled:no-underline disabled:opacity-60"
          >
            {resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
          </button>
        </>
      )}

      {step === 'name' && (
        <>
          <p className="mt-3 mb-6 text-sm text-muted">Welcome to Pirento. What should we call you?</p>
          <Field
            label="Your name"
            required
            autoComplete="name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
        </>
      )}

      <Button type="submit" variant="accent" className="mt-8 w-full justify-center" disabled={busy}>
        {busy ? 'Please wait' : {input: 'Send code', code: 'Sign in', name: 'Continue'}[step]}
      </Button>
      {step === 'name' && (
        <button type="button" onClick={onSkip} className="mt-4 w-full text-sm text-muted underline">
          Skip for now
        </button>
      )}
    </form>
  );
}
