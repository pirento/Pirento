// Vault → Net worth: what the owner owns minus what they owe, added up on the server from their records (typed or
// fetched through Digio) after the Bharat ID unlock, with insurance cover shown apart. Nothing is kept in the browser.
import {useState} from 'react';
import {Eye} from 'lucide-react';
import {vaultKind} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {StatsRow} from '../../components/ui/Blocks';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {inr} from '../../lib/format';
import {shown, useUnlock} from './unlock';

const copy = vaultCopy.networth;

export function NetWorth() {
  const guard = useUnlock();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setError('');
    setBusy(true);
    try {
      setData(await guard((headers) => api('/vault/networth', {headers})));
    } catch (err) {
      setError(shown(err));
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
        <Button variant="accent" icon={Eye} onClick={load} disabled={busy}>
          {copy.show}
        </Button>
        {error && (
          <p role="alert" className="mt-4 text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
    );
  }
  const kinds = Object.entries(data.byKind).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-6">
      <StatsRow
        compact
        stats={[
          {label: copy.net, value: inr(data.net)},
          {label: copy.assets, value: inr(data.assets)},
          {label: copy.debts, value: inr(data.debts)},
          {label: copy.cover, value: inr(data.cover)},
        ]}
      />
      <p className="text-sm text-muted">{copy.coverNote}</p>
      {data.items.length === 0 ? (
        <p className="body">{copy.empty}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[22px] border border-rule p-6" data-reveal>
            <p className="font-medium">{copy.byKind}</p>
            <ul className="mt-4">
              {kinds.map(([kind, value]) => (
                <li key={kind} className="flex justify-between gap-4 border-b border-rule py-3 text-sm">
                  <span>{vaultKind(kind)?.label ?? kind}</span>
                  <span className="tabular-nums">{inr(value)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[22px] border border-rule p-6" data-reveal>
            <p className="font-medium">{copy.items}</p>
            <ul className="mt-4">
              {data.items.map((i, n) => (
                <li key={n} className="flex justify-between gap-4 border-b border-rule py-3 text-sm">
                  <span className="min-w-0 break-words">
                    {i.title}
                    <span className="block text-xs text-muted">
                      {vaultKind(i.kind)?.label}
                      {i.side === 'cover' && ` · ${copy.coverTag}`}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {i.side === 'debts' ? '− ' : ''}
                    {inr(i.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <p className="text-xs text-muted">{copy.note}</p>
    </div>
  );
}
