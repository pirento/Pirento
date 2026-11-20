// The documents on one order, for its customer and for the team: add one, download any, remove your own.
import {useRef, useState} from 'react';
import {Download, FileText, Trash2, Upload} from 'lucide-react';
import {api} from '../../lib/api/client';
import {mb, saveFile, uploadFile} from '../../lib/api/binary';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

const MAX_MB = 5;

/** `side` is 'customer' or 'team': who is looking, so "from you" reads right and only your own can be removed. */
export function OrderDocuments({order, side, canAdd = true}) {
  const files = useApi(`/orders/${order._id}/files`);
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const closed = order.status === 'cancelled';

  const add = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Documents can be up to ${MAX_MB} MB.`);
    setBusy(true);
    try {
      await uploadFile(`/orders/${order._id}/files`, file);
      files.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (f) => {
    if (!confirm(`Remove ${f.name}?`)) return;
    try {
      await api(`/orders/${order._id}/files/${f._id}`, {method: 'DELETE'});
      files.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const fromLabel = (f) =>
    f.from === side ? 'From you' : f.from === 'team' ? 'From the Pirento team' : 'From the customer';

  return (
    <div>
      {files.data?.length === 0 && (
        <p className="text-muted">
          {side === 'customer' ? 'No documents yet. Add the papers this work needs.' : 'No documents on this order.'}
        </p>
      )}
      {files.data?.length > 0 && (
        <ul className="border-t border-rule">
          {files.data.map((f) => (
            <li key={f._id} className="flex items-center gap-4 border-b border-rule py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rule">
                <FileText aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{f.name}</span>
                <span className="block text-sm text-muted">
                  {fromLabel(f)} · {mb(f.size)} · {formatDate(f.createdAt)}
                </span>
              </span>
              <button
                onClick={() =>
                  saveFile(`/orders/${order._id}/files/${f._id}`, f.name).catch((e) => setError(e.message))
                }
                aria-label={`Download ${f.name}`}
                className="flex size-10 items-center justify-center rounded-full border border-rule hover:border-ink"
              >
                <Download aria-hidden className="size-4" />
              </button>
              {f.from === side && order.status !== 'completed' && (
                <button
                  onClick={() => remove(f)}
                  aria-label={`Remove ${f.name}`}
                  className="flex size-10 items-center justify-center rounded-full border border-rule hover:border-ink"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canAdd && !closed && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input ref={input} type="file" className="sr-only" onChange={add} aria-label="Choose a document to add" />
          <button
            onClick={() => input.current.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-sm hover:border-ink disabled:opacity-50"
          >
            <Upload aria-hidden className="size-4" /> {busy ? 'Encrypting…' : 'Add a document'}
          </button>
          <span className="text-xs text-muted">Up to {MAX_MB} MB, stored encrypted.</span>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
