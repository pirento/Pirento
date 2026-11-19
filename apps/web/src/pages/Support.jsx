import {useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {api, useApi, useSession} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Button, Field, Label, Section, Tag} from '../components/ui';
import {PageHero} from './Products';
import {NotFound} from './NotFound';
import {StaffQueue, formatDate, useSignedIn} from './Orders';

const STATUS = {open: 'Waiting on us', answered: 'Replied', closed: 'Closed'};

function TextArea({label, ...props}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label} <span className="text-muted">(required)</span>
      </span>
      <textarea
        required
        rows={5}
        maxLength={4000}
        className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base outline-none focus:border-ink focus-visible:outline-2"
        {...props}
      />
    </label>
  );
}

export function Support() {
  const {redirect, user} = useSignedIn();
  const tickets = useApi(user ? '/support' : null);
  const navigate = useNavigate();
  const [form, setForm] = useState({subject: '', message: '', orderNo: ''});
  const [error, setError] = useState('');
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(tickets.data)]);
  usePageMeta({title: 'Support — Pirento'});
  if (redirect) return redirect;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = {
        subject: form.subject,
        message: form.message,
        ...(form.orderNo ? {orderNo: Number(form.orderNo)} : {}),
      };
      const t = await api('/support', {method: 'POST', body});
      navigate(`/support/${t._id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div ref={ref}>
      <PageHero
        label="Support"
        title="Ask us / anything."
        hl="anything."
        intro="Write to us about an order, a payment or your account. A person on our team replies here."
      />
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-10 lg:grid-cols-12">
          <form onSubmit={submit} noValidate className="space-y-6 lg:col-span-6" data-reveal>
            <Label n={1}>New request</Label>
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
            <Button type="submit" variant="accent">
              Send
            </Button>
          </form>
          <div className="lg:col-span-5 lg:col-start-8" data-reveal>
            <Label n={2}>Your requests</Label>
            {tickets.data?.length === 0 && <p className="body mt-6">Nothing yet.</p>}
            <ul className="mt-4">
              {tickets.data?.map((t) => (
                <li key={t._id}>
                  <Link
                    to={`/support/${t._id}`}
                    className="flex items-center justify-between gap-4 border-b border-rule py-4 hover:border-ink"
                  >
                    <span>
                      <span className="block font-medium">{t.subject}</span>
                      <span className="text-xs text-muted">
                        #{t.ticketNo} · {formatDate(t.updatedAt)}
                      </span>
                    </span>
                    <Tag tone={t.status === 'answered' ? 'accent' : 'rule'}>{STATUS[t.status]}</Tag>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}

export function Ticket() {
  const {id} = useParams();
  const {redirect, user} = useSignedIn();
  const {user: me} = useSession();
  const ticket = useApi(user ? `/support/${id}` : null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  usePageMeta({title: ticket.data ? `#${ticket.data.ticketNo} — Support` : 'Support — Pirento'});
  if (redirect) return redirect;
  if (ticket.error) return <NotFound />;
  const t = ticket.data;
  if (!t) return <div className="min-h-dvh" />;
  const staffView = t.userId !== me?._id;

  const act = async (path, body) => {
    setBusy(true);
    setError('');
    try {
      await api(`/support/${t._id}${path}`, {method: 'POST', body});
      setReply('');
      ticket.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHero label={`Request #${t.ticketNo}${t.orderNo ? ` · order #${t.orderNo}` : ''}`} title={t.subject}>
        <div className="mt-8 flex items-center gap-3">
          <Tag tone={t.status === 'answered' ? 'accent' : 'rule'}>{STATUS[t.status]}</Tag>
          {staffView && <span className="text-sm text-muted">{t.email}</span>}
        </div>
      </PageHero>
      <Section className="pt-0! md:pt-0!">
        <ol className="max-w-3xl space-y-4">
          {t.messages.map((m, i) => (
            <li
              key={i}
              className={`rounded-[18px] border p-6 ${m.from === 'staff' ? 'border-rule bg-stone' : 'border-rule'} ${
                (m.from === 'staff') === staffView ? 'ml-auto max-w-[85%]' : 'max-w-[85%]'
              }`}
            >
              <p className="text-xs text-muted">
                {m.from === 'staff' ? 'Pirento team' : staffView ? t.email : 'You'} · {formatDate(m.at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ol>
        {t.status !== 'closed' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act('/messages', {body: reply});
            }}
            noValidate
            className="mt-10 max-w-3xl space-y-4"
          >
            <TextArea label="Reply" value={reply} onChange={(e) => setReply(e.target.value)} />
            {error && (
              <p role="alert" className="text-sm">
                ⚠ {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="accent" disabled={busy}>
                Send reply
              </Button>
              <Button type="button" variant="outline" icon={null} disabled={busy} onClick={() => act('/close')}>
                Close request
              </Button>
            </div>
          </form>
        )}
      </Section>
    </div>
  );
}

export const TicketQueue = () => (
  <StaffQueue
    path="/support/staff/queue"
    filters={[
      {label: 'Waiting on us', value: 'open'},
      {label: 'Replied', value: 'answered'},
      {label: 'Closed', value: 'closed'},
    ]}
    render={(t) => (
      <Link
        key={t._id}
        to={`/support/${t._id}`}
        className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-5 hover:border-ink"
      >
        <span>
          <span className="block font-medium">
            #{t.ticketNo} · {t.subject}
          </span>
          <span className="text-sm text-muted">
            {t.email} · {formatDate(t.updatedAt)}
          </span>
        </span>
        <Tag>{STATUS[t.status]}</Tag>
      </Link>
    )}
  />
);
