// Linked accounts: mutual funds, stocks, ETFs and insurance in one place. Fetching them from Digio with the person's
// consent is Expected; until then they are records added by hand, shown here with the Records panel narrowed to them.
import {Link2} from 'lucide-react';
import {VAULT_KINDS} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {StatusTag} from '../../components/ui/Tag';
import {vaultCopy} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {Records} from './RecordsPanel';

const copy = vaultCopy.linked;
const LINKED = VAULT_KINDS.filter((k) => k.linked);

export function Linked() {
  const list = useApi('/vault/records');
  const count = (id) => (list.data ?? []).filter((r) => r.kind === id).length;
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
            <StatusTag status="expected" />
          </div>
          <h3 className="mt-5 text-xl">{copy.connectTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{copy.connectBody}</p>
        </div>
      </div>
      <Records only={LINKED.map((k) => k.id)} />
    </div>
  );
}
