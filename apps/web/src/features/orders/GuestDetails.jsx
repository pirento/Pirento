// Checkout for someone not signed in: name, email and mobile, then a code to the mobile (or the email when texts
// are off). Verifying signs them in (making the account if it is new), and checkout carries on as usual.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {CodeBoxes} from '../auth/CodeBoxes';
import {MobileInput} from '../auth/CustomerSignIn';
import {checkoutGuest as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';

export function GuestDetails({product, next, onPhone}) {
  const {signIn} = useSession();
  const [form, setForm] = useState({name: '', email: '', phone: ''});
  const [terms, setTerms] = useState(false);
  const [sent, setSent] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const body = {...form, phone: form.phone.replace(/\D/g, ''), product};
  const request = () =>
    run(async () => {
      setSent(await api('/auth/otp/checkout/request', {method: 'POST', body}));
      setCode('');
    });
  const verify = (c = code) =>
    run(async () => {
      const res = await api('/auth/otp/checkout/verify', {method: 'POST', body: {...body, code: c, acceptTerms: true}});
      onPhone(body.phone);
      signIn(res.token, res.user);
    });

  const submit = (e) => {
    e.preventDefault();
    if (sent) verify();
    else request();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
      <div>
        <p className="eyebrow">{copy.label}</p>
        <h2 className="mt-3 text-2xl">{copy.title}</h2>
        <p className="mt-2 text-sm text-muted">{copy.intro}</p>
      </div>
      {!sent ? (
        <>
          <Field
            label={copy.name}
            required
            autoComplete="name"
            maxLength={80}
            value={form.name}
            onChange={set('name')}
          />
          <Field
            label={copy.email}
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={200}
            value={form.email}
            onChange={set('email')}
          />
          <MobileInput
            value={form.phone}
            onChange={(e) => setForm((f) => ({...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10)}))}
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
              {copy.terms}{' '}
              <Link to="/terms" target="_blank" rel="noopener" className="font-medium underline underline-offset-4">
                {copy.termsLink}
              </Link>
              .
            </span>
          </label>
        </>
      ) : (
        <>
          <p className="text-sm">
            {copy.sentTo(sent.sentTo)}{' '}
            <button type="button" onClick={() => setSent(null)} className="underline underline-offset-4">
              {copy.change}
            </button>
          </p>
          {sent.devCode && <p className="text-xs text-muted">{copy.dev(sent.devCode)}</p>}
          <CodeBoxes value={code} onChange={setCode} onComplete={verify} disabled={busy} />
        </>
      )}
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="accent" disabled={busy || (!sent && !terms) || (sent && code.length < 6)}>
          {busy ? copy.wait : sent ? copy.verify : copy.send}
        </Button>
        <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-sm underline underline-offset-4">
          {copy.haveAccount}
        </Link>
      </div>
    </form>
  );
}
