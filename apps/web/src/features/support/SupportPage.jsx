// Support: open a request and see your requests.
import {useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label, Section} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {useSignedIn} from '../auth/useSignedIn';
import {STATUS} from './status';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

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
