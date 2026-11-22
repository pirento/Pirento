// The 6-digit Bharat ID PIN (used with the date of birth to sign in and for checks): a step of the application
// (with `onContinue`), and the PIN section of the dashboard.
import {useState} from 'react';
import {pinProblem} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {PasswordField} from '../auth/PasswordField';
import {api} from '../../lib/api/client';

const digits = (v) => v.replace(/\D/g, '').slice(0, 6);

export function PinSettings({doc, onChange, onContinue, onBack}) {
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [current, setCurrent] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  if (!doc) return <p className="body text-muted">Start your Bharat ID application first.</p>;

  const save = async (e) => {
    e.preventDefault();
    setNote('');
    setError(pinProblem(pin) || (pin !== again ? 'The two PINs do not match' : ''));
    if (pinProblem(pin) || pin !== again) return;
    try {
      onChange(await api('/identity/pin', {method: 'PUT', body: {pin, ...(doc.pinSet && {currentPin: current})}}));
      setPin('');
      setAgain('');
      setCurrent('');
      if (onContinue) return onContinue();
      setNote('Saved. Use it with your date of birth to sign in and when a business checks your Bharat ID.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={save} noValidate className="max-w-md space-y-5">
      <p className="body">
        {doc.pinSet
          ? 'Your PIN is set. To change it, enter the current one first.'
          : 'Choose 6 digits only you know. Never share it: Pirento and businesses never ask for it outside Pirento’s own pages.'}
      </p>
      {doc.pinSet && (
        <PasswordField
          label="Current PIN"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={current}
          onChange={(e) => setCurrent(digits(e.target.value))}
        />
      )}
      <PasswordField
        label="New 6-digit PIN"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={pin}
        onChange={(e) => setPin(digits(e.target.value))}
      />
      <PasswordField
        label="New PIN again"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={again}
        onChange={(e) => setAgain(digits(e.target.value))}
      />
      {(error || note) && (
        <p role={error ? 'alert' : 'status'} className="text-sm">
          {error ? `⚠ ${error}` : note}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent">
          {doc.pinSet ? 'Change PIN' : onContinue ? 'Set PIN and continue' : 'Set PIN'}
        </Button>
        {onContinue && doc.pinSet && (
          <Button type="button" variant="outline" onClick={onContinue}>
            Keep this PIN and continue
          </Button>
        )}
        {onBack && (
          <Button type="button" variant="outline" icon={null} onClick={onBack}>
            Back
          </Button>
        )}
      </div>
      <p className="text-sm text-muted">Five wrong tries in a row lock the PIN for 15 minutes.</p>
    </form>
  );
}
