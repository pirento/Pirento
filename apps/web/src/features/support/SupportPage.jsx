// /support: the one support desk for every product, the account and the wallet. Opened from a product
// (?product=legal&order=100031), it already knows where you came from and wears that product's colours.
import {useRef, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {PRODUCTS, getProduct} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Field} from '../../components/ui/Field';
import {Heading} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {support as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {STATUS} from './status';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function Support() {
  const {redirect, user} = useSignedIn();
  const [params] = useSearchParams();
  const tickets = useApi(user ? '/support' : null);
  const navigate = useNavigate();
  const from = getProduct(params.get('product') ?? '');
  const [form, setForm] = useState({
    product: from?.slug ?? '',
    subject: '',
    message: '',
    orderNo: (params.get('order') ?? '').replace(/\D/g, ''),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(tickets.data)]);
  usePageMeta({title: `Support — ${from?.name ?? 'Pirento'}`});
  if (redirect) return redirect;

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
  const open = tickets.data?.filter((t) => t.status !== 'closed') ?? [];
  const closed = tickets.data?.filter((t) => t.status === 'closed') ?? [];

  const TicketRow = ({t}) => (
    <li>
      <Link
        to={`/support/${t._id}`}
        className="flex items-center justify-between gap-4 border-b border-rule py-4 hover:border-ink"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{t.subject}</span>
          <span className="text-xs text-muted">
            #{t.ticketNo} · {getProduct(t.product ?? '')?.name ?? copy.general}
            {t.orderNo && ` · order #${t.orderNo}`} · {formatDate(t.updatedAt)}
          </span>
        </span>
        <Tag tone={t.status === 'answered' ? 'accent' : 'rule'}>{STATUS[t.status]}</Tag>
      </Link>
    </li>
  );

  return (
    <div ref={ref} className="space-y-14">
      <header>
        <p className="eyebrow">
          {from ? `${from.name} · ` : ''}
          {copy.title}
        </p>
        <Heading as="h1" text={copy.heading} className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02]" />
        <p className="body mt-4">{copy.intro}</p>
      </header>

      <div className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <DashSection n={1} id="new" label="New request" title="Tell us / what you need.">
            <form onSubmit={submit} noValidate className="space-y-6">
              <label className="block">
                <span className="text-sm font-medium">{copy.about}</span>
                <select
                  value={form.product}
                  onChange={(e) => setForm({...form, product: e.target.value})}
                  className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 outline-none focus:border-ink"
                >
                  <option value="">{copy.general}</option>
                  {PRODUCTS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Subject"
                required
                maxLength={120}
                value={form.subject}
                onChange={(e) => setForm({...form, subject: e.target.value})}
              />
              <Field
                label="Order number, if it is about an order"
                inputMode="numeric"
                value={form.orderNo}
                onChange={(e) => setForm({...form, orderNo: e.target.value.replace(/\D/g, '')})}
              />
              <TextArea
                label="Message"
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
              />
              {error && (
                <p role="alert" className="text-sm">
                  ⚠ {error}
                </p>
              )}
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? 'Sending' : 'Send'}
              </Button>
            </form>
          </DashSection>
        </div>
        <div className="min-w-0 lg:col-span-5">
          <DashSection n={2} id="mine" label="Your requests" title="Every product, / one place.">
            {tickets.data?.length === 0 && <p className="text-muted">Nothing yet.</p>}
            {open.length > 0 && (
              <ul className="border-t border-rule">
                {open.map((t) => (
                  <TicketRow key={t._id} t={t} />
                ))}
              </ul>
            )}
            {closed.length > 0 && (
              <details className="mt-8">
                <summary className="cursor-pointer text-sm text-muted">Closed ({closed.length})</summary>
                <ul className="mt-3 border-t border-rule">
                  {closed.map((t) => (
                    <TicketRow key={t._id} t={t} />
                  ))}
                </ul>
              </details>
            )}
          </DashSection>
        </div>
      </div>
    </div>
  );
}
