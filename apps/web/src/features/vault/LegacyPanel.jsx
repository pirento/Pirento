// Nominee and legacy: how the plan works, turning it on (with consent and the Bharat ID unlock) or off, where it
// stands, the nominee and emergency contact from Bharat ID, what will be released, and the owner's action log.
import {useState} from 'react';
import {Check, ShieldCheck, ShieldAlert} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {shown, useUnlock} from './unlock';

const copy = vaultCopy.legacy;

export function Legacy() {
  const legacy = useApi('/vault/legacy');
  const log = useApi('/vault/log');
  const guard = useUnlock();
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const d = legacy.data;
  const plan = d?.plan;
  const act = async (method) => {
    setError('');
    try {
      await guard((headers) =>
        api('/vault/legacy', {method, headers, ...(method === 'POST' ? {body: {consent: true}} : {})}),
      );
      legacy.reload();
      log.reload();
    } catch (err) {
      setError(shown(err));
    }
  };

  return (
    <div className="space-y-6">
      <ol className="grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {copy.how.map(([title, body], i) => (
          <li key={title} className="bg-paper p-6" data-reveal>
            <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-4 text-lg">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
          <Label n={1}>{copy.status}</Label>
          {d && !plan && (
            <>
              <p className="body mt-4">{copy.none}</p>
              <label className="mt-5 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 size-4"
                />
                {copy.consent}
              </label>
              <div className="mt-5">
                <Button variant="accent" disabled={!agree} onClick={() => act('POST')}>
                  {copy.on}
                </Button>
              </div>
            </>
          )}
          {plan && (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-rule pb-3">
                <dt className="text-muted">{copy.status}</dt>
                <dd className="text-right font-medium">{copy.stages[plan.stage]}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-rule pb-3">
                <dt className="text-muted">{copy.lastSeen}</dt>
                <dd>{formatDate(plan.lastSeenAt)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-rule pb-3">
                <dt className="text-muted">{copy.reminders}</dt>
                <dd className="tabular-nums">{plan.reminders}</dd>
              </div>
            </dl>
          )}
          {d && <p className="mt-5 text-sm">{copy.releasing(d.releasing)}</p>}
          {plan && ['active', 'reminding', 'call-nominee', 'nominee-reached'].includes(plan.stage) && (
            <div className="mt-5">
              <Button variant="outline" icon={null} onClick={() => act('DELETE')}>
                {copy.off}
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm">
              ⚠ {error}
            </p>
          )}
        </section>

        <section className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
          <Label n={2}>{copy.nominee}</Label>
          {d && (
            <dl className="mt-4 space-y-4 text-sm">
              {[
                [copy.nominee, d.contacts.nominee, d.contacts.nominee.relation],
                [copy.emergency, d.contacts.emergency],
              ].map(([label, c, extra]) => (
                <div key={label} className="border-b border-rule pb-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-1 font-medium">
                    {c.name || '—'}
                    {extra && <span className="text-muted"> · {extra}</span>}
                  </dd>
                  <dd className="text-muted tabular-nums">{c.mobile}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted">{copy.fromId}</p>
        </section>
      </div>

      <section className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
        <Label n={3}>{copy.log}</Label>
        {log.data && (
          <p className="mt-4 flex items-center gap-2 text-sm">
            {log.data.intact ? (
              <ShieldCheck aria-hidden className="size-4" />
            ) : (
              <ShieldAlert aria-hidden className="size-4" />
            )}
            {log.data.intact ? copy.intact : copy.broken}
          </p>
        )}
        <ul className="mt-4 max-h-96 overflow-y-auto text-sm">
          {log.data?.items.map((e) => (
            <li key={e.hash} className="flex items-start justify-between gap-4 border-b border-rule py-3">
              <span className="min-w-0">
                <span className="font-medium">{e.action}</span>
                {e.target && <span className="block break-words text-muted">{e.target}</span>}
              </span>
              <span className="shrink-0 text-right text-xs text-muted">
                {formatDate(e.at)} · {e.by}
                {e.pin && <Check aria-label="Confirmed with Bharat ID PIN" className="ml-1 inline size-3" />}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-muted">{copy.legal}</p>
      </section>
    </div>
  );
}
