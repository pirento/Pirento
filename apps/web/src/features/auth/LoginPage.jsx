// Sign in with an emailed code, branded for the site you came from.
//
// Steps: email → 6-digit code → (first sign-in only) your name → back to where you were.
// The same page serves staff at /admin/login, where it insists on a staff account.
import {useEffect, useRef, useState} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Heading} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {siteName, useProductSite} from '../../lib/site';
import {isStaffRole} from '../admin/adminNav';

/** A same-site path to return to; anything else (another origin, //evil) is ignored. */
const safeNext = (value, fallback) => (/^\/(?!\/)/.test(value ?? '') ? value : fallback);

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

export function Login({staff = false}) {
  const {user, signIn, signOut, setUser} = useSession();
  const navigate = useNavigate();
  const product = useProductSite();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'), staff ? '/admin' : '/dashboard');

  const [step, setStep] = useState('email'); // email → code → name
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useCountdown();
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: `${staff ? 'Staff sign in' : 'Sign in'} — ${siteName(product)}`});

  // Already signed in (and not in the middle of naming yourself): go on.
  if (user && step !== 'name' && (!staff || isStaffRole(user.role))) return <Navigate to={next} replace />;

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

  const requestCode = () =>
    run(async () => {
      const res = await api('/auth/otp/request', {method: 'POST', body: {email, product: product?.slug}});
      setDevCode(res.devCode ?? '');
      setResendIn(res.resendAfter ?? 30);
      setCode('');
      setStep('code');
    });

  const verifyCode = () =>
    run(async () => {
      const res = await api('/auth/otp/verify', {method: 'POST', body: {email, code}});
      if (staff && !isStaffRole(res.user.role)) {
        // Signed in fine, but this door is for the team only.
        signIn(res.token, res.user);
        signOut();
        throw new Error('This account has no admin access. Use the customer sign-in instead.');
      }
      signIn(res.token, res.user);
      if (!res.user.name) setStep('name');
      else navigate(next);
    });

  const saveName = () =>
    run(async () => {
      setUser(await api('/auth/me', {method: 'PATCH', body: {name}}));
      navigate(next);
    });

  const submit = (e) => {
    e.preventDefault();
    ({email: requestCode, code: verifyCode, name: saveName})[step]();
  };

  const title = staff ? 'Staff / sign in.' : product ? `Sign in to / ${product.name}.` : 'One code. / Every product.';

  const home = staff ? '/' : product ? `/${product.slug}` : '/';
  const perks = staff
    ? ['Order, Bharat ID and ticket queues', 'Users, payments and partners', 'Every staff action is logged']
    : [
        'One account for all ten Pirento products',
        'No password: a code by email each time',
        'Your orders, wallet and ID in one dashboard',
      ];

  return (
    <div ref={ref} className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: the site's own dark field, so you always know where you are signing in. */}
      <aside className="inverse relative flex flex-col justify-between overflow-hidden p-8 sm:p-12">
        <div aria-hidden className="grid-bg absolute inset-0 opacity-30" />
        <Link
          to={home}
          className="relative flex items-center gap-2.5 font-display font-semibold tracking-[0.04em] uppercase"
        >
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent" />
          {staff ? 'Pirento Admin' : siteName(product)}
        </Link>
        <div className="relative mt-16 lg:mt-0">
          <Heading as="h1" text={title} hl={title.split(' / ')[1]} className="h-section" />
          <ul className="mt-10 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[0.95rem] text-muted">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-16 text-xs text-muted">© {new Date().getFullYear()} Pirento Ecosystem Pvt. Ltd.</p>
      </aside>

      {/* Right: the form. */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <Link to={home} className="mb-10 inline-flex items-center gap-2 self-start text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Back to {staff ? 'Pirento Ecosystem' : siteName(product)}
        </Link>
        <form onSubmit={submit} noValidate className="w-full max-w-md">
          <p className="eyebrow">
            {staff ? 'Staff sign in' : 'Sign in'} · Step {{email: 1, code: 2, name: 3}[step]} of{' '}
            {step === 'name' ? 3 : 2}
          </p>
          <p className="body mt-3 mb-8 text-base">
            {staff
              ? 'Use your work email. Only accounts with a staff role can open the admin dashboard.'
              : 'Enter your email and we send a 6-digit code. No password to remember.'}
          </p>

          {step === 'email' && (
            <Field
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
          )}

          {step === 'code' && (
            <>
              <p className="mb-6 text-sm text-muted">
                We sent a code to <span className="text-ink">{email}</span>. It works for 10 minutes.{' '}
                <button type="button" className="underline underline-offset-4" onClick={() => setStep('email')}>
                  Change email
                </button>
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
              {devCode && (
                <p className="mt-3 text-sm text-muted">
                  Test mode code: <span className="text-ink tabular-nums">{devCode}</span>
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
              <p className="mb-6 text-sm text-muted">Welcome to Pirento. What should we call you?</p>
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
            {busy ? 'Please wait' : {email: 'Send code', code: 'Sign in', name: 'Continue'}[step]}
          </Button>
          {step === 'name' && (
            <button type="button" onClick={() => navigate(next)} className="mt-4 w-full text-sm text-muted underline">
              Skip for now
            </button>
          )}
          {!staff && (
            <p className="mt-10 text-sm text-muted">
              Pirento team?{' '}
              <Link to="/admin/login" className="text-ink underline underline-offset-4">
                Staff sign in
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

/** /admin/login */
export const StaffLogin = () => <Login staff />;
