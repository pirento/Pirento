// The staff door: the staff ID and password a superadmin issued you.
import {useState} from 'react';
import {Eye, EyeOff} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';

export function StaffSignIn({onSignedIn}) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
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
      <p className="eyebrow">Staff sign in</p>
      <p className="body mt-3 mb-8 text-base">
        Authorised staff only. Use the staff ID and password a superadmin gave you.
      </p>
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
        <div className="relative">
          <Field
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute top-9 right-3 flex size-9 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        variant="accent"
        className="mt-8 w-full justify-center"
        disabled={busy || !staffId.trim() || !password}
      >
        {busy ? 'Please wait' : 'Sign in'}
      </Button>
      <p className="mt-6 text-sm text-muted">
        Forgot your password? Ask a superadmin to set a new one. Given a staff role but no staff ID yet? Sign in with
        your email at the customer sign-in, then open Admin.
      </p>
    </form>
  );
}
