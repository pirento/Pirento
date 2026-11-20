// Ask Pirento to delete your account, see where the request stands, or withdraw it.
import {useState} from 'react';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';

export function DeleteAccount() {
  const req = useApi('/auth/me/deletion');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const doc = req.data;

  const send = async (method, body) => {
    setError('');
    try {
      await api('/auth/me/deletion', {method, body});
      setOpen(false);
      req.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-8 border-t border-rule pt-6 text-sm">
      {doc?.status === 'requested' ? (
        <p className="text-muted">
          You asked us to delete your account. Our team will act on it.{' '}
          <button onClick={() => send('DELETE')} className="text-ink underline underline-offset-4">
            Withdraw the request
          </button>
        </p>
      ) : (
        <>
          {doc?.status === 'rejected' && (
            <p className="mb-3 text-muted">Your last request was declined: {doc.answer}</p>
          )}
          {!open ? (
            <button onClick={() => setOpen(true)} className="text-muted underline underline-offset-4 hover:text-ink">
              Delete my account
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send('POST', {reason});
              }}
              className="space-y-3"
            >
              <p className="text-muted">
                We delete your profile, Bharat ID, Vault, AI chats and certificates. Orders and payments stay on record,
                without your name, for accounts and tax records. Withdraw any wallet money first.
              </p>
              <TextArea
                label="Why are you leaving? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-4">
                <button type="submit" className="font-medium underline underline-offset-4">
                  Ask to delete
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-muted underline underline-offset-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-2">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
