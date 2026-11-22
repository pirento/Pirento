// Last step: check everything once and submit. Signing the declaration on Digio was the consent.
import {useState} from 'react';
import {declarationSigned, kycDone} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {SectionSummary} from './SectionSummary';
import {api} from '../../lib/api/client';

export function Review({doc, email, onEdit, onSubmitted}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = kycDone(doc) && declarationSigned(doc);
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      onSubmitted(await api('/identity/submit', {method: 'POST'}));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <p className="body">
        Check everything once. Our team reviews it by hand before issuing your ID. Bharat ID is a Pirento identifier,
        not a government ID.
      </p>
      {declarationSigned(doc) && (
        <p className="text-sm text-muted">
          If you change a step now, you sign the declaration again before you submit.
        </p>
      )}
      <SectionSummary doc={doc} email={email} onEdit={onEdit} />
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button onClick={submit} variant="accent" disabled={!ready || busy}>
        {busy ? 'Submitting' : 'Submit application'}
      </Button>
    </div>
  );
}
