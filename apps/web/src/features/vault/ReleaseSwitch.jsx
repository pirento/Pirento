// Whether one vault item (a record, a password or a document) goes to the nominee. Changing it needs the unlock and
// is logged, like every other action.
import {useState} from 'react';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {shown, useUnlock} from './unlock';

export function ReleaseSwitch({type, item, onChange}) {
  const guard = useUnlock();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const on = Boolean(item.release);
  const flip = async () => {
    setError('');
    setBusy(true);
    try {
      await guard((headers) =>
        api(`/vault/${type}/${item._id}/release`, {method: 'PATCH', body: {release: !on}, headers}),
      );
      onChange?.();
    } catch (err) {
      setError(shown(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={busy}
        onClick={flip}
        className={`relative h-5 w-9 rounded-full border transition-colors ${on ? 'border-accent bg-accent' : 'border-rule bg-stone'}`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 size-3.5 rounded-full bg-paper transition-[left] ${on ? 'left-[1.1rem]' : 'left-0.5'}`}
        />
        <span className="sr-only">{vaultCopy.records.release}</span>
      </button>
      <span className={on ? 'text-ink' : 'text-muted'}>{vaultCopy.records.release}</span>
      {error && <span role="alert">⚠ {error}</span>}
    </span>
  );
}
