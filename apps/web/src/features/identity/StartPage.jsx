// /bharat-id/start?centre=CODE: where an enrolment centre's QR leads. On the person's own phone: sign in (or make an
// account), then start the Bharat ID application, recorded against the centre.
import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {bharatIdStart as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';
import {isStaffRole} from '../admin/adminNav';
import {AuthButton} from '../auth/AuthButtons';
import {AuthShell} from '../auth/AuthShell';
import {useAuthDoor} from '../auth/useAuthDoor';

export function Start() {
  const door = useAuthDoor({page: copy.title});
  const {search, pathname} = useLocation();
  const navigate = useNavigate();
  const code = new URLSearchParams(search).get('centre')?.toUpperCase() ?? '';
  const centre = useApi(code ? `/identity/centres/${encodeURIComponent(code)}` : null);
  const {user} = useSession();
  const mine = useApi(user && !isStaffRole(user.role) ? '/identity/me' : null);
  const already = ['submitted', 'approved', 'suspended'].includes(mine.data?.status);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const here = encodeURIComponent(pathname + search);

  const start = async () => {
    setError('');
    setBusy(true);
    try {
      await api('/identity/start', {method: 'POST', body: code ? {centre: code} : {}});
      navigate('/bharat-id/dashboard/apply');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell side={door.side} home={door.home} homeLabel={door.homeLabel} innerRef={door.ref}>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1 className="mt-3 text-[clamp(1.9rem,3vw,2.5rem)] leading-tight">{copy.title}</h1>
      {code && centre.data && (
        <p className="mt-4 rounded-[14px] border border-rule p-4 text-sm">
          {copy.at} <span className="font-medium">{centre.data.name}</span>, {centre.data.city}
        </p>
      )}
      {code && centre.error && (
        <p role="alert" className="mt-4 text-sm">
          ⚠ {centre.error.message}. {copy.anyway}
        </p>
      )}
      <ol className="mt-6 space-y-2 text-sm text-muted">
        {copy.steps.map((s, i) => (
          <li key={s}>
            <span className="tabular-nums text-ink">{i + 1}.</span> {s}
          </li>
        ))}
      </ol>
      <div className="mt-8 space-y-3">
        {!user ? (
          <>
            <AuthButton type="button" arrow onClick={() => navigate(`/register?next=${here}`)}>
              {copy.create}
            </AuthButton>
            <AuthButton type="button" variant="outline" onClick={() => navigate(`/login?next=${here}`)}>
              {copy.signIn}
            </AuthButton>
          </>
        ) : isStaffRole(user.role) ? (
          <p className="text-sm">{copy.staff}</p>
        ) : already ? (
          <>
            <p className="text-sm">{mine.data.status !== 'submitted' ? copy.issued : copy.submitted}</p>
            <AuthButton type="button" arrow onClick={() => navigate('/bharat-id/dashboard')}>
              {copy.open}
            </AuthButton>
          </>
        ) : (
          <AuthButton type="button" arrow onClick={start} disabled={busy}>
            {busy ? 'Please wait' : copy.go}
          </AuthButton>
        )}
        {error && (
          <p role="alert" className="text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
    </AuthShell>
  );
}
