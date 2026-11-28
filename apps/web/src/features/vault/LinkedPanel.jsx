// Linked accounts: mutual funds, stocks, ETFs and insurance in one place. "Link through Digio" (after the Bharat ID
// unlock) asks the owner's consent on their Account Aggregator; the holdings then arrive as sealed records, again
// every month. Records added by hand sit alongside, in the Records panel narrowed to these kinds.
import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Link2, RefreshCw, Trash2} from 'lucide-react';
import {VAULT_KINDS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {StatsRow} from '../../components/ui/Blocks';
import {StatusTag, Tag} from '../../components/ui/Tag';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {loadDigio} from '../identity/digio';
import {Records} from './RecordsPanel';
import {shown, useUnlock} from './unlock';

const copy = vaultCopy.linked;
const LINKED = VAULT_KINDS.filter((k) => k.linked);

export function Linked() {
  const list = useApi('/vault/records');
  const links = useApi('/vault/links');
  const guard = useUnlock();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const count = (id) => (list.data ?? []).filter((r) => r.kind === id).length;
  const reload = () => {
    links.reload();
    list.reload();
  };

  // Back from the Account Aggregator: ask Digio where the consent stands at once.
  const back = params.get('linked');
  useEffect(() => {
    if (!back) return;
    setParams({}, {replace: true});
    api(`/vault/links/${back}/refresh`, {method: 'POST'})
      .catch(() => {})
      .finally(() => {
        links.reload();
        list.reload();
      });
  }, [back]); // runs once per return; the loaders are stable enough for that

  const link = async () => {
    setError('');
    setBusy(true);
    try {
      const r = await guard((headers) => api('/vault/links', {method: 'POST', headers}));
      const Digio = await loadDigio(r.sdk);
      const digio = new Digio({
        environment: r.environment,
        is_redirection_approach: true,
        redirect_url: `${window.location.origin}/vault/dashboard/linked?linked=${r._id}`,
      });
      digio.init();
      digio.submit(r.consentRequestId, r.customerId, r.gatewayToken);
    } catch (err) {
      setError(shown(err));
    } finally {
      setBusy(false);
    }
  };
  const act = async (fn) => {
    setError('');
    try {
      await fn();
      reload();
    } catch (err) {
      setError(shown(err));
    }
  };

  const on = links.data?.on;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-8">
          <StatsRow
            compact
            stats={LINKED.map((k) => ({label: k.label, value: list.data ? String(count(k.id)) : '—'}))}
          />
        </div>
        <div className="rounded-[22px] border border-rule bg-stone p-6 md:col-span-4" data-reveal>
          <div className="flex items-center justify-between gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-paper">
              <Link2 aria-hidden className="size-4" />
            </span>
            {links.data && (on ? <Tag tone="accent">Digio</Tag> : <StatusTag status="expected" />)}
          </div>
          <h3 className="mt-5 text-xl">{copy.connectTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{on ? copy.connectBody : copy.offBody}</p>
          {on && (
            <div className="mt-5">
              <Button variant="accent" icon={Link2} onClick={link} disabled={busy}>
                {busy ? copy.opening : copy.connect}
              </Button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      {links.data?.items.length > 0 && (
        <ul className="rounded-[22px] border border-rule px-6" data-reveal>
          {links.data.items.map((l) => (
            <li
              key={l._id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {copy.statuses[l.status] ?? l.status}
                  {l.accounts?.length > 0 && <span className="text-muted"> · {copy.accounts(l.accounts.length)}</span>}
                </p>
                <p className="text-sm text-muted">
                  {l.fetchedAt
                    ? `${copy.fetched} ${formatDate(l.fetchedAt)}`
                    : `${copy.asked} ${formatDate(l.createdAt)}`}
                  {l.error && ` · ${l.error}`}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => act(() => api(`/vault/links/${l._id}/refresh`, {method: 'POST'}))}
                  className="rounded-full p-2 hover:bg-stone"
                  aria-label={copy.refresh}
                >
                  <RefreshCw aria-hidden className="size-4" />
                </button>
                <button
                  onClick={() =>
                    confirm(copy.removeConfirm) &&
                    act(() => guard((headers) => api(`/vault/links/${l._id}`, {method: 'DELETE', headers})))
                  }
                  className="rounded-full p-2 hover:bg-stone"
                  aria-label={copy.remove}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Records only={LINKED.map((k) => k.id)} />
    </div>
  );
}
