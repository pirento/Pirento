// A new support request: quick topics fill the form, then product, priority, subject, order and message.
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PRODUCTS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {support as copy} from '../../data/site';
import {api} from '../../lib/api/client';

const select = 'mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 outline-none focus:border-ink';

export function NewTicket({product, orderNo}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({product, priority: 'medium', subject: '', message: '', orderNo});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({...form, [k]: e.target.value});

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const t = await api('/support', {
        method: 'POST',
        body: {
          subject: form.subject,
          message: form.message,
          priority: form.priority,
          ...(form.product ? {product: form.product} : {}),
          ...(form.orderNo ? {orderNo: Number(form.orderNo)} : {}),
        },
      });
      navigate(`/support/${t._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <ul className="grid gap-3 sm:grid-cols-3">
        {copy.topics.map((t) => (
          <li key={t.title}>
            <button
              type="button"
              onClick={() => setForm({...form, subject: t.subject, priority: t.priority})}
              className="flex h-full w-full flex-col rounded-[18px] border border-rule p-5 text-left transition-colors hover:border-ink"
            >
              <span className="font-medium">{t.title}</span>
              <span className="mt-1 text-sm text-muted">{t.body}</span>
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} noValidate className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">{copy.about}</span>
            <select value={form.product} onChange={set('product')} className={select}>
              <option value="">{copy.general}</option>
              {PRODUCTS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Priority</span>
            <select value={form.priority} onChange={set('priority')} className={select}>
              {copy.priorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Field label="Subject" required maxLength={120} value={form.subject} onChange={set('subject')} />
        <Field
          label="Order number, if it is about an order"
          inputMode="numeric"
          value={form.orderNo}
          onChange={(e) => setForm({...form, orderNo: e.target.value.replace(/\D/g, '')})}
        />
        <TextArea label="Message" value={form.message} onChange={set('message')} />
        {error && (
          <p role="alert" className="text-sm">
            ⚠ {error}
          </p>
        )}
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Sending' : 'Send request'}
        </Button>
      </form>
    </div>
  );
}
