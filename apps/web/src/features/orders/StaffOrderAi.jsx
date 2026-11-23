// Pirento AI for the team on one order (Legal tools 7–11): a summary with next steps, a draft from the order's
// answers (add it as a document to edit), a check of a document before it goes out, details read from a document,
// and a customer summary of the lawyer's call notes (send it as a message). Nothing is sent by itself.
import {useState} from 'react';
import {Sparkles} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {uploadFile} from '../../lib/api/binary';
import {useApi} from '../../lib/api/useApi';
import {AiResult} from '../ai/AiTool';
import {selectCls} from '../learning/Pipeline';

export function StaffOrderAi({order, onChange}) {
  const files = useApi(`/orders/${order._id}/files`);
  const [docType, setDocType] = useState('');
  const [fileId, setFileId] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (kind, body = {}) => {
    setNote('');
    setBusy(true);
    try {
      setResult({kind, value: await api(`/orders/staff/${order._id}/ai/${kind}`, {method: 'POST', body})});
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  /** The draft becomes a text document on the order, for the lawyer to finish and send. */
  const attachDraft = async () => {
    const {title, draft} = result.value;
    try {
      await uploadFile(
        `/orders/${order._id}/files`,
        new File([draft], `${title || 'Draft'} (AI draft).txt`, {type: 'text/plain'}),
      );
      setNote('Added to the documents as a draft.');
      files.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const sendSummary = async () => {
    const {summary, nextSteps} = result.value;
    try {
      const body = `${summary}\n\nNext steps:\n${nextSteps.map((s) => `- ${s}`).join('\n')}`;
      await api(`/orders/staff/${order._id}/message`, {method: 'POST', body: {note: body.slice(0, 2000)}});
      setNote('Sent to the customer.');
      onChange?.();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="eyebrow flex items-center gap-2">
        <Sparkles aria-hidden className="size-3.5" /> Pirento AI
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" icon={null} disabled={busy} onClick={() => run('orderSummary')}>
          Sum up this order
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 grow">
          <Field
            label="Draft a document (e.g. Rent agreement)"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          icon={null}
          disabled={busy || docType.trim().length < 3}
          onClick={() => run('orderDraft', {docType})}
        >
          Draft
        </Button>
      </div>
      {files.data?.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm">
            Document
            <select value={fileId} onChange={(e) => setFileId(e.target.value)} className={selectCls}>
              <option value="">Choose</option>
              {files.data.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            icon={null}
            disabled={busy || !fileId}
            onClick={() => run('deliverableCheck', {fileId})}
          >
            Check before sending
          </Button>
          <Button variant="outline" icon={null} disabled={busy || !fileId} onClick={() => run('extract', {fileId})}>
            Read details
          </Button>
        </div>
      )}
      <div className="space-y-2">
        <TextArea
          label="Call notes (for a summary to the customer)"
          required={false}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          variant="outline"
          icon={null}
          disabled={busy || notes.trim().length < 10}
          onClick={() => run('consultSummary', {notes})}
        >
          Summarise the call
        </Button>
      </div>
      {busy && <p className="text-sm text-muted">Thinking…</p>}
      {result && (
        <div className="space-y-3 rounded-[18px] border border-rule p-5 text-sm" aria-live="polite">
          <AiResult value={result.value} />
          {result.kind === 'orderDraft' && (
            <Button variant="outline" icon={null} onClick={attachDraft}>
              Add as a document to edit
            </Button>
          )}
          {result.kind === 'consultSummary' && (
            <Button variant="accent" icon={null} onClick={sendSummary}>
              Send to the customer
            </Button>
          )}
          <p className="text-xs text-muted">
            A first draft or look by AI: check it before anything goes to the customer.
          </p>
        </div>
      )}
      {note && <p className="text-sm">{note}</p>}
    </div>
  );
}
