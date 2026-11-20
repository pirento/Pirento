// Last step: check everything, consent, submit.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {SectionSummary} from './SectionSummary';
import {api} from '../../lib/api/client';

export function Review({doc, email, onEdit, onSubmitted}) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      onSubmitted(await api('/identity/submit', {method: 'POST', body: {consent}}));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <p className="body">Check everything once. Our team reviews it by hand before issuing your ID.</p>
      <SectionSummary sections={doc?.sections} email={email} kyc={doc?.kyc ?? null} onEdit={onEdit} />
      <label className="flex items-start gap-3 rounded-[18px] border border-rule p-5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 size-4 shrink-0"
        />
        <span className="text-[0.95rem] leading-relaxed text-muted">
          I confirm these details are mine and correct, and I agree that Pirento stores them to issue and verify my
          Bharat ID. I understand Bharat ID is a Pirento identifier, not a government ID.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button onClick={submit} variant="accent" disabled={!consent || busy}>
        {busy ? 'Submitting' : 'Submit application'}
      </Button>
    </div>
  );
}
