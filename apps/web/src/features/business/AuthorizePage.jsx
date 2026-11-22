// Pirento's own Bharat ID check page, opened from a business's link: the person proves they hold the ID here, so
// the business never sees the PIN or the codes. Then it sends them back to the business's site.
import {useEffect, useState} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import {SANDBOX_AUTH, authMethod} from '@pirento/shared';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {AuthButton} from '../auth/AuthButtons';
import {AuthShell} from '../auth/AuthShell';
import {useAuthDoor} from '../auth/useAuthDoor';
import {PasswordField} from '../auth/PasswordField';
import {loadDigio, openDigio} from '../identity/digio';

const digits = (v) => v.replace(/\D/g, '').slice(0, 6);
const RESULT = {
  passed: 'Done. It is you.',
  failed: 'This check did not pass.',
  expired: 'This link has expired.',
};

export function Authorize() {
  const {id} = useParams();
  const t = new URLSearchParams(useLocation().search).get('t') ?? '';
  const first = useApi(`/identity/authorize/${id}?t=${encodeURIComponent(t)}`);
  const config = useApi('/identity/digio/config');
  const [fresh, setFresh] = useState(null);
  const [pin, setPin] = useState('');
  const [dob, setDob] = useState('');
  const [codes, setCodes] = useState({emailCode: '', mobileCode: ''});
  const [sent, setSent] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const door = useAuthDoor({page: 'Bharat ID check'});
  const s = fresh ?? first.data;
  const method = s && authMethod(s.method);
  const sandbox = s?.mode === 'test';

  // Digio's window must open inside the click, so its script loads first.
  useEffect(() => {
    if (method?.provider && !sandbox && config.data?.on)
      loadDigio(config.data.sdk).catch((err) => setError(err.message));
  }, [method, sandbox, config.data]);
  // Once finished, back to the business after a moment.
  useEffect(() => {
    if (!s?.returnTo) return;
    const timer = setTimeout(() => window.location.assign(s.returnTo), 2500);
    return () => clearTimeout(timer);
  }, [s?.returnTo]);

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
  const verify = (body = {}) =>
    run(async () => {
      const r = await api(`/identity/authorize/${id}/verify`, {method: 'POST', body: {t, ...body}});
      setFresh(r);
      if (r.wrong) setError(`That is not right. ${r.triesLeft} ${r.triesLeft === 1 ? 'try' : 'tries'} left.`);
      else if (r.status === 'pending' && method?.provider)
        setError('Not finished yet. Complete the check, then try again.');
    });
  const start = () =>
    run(async () => setSent(await api(`/identity/authorize/${id}/start`, {method: 'POST', body: {t}})));
  const startProvider = () => {
    if (sandbox) return verify();
    run(async () => {
      await openDigio({
        environment: config.data.environment,
        start: async () => {
          const r = await api(`/identity/authorize/${id}/start`, {method: 'POST', body: {t}});
          return {id: r.requestId, identifier: r.identifier, token: r.token};
        },
      });
    }).then(() => verify());
  };

  const shell = (children) => (
    <AuthShell side={door.side} home={door.home} homeLabel={door.homeLabel} innerRef={door.ref}>
      {children}
    </AuthShell>
  );
  if (first.loading) return shell(null);
  if (first.error) {
    return shell(
      <div>
        <p className="eyebrow">Bharat ID check</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">This link does not work</h1>
        <p className="mt-3 text-muted">
          It may be wrong or already used. Go back to the site that sent you and start again.
        </p>
      </div>,
    );
  }

  return shell(
    <div>
      <p className="eyebrow">Bharat ID check</p>
      <h1 className="mt-3 text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">
        {s.status === 'pending' ? `${s.businessName} asks you to prove it is you` : RESULT[s.status]}
      </h1>
      <p className="mt-3 text-muted">
        Bharat ID ending {s.bharatIdEnd} · {method?.label}. You do this on Pirento; {s.businessName} only learns whether
        it passed.
      </p>
      {sandbox && s.status === 'pending' && (
        <p className="mt-4 rounded-[14px] border border-rule p-4 text-sm">
          Sandbox: PIN {SANDBOX_AUTH.pin}, date of birth {SANDBOX_AUTH.dob}, codes {SANDBOX_AUTH.code}.
        </p>
      )}

      {s.status !== 'pending' ? (
        <a href={s.returnTo} className="mt-8 inline-block text-sm underline underline-offset-4">
          Back to {s.businessName}
        </a>
      ) : s.method === 'pin_dob' ? (
        <form
          noValidate
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            verify({pin, dob});
          }}
        >
          <PasswordField
            label="Your 6-digit Bharat ID PIN"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            required
            value={pin}
            onChange={(e) => setPin(digits(e.target.value))}
          />
          <Field label="Date of birth" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          <AuthButton type="submit" arrow disabled={busy || pin.length < 6 || !dob}>
            {busy ? 'Checking' : 'Confirm'}
          </AuthButton>
        </form>
      ) : s.method === 'otp' ? (
        <form
          noValidate
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!sent) start();
            else verify(codes);
          }}
        >
          {sent && (
            <>
              <p className="text-sm text-muted">
                {sandbox
                  ? 'Sandbox: no codes are sent.'
                  : `Codes sent to ${sent.email} and ${sent.mobile}. They work for 10 minutes.`}
              </p>
              <Field
                label="Code from your email"
                inputMode="numeric"
                maxLength={6}
                value={codes.emailCode}
                onChange={(e) => setCodes((c) => ({...c, emailCode: digits(e.target.value)}))}
              />
              <Field
                label="Code from your mobile"
                inputMode="numeric"
                maxLength={6}
                value={codes.mobileCode}
                onChange={(e) => setCodes((c) => ({...c, mobileCode: digits(e.target.value)}))}
              />
            </>
          )}
          <AuthButton
            type="submit"
            arrow
            disabled={busy || (sent && (codes.emailCode.length < 6 || codes.mobileCode.length < 6))}
          >
            {busy ? 'Please wait' : sent ? 'Confirm' : 'Send the codes'}
          </AuthButton>
        </form>
      ) : (
        <div className="mt-8 space-y-4">
          <AuthButton type="button" arrow onClick={startProvider} disabled={busy}>
            {busy ? 'Please wait' : `Start: ${method?.label}`}
          </AuthButton>
          <button
            type="button"
            onClick={() => verify()}
            disabled={busy}
            className="text-sm underline underline-offset-4"
          >
            I finished it: check again
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm">
          ⚠ {error}
        </p>
      )}
      <p className="mt-8 text-xs text-muted">
        Never type your PIN or codes on another site. This page is on Pirento, and the check expires 10 minutes after it
        was asked for.
      </p>
    </div>,
  );
}
