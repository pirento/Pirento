// Pirento Vault dashboard: an overview (space used, password health), then files and passwords on their own pages.
import {Link} from 'react-router-dom';
import {ShieldAlert, ShieldCheck} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {DashSection} from '../../components/ui/DashSection';
import {appDashboards} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {AppFrame} from '../products/AppFrame';
import {Files} from './FilesPanel';
import {Passwords} from './PasswordsPanel';
import {mb} from '../../lib/api/binary';
import {useApi} from '../../lib/api/useApi';
import {usePageMeta} from '../../lib/page';

const copy = appDashboards.vault;

export function Vault({product, section}) {
  const {redirect, user} = useSignedIn();
  const files = useApi(user && section === 'overview' ? '/vault/files' : null);
  const passwords = useApi(user && section === 'overview' ? '/vault/credentials' : null);
  const health = useApi(user && section === 'overview' ? '/vault/credentials/health' : null);
  usePageMeta({title: 'Pirento Vault', description: 'Files and passwords, encrypted at rest.'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  const frame = {product, section};

  if (section === 'files') {
    return (
      <AppFrame {...frame} title={copy.files.title} intro={copy.intro}>
        <Files />
      </AppFrame>
    );
  }
  if (section === 'passwords') {
    return (
      <AppFrame {...frame} title={copy.passwords.title} intro={copy.intro}>
        <Passwords />
      </AppFrame>
    );
  }

  const f = files.data;
  const share = f ? Math.min(100, Math.round((f.used / f.quota) * 100)) : 0;
  const h = health.data;
  const flagged = h ? h.items.filter((i) => i.weak || i.reused) : [];
  const labelOf = (id) => passwords.data?.find((c) => c._id === id)?.label ?? 'An entry';
  return (
    <AppFrame {...frame} title={copy.hello} intro={copy.intro} ready={Boolean(f && h)}>
      <DashSection n={1} id="glance" label={copy.glance.label} title={copy.glance.title}>
        <StatsRow
          compact
          stats={[
            {label: 'Files', value: f ? String(f.files.length) : '—'},
            {label: 'Passwords', value: passwords.data ? String(passwords.data.length) : '—'},
            {label: f ? `Space used of ${mb(f.quota)}` : 'Space used', value: f ? mb(f.used) : '—'},
          ]}
        />
        {/* The bar is the space used; aria on the bar itself so a screen reader hears the number. */}
        <div
          className="mt-6 h-2 overflow-hidden rounded-full bg-stone"
          role="meter"
          aria-label="Vault space used"
          aria-valuenow={share}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-ink" style={{width: `${share}%`}} />
        </div>
        <p className="mt-6 flex flex-wrap gap-5 text-sm">
          <Link to="/vault/dashboard/files" className="underline underline-offset-4">
            Open files
          </Link>
          <Link to="/vault/dashboard/passwords" className="underline underline-offset-4">
            Open passwords
          </Link>
        </p>
      </DashSection>

      <DashSection n={2} id="health" label={copy.health.label} title={copy.health.title}>
        {h && flagged.length === 0 && (
          <p className="flex items-center gap-3">
            <ShieldCheck aria-hidden className="size-5" /> {copy.health.good}
          </p>
        )}
        {flagged.length > 0 && (
          <ul className="border-t border-rule">
            {flagged.map((i) => (
              <li key={i._id} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                <span className="flex min-w-0 items-center gap-3">
                  <ShieldAlert aria-hidden className="size-4 shrink-0" />
                  <span className="truncate font-medium">{labelOf(i._id)}</span>
                </span>
                <span className="shrink-0 text-sm text-muted">
                  {[i.weak && copy.health.weak, i.reused && copy.health.reused].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-sm text-muted">{copy.health.note}</p>
      </DashSection>
    </AppFrame>
  );
}
