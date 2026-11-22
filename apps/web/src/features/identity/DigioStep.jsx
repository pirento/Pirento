// Wizard steps done on Digio: the video KYC, then the Aadhaar eSign (and e-stamp) of the declaration.
import {useEffect, useState} from 'react';
import {declarationSigned, kycDone, kycFailed} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {bharatIdVerify as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {DeclarationLink} from './DeclarationLink';
import {loadDigio, openDigio} from './digio';

export function DigioStep({kind, doc, onChange, onSaved, onBack}) {
  const config = useApi('/identity/digio/config');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const words = copy[kind];
  const done = kind === 'kyc' ? kycDone(doc) : declarationSigned(doc);
  const failed = kind === 'kyc' && kycFailed(doc);
  const started = kind === 'kyc' ? doc?.digio?.kycId : doc?.digio?.docId;

  // The SDK must be ready before the click, so its window opens inside the click.
  useEffect(() => {
    if (config.data?.on) loadDigio(config.data.sdk).catch((err) => setError(err.message));
  }, [config.data]);

  const refresh = async (closedEarly) => {
    const fresh = await api(`/identity/${kind}/refresh`, {method: 'POST'});
    onChange(fresh);
    const ok = kind === 'kyc' ? kycDone(fresh) : declarationSigned(fresh);
    setNote(ok ? '' : closedEarly ? words.closed : copy.waiting);
    return ok;
  };

  const start = async () => {
    setError('');
    setNote('');
    setBusy(true);
    try {
      const result = await openDigio({
        environment: config.data.environment,
        start: async () => {
          const r = await api(`/identity/${kind}/start`, {method: 'POST'});
          return {id: r.kycId ?? r.docId, identifier: r.identifier, token: r.token};
        },
      });
      await refresh(Boolean(result.error_code));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    setError('');
    setBusy(true);
    try {
      await refresh(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (config.loading) return null;
  return (
    <div className="max-w-2xl space-y-6">
      <p className="body">{kind === 'sign' ? words.intro(config.data?.stamped) : words.intro}</p>
      {!config.data?.on ? (
        <p role="status" className="rounded-[18px] border border-rule p-5 text-sm">
          {copy.off}
        </p>
      ) : done ? (
        <div role="status" className="space-y-3 rounded-[18px] border border-accent p-5">
          <p className="font-medium">{words.done}</p>
          {kind === 'sign' && <DeclarationLink />}
        </div>
      ) : (
        failed && (
          <p role="status" className="rounded-[18px] border border-rule p-5 text-sm">
            {words.failed}
          </p>
        )
      )}
      {(note || error) && (
        <p role={error ? 'alert' : 'status'} className="text-sm">
          {error ? `⚠ ${error}` : note}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {onBack && (
          <Button onClick={onBack} variant="outline" icon={null}>
            Back
          </Button>
        )}
        {done ? (
          <Button onClick={() => onSaved()} variant="accent">
            {copy.continue}
          </Button>
        ) : (
          config.data?.on && (
            <>
              <Button onClick={start} variant="accent" disabled={busy}>
                {busy ? copy.busy : failed ? words.again : started ? words.resume : words.start}
              </Button>
              {started && !failed && (
                <button type="button" onClick={check} disabled={busy} className="text-sm underline underline-offset-4">
                  {copy.check}
                </button>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
