// The contact form: anyone can write, signed in or not. It lands in admin → Enquiries, marked with this site.
import {useState} from 'react';
import {Send} from 'lucide-react';
import {Button} from '../ui/Button';
import {Field} from '../ui/Field';
import {TextArea} from '../ui/TextArea';
import {home} from '../../data/site';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {useServicesFor} from '../../lib/prices';

const copy = home.contact.form;

export function ContactForm({product, service}) {
  const {user} = useSession();
  const services = useServicesFor(product?.slug ?? '');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    service: service ?? '',
    message: '',
    website: '',
  });
  const [state, setState] = useState({busy: false, sent: false, error: ''});
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));

  const submit = async (e) => {
    e.preventDefault();
    setState({busy: true, sent: false, error: ''});
    try {
      await api('/support/enquiries', {method: 'POST', body: {...form, product: product?.slug}});
      setState({busy: false, sent: true, error: ''});
    } catch (err) {
      setState({busy: false, sent: false, error: err.message});
    }
  };

  if (state.sent)
    return (
      <p role="status" className="body rounded-[22px] border border-rule p-8 text-ink">
        {copy.sent}
      </p>
    );
  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-5 rounded-[22px] border border-rule p-6 md:p-8"
      aria-label={copy.title}
    >
      <div>
        <p className="text-xl font-medium">{copy.title}</p>
        <p className="mt-2 text-sm text-muted">{copy.intro}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Your name"
          required
          autoComplete="name"
          maxLength={100}
          value={form.name}
          onChange={set('name')}
        />
        <Field
          label="Email"
          required
          type="email"
          autoComplete="email"
          maxLength={200}
          value={form.email}
          onChange={set('email')}
        />
        <Field
          label="Mobile (optional)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={form.phone}
          onChange={set('phone')}
        />
        {services.length > 0 && (
          <label className="block">
            <span className="text-sm font-medium">{copy.service}</span>
            <select
              value={form.service}
              onChange={set('service')}
              className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base focus:border-ink"
            >
              <option value="">Not sure yet</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <TextArea label="Message" rows={4} maxLength={3000} value={form.message} onChange={set('message')} />
      {/* Hidden from people and screen readers; a bot that fills it in is quietly ignored. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={form.website}
        onChange={set('website')}
        className="absolute -left-[9999px] size-px opacity-0"
      />
      {state.error && (
        <p role="alert" className="text-sm">
          ⚠ {state.error}
        </p>
      )}
      <div>
        <Button type="submit" variant="inverse" icon={Send} disabled={state.busy}>
          {state.busy ? 'Sending' : 'Send message'}
        </Button>
      </div>
    </form>
  );
}
