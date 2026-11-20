// Pirento Vault: what happens to your data, as a plain spec sheet, including what it does not do.
import {VAULT_LIMITS} from '@pirento/shared';
import {WidgetCard} from './Card';

const ROWS = [
  ['Cipher', VAULT_LIMITS.cipher],
  ['IV', 'Fresh and random for every item'],
  ['File size', `Up to ${VAULT_LIMITS.fileMb} MB each`],
  ['Space', `${VAULT_LIMITS.totalMb} MB per account`],
  ['Passwords', 'Hidden in lists, shown only on request'],
  ['Keys', 'Held by Pirento: not end-to-end'],
];

export function SpecSheet() {
  return (
    <WidgetCard label="Spec sheet">
      <dl className="mt-4 font-mono text-sm">
        {ROWS.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[7rem_1fr] gap-4 border-b border-dashed border-rule py-3 last:border-0"
          >
            <dt className="text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </WidgetCard>
  );
}
