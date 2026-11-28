// The vault's Bharat ID unlock in the browser: `useUnlock()` gives `guard(fn)`, which asks for the PIN when there is no
// live unlock, then runs `fn(headers)` with the x-vault-unlock header. The unlock lives in memory only (never in
// storage) and lasts the ten minutes the server gives it; a "locked" answer clears it and asks once more.
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Lock} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {vaultCopy as copy} from '../../data/site';
import {api} from '../../lib/api/client';

let current = null; // {unlock, until}
const live = () => current && new Date(current.until) > new Date();

const UnlockContext = createContext(null);

export function UnlockProvider({children}) {
  const [asking, setAsking] = useState(null); // {resolve, reject} while the dialog is open
  const ask = useCallback(() => new Promise((resolve, reject) => setAsking({resolve, reject})), []);

  const guard = useCallback(
    async (fn) => {
      if (!live()) current = await ask();
      try {
        return await fn({'x-vault-unlock': current.unlock});
      } catch (err) {
        if (err.code !== 'VAULT_LOCKED') throw err;
        current = await ask();
        return fn({'x-vault-unlock': current.unlock});
      }
    },
    [ask],
  );

  return (
    <UnlockContext.Provider value={guard}>
      {children}
      {asking && (
        <PinDialog
          onDone={(u) => {
            asking.resolve(u);
            setAsking(null);
          }}
          onCancel={() => {
            asking.reject(Object.assign(new Error(copy.unlock.cancelled), {code: 'CANCELLED'}));
            setAsking(null);
          }}
        />
      )}
    </UnlockContext.Provider>
  );
}

export const useUnlock = () => useContext(UnlockContext);

/** Shows an error unless the person simply closed the PIN dialog. */
export const shown = (err) => (err?.code === 'CANCELLED' ? '' : err.message);

/** The PIN dialog, in a portal: the page wrapper carries a transform that would trap a fixed overlay. */
function PinDialog({onDone, onCancel}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  useEffect(() => {
    input.current?.focus();
    const esc = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('keydown', esc);
    };
  }, [onCancel]);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      onDone(await api('/vault/unlock', {method: 'POST', body: {pin}}));
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setBusy(false);
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse/40 p-5" onClick={onCancel}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
        className="w-full max-w-sm rounded-[22px] border border-rule bg-paper p-6 md:p-8"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-stone">
          <Lock aria-hidden className="size-5" />
        </span>
        <h2 id="unlock-title" className="mt-5 text-2xl">
          {copy.unlock.title}
        </h2>
        <p className="mt-2 text-sm text-muted">{copy.unlock.body}</p>
        <div className="mt-6">
          <Field
            ref={input}
            label={copy.unlock.label}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            error={error}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" variant="accent" disabled={busy || pin.length !== 6}>
            {busy ? copy.unlock.checking : copy.unlock.submit}
          </Button>
          <Button type="button" variant="outline" icon={null} onClick={onCancel}>
            {copy.unlock.cancel}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
