// The staff door: the staff ID and password a superadmin issued you.
import {useState} from 'react';
import {Lock} from 'lucide-react';
import {AuthButton} from './AuthButtons';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {PasswordField} from './PasswordField';

export function StaffSignIn({onSignedIn}) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      onSignedIn(await api('/auth/staff/login', {method: 'POST', body: {staffId: staffId.trim(), password}}));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <span className="inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1 text-xs text-muted">
        <Lock aria-hidden className="size-3.5" /> Restricted · staff only
      </span>
      <h1 className="mt-5 text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">Sign in to the console</h1>
      <p className="mt-3 mb-8 text-muted">Use the staff ID and password a superadmin gave you.</p>
      <div className="space-y-5">
        <Field
          label="Staff ID"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
      </div>
      <AuthButton
        arrow
        type="submit"

        className="mt-8"
        disabled={busy || !staffId.trim() || !password}
      >
        {busy ? 'Please wait' : 'Sign in'}
      </AuthButton>
      <details className="mt-6 text-sm text-muted">
        <summary className="cursor-pointer hover:text-ink">Trouble signing in?</summary>
        <p className="mt-2">
          Forgot your password: ask a superadmin to set a new one. Given a staff role but no staff ID yet: sign in with
          your email at the customer sign-in, then open Admin.
        </p>
      </details>
    </form>
  );
}
