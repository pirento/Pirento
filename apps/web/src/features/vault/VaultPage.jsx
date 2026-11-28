// Pirento Vault dashboard: an overview (what is kept, the legacy plan, space used, password health), then records,
// linked accounts, net worth, the will, documents, passwords and the nominee plan on their own pages. Every page sits inside the Bharat ID
// unlock, which asks for the PIN only when an action needs it.
import {Link} from 'react-router-dom';
import {ShieldAlert, ShieldCheck} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {DashSection} from '../../components/ui/DashSection';
import {appDashboards, vaultCopy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {AppFrame} from '../products/AppFrame';
import {Files} from './FilesPanel';
import {Passwords} from './PasswordsPanel';
import {Records} from './RecordsPanel';
import {Linked} from './LinkedPanel';
import {Legacy} from './LegacyPanel';
import {NetWorth} from './NetWorthPanel';
import {Will} from './WillPanel';
import {UnlockProvider} from './unlock';
import {mb} from '../../lib/api/binary';
import {useApi} from '../../lib/api/useApi';
import {usePageMeta} from '../../lib/page';

const copy = appDashboards.vault;

// Each page of the vault: its heading, intro and panel.
const PAGES = {
  records: {title: vaultCopy.records.title, intro: vaultCopy.records.intro, Panel: Records},
  linked: {title: vaultCopy.linked.title, intro: vaultCopy.linked.intro, Panel: Linked},
  files: {title: copy.files.title, intro: copy.intro, Panel: Files},
  passwords: {title: copy.passwords.title, intro: copy.intro, Panel: Passwords},
  networth: {title: vaultCopy.networth.title, intro: vaultCopy.networth.intro, Panel: NetWorth},
  will: {title: vaultCopy.will.title, intro: vaultCopy.will.intro, Panel: Will},
  legacy: {title: vaultCopy.legacy.title, intro: vaultCopy.legacy.intro, Panel: Legacy},
};

export function Vault({product, section}) {
  const {redirect, user} = useSignedIn();
  usePageMeta({
    title: 'Pirento Vault',
    description: 'Records, documents and passwords, encrypted, and a nominee plan.',
  });
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  const page = PAGES[section];
  return (
    <UnlockProvider>
      {page ? (
        <AppFrame product={product} section={section} title={page.title} intro={page.intro}>
          <page.Panel />
        </AppFrame>
      ) : (
        <Overview product={product} section={section} />
      )}
    </UnlockProvider>
  );
}

function Overview({product, section}) {
  const files = useApi('/vault/files');
  const passwords = useApi('/vault/credentials');
  const records = useApi('/vault/records');
  const legacy = useApi('/vault/legacy');
  const health = useApi('/vault/credentials/health');
  const f = files.data;
  const share = f ? Math.min(100, Math.round((f.used / f.quota) * 100)) : 0;
  const h = health.data;
  const flagged = h ? h.items.filter((i) => i.weak || i.reused) : [];
  const labelOf = (id) => passwords.data?.find((c) => c._id === id)?.label ?? 'An entry';
  const plan = legacy.data?.plan;
  return (
    <AppFrame product={product} section={section} title={copy.hello} intro={copy.intro} ready={Boolean(f && h)}>
      <DashSection n={1} id="glance" label={copy.glance.label} title={copy.glance.title}>
        <StatsRow
          compact
          stats={[
            {label: 'Records', value: records.data ? String(records.data.length) : '—'},
            {label: 'Documents', value: f ? String(f.files.length) : '—'},
            {label: 'Passwords', value: passwords.data ? String(passwords.data.length) : '—'},
            {label: 'Legacy plan', value: legacy.data ? (plan ? vaultCopy.legacy.stages[plan.stage] : 'Off') : '—'},
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
        <p className="mt-2 text-xs text-muted">{f && `${mb(f.used)} of ${mb(f.quota)} used`}</p>
        <p className="mt-6 flex flex-wrap gap-5 text-sm">
          {[
            ['/vault/dashboard/records', 'Open records'],
            ['/vault/dashboard/linked', 'Linked accounts'],
            ['/vault/dashboard/networth', 'Net worth'],
            ['/vault/dashboard/will', 'Your will'],
            ['/vault/dashboard/files', 'Documents'],
            ['/vault/dashboard/legacy', plan ? 'Your nominee plan' : 'Set up your nominee plan'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="underline underline-offset-4">
              {label}
            </Link>
          ))}
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
