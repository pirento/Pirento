// One service in admin (/admin/services/<slug>, or /new?product=legal): a service or package made in admin, and the
// questions any service asks before and after payment. Superadmins only; the catalog service checks it too.
import {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {
  FIXED_QUESTION_IDS,
  LEGAL_CATALOGUE,
  basePrice,
  categoriesOf,
  checkoutQuestions,
  getProduct,
} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {inr} from '../../lib/format';
import {useCatalogEdits, useService, useServicesFor} from '../../lib/prices';
import {QuestionsEditor, toQuestions, toRows} from './QuestionsEditor';

const EMPTY = {name: '', category: '', description: '', deliveryTime: '', model: 'fixed', price: '', includes: ''};

/** Name, category, words, price: for a new service, or one made in admin. */
function DetailsForm({product, service, onSaved}) {
  const navigate = useNavigate();
  const siblings = useServicesFor(product.slug);
  const {edits} = useCatalogEdits();
  // The price it was made with; a later "Set" in the price list sits on top of it.
  const [form, setForm] = useState(() =>
    service
      ? {...EMPTY, ...service, price: String(basePrice(service.slug, edits)), includes: service.includes.join('\n')}
      : EMPTY,
  );
  const [note, setNote] = useState('');
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const categories = categoriesOf(siblings, product.slug === 'legal' ? LEGAL_CATALOGUE.map((c) => c.title) : []);

  const save = async (e) => {
    e.preventDefault();
    setNote('');
    const body = {
      name: form.name,
      category: form.category,
      description: form.description,
      deliveryTime: form.deliveryTime,
      model: form.model,
      price: Number(form.price),
      includes: form.includes
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    };
    try {
      const saved = service
        ? await api(`/catalog/staff/services/${service.slug}`, {method: 'PATCH', body})
        : await api('/catalog/staff/services', {method: 'POST', body: {...body, product: product.slug}});
      onSaved();
      if (service) setNote('Saved. The website shows it at once.');
      else navigate(`/admin/services/${saved.slug}`, {replace: true});
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const remove = async () => {
    if (!confirm(`Delete ${service.name}? Orders already placed keep their record; nobody can buy it any more.`))
      return;
    try {
      await api(`/catalog/staff/services/${service.slug}`, {method: 'DELETE'});
      onSaved();
      navigate(`/admin/services?product=${product.slug}`, {replace: true});
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-5">
      <Field label="Name" required maxLength={100} value={form.name} onChange={set('name')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Category (pick one or type a new one, e.g. Packages)"
          required
          maxLength={80}
          list="service-categories"
          value={form.category}
          onChange={set('category')}
        />
        <datalist id="service-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Field
          label="Price in rupees"
          required
          type="number"
          min="1"
          inputMode="numeric"
          value={form.price}
          onChange={set('price')}
        />
        <Field
          label="Delivery time (optional, e.g. 7-10 days)"
          maxLength={60}
          value={form.deliveryTime}
          onChange={set('deliveryTime')}
        />
        <label className="block">
          <span className="text-sm font-medium">How it is sold</span>
          <select
            value={form.model}
            onChange={set('model')}
            className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base focus:border-ink"
          >
            <option value="fixed">Fixed price for the whole job</option>
            <option value="consult">Paid consultation first, quote after</option>
          </select>
        </label>
      </div>
      <TextArea
        label="What it is, in a sentence or two"
        required={false}
        rows={3}
        maxLength={600}
        value={form.description}
        onChange={set('description')}
      />
      <TextArea
        label="What is included, one per line (a package lists its services here)"
        required={false}
        rows={5}
        maxLength={3000}
        value={form.includes}
        onChange={set('includes')}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" icon={null}>
          {service ? 'Save changes' : 'Add to the website'}
        </Button>
        {service && (
          <Button type="button" variant="outline" icon={null} onClick={remove}>
            Delete
          </Button>
        )}
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </form>
  );
}

/** The questions before payment (after phone, and address for a gift) and after payment. */
function QuestionsForm({service, onSaved, n}) {
  // The product's standard questions, without the ones checkout always asks.
  const defaults = checkoutQuestions(service.product, service.slug, null).filter(
    (q) => !FIXED_QUESTION_IDS.includes(q.id),
  );
  const fresh = () => ({
    before: toRows(service.questions ?? defaults),
    after: toRows(service.afterQuestions),
  });
  const [rows, setRows] = useState(fresh);
  const [note, setNote] = useState('');
  useEffect(() => {
    setRows(fresh());
  }, [service.slug, service.questions, service.afterQuestions]);

  const send = async (questions, afterQuestions, done) => {
    setNote('');
    try {
      await api(`/catalog/staff/services/${service.slug}/questions`, {
        method: 'PUT',
        body: {questions, afterQuestions},
      });
      onSaved();
      setNote(done);
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const save = (e) => {
    e.preventDefault();
    const after = toQuestions(rows.after);
    send(
      toQuestions(rows.before),
      after.length ? after : null,
      'Saved. New orders ask these; placed orders keep theirs.',
    );
  };
  const reset = () => {
    if (!confirm('Go back to the standard questions before payment?')) return;
    send(null, service.afterQuestions ?? null, 'The standard questions are back.');
  };

  return (
    <form onSubmit={save} className="space-y-12">
      <section>
        <Label n={n}>Before payment</Label>
        <p className="mt-4 max-w-2xl text-sm text-muted">
          Asked at checkout, after the phone number{service.product === 'giftox' && ' and the delivery address'}, which
          are always asked. {service.questions ? 'This service has its own set.' : 'These are the standard questions.'}
        </p>
        <div className="mt-6">
          <QuestionsEditor name="Question" rows={rows.before} onChange={(before) => setRows((r) => ({...r, before}))} />
        </div>
      </section>
      <section>
        <Label n={n + 1}>After payment</Label>
        <p className="mt-4 max-w-2xl text-sm text-muted">
          Once paid, the customer sees these on their order and answers them there, say the details your team needs to
          start. The team sees the answers on the order.
        </p>
        <div className="mt-6">
          <QuestionsEditor name="Question" rows={rows.after} onChange={(after) => setRows((r) => ({...r, after}))} />
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" icon={null}>
          Save questions
        </Button>
        {service.questions && (
          <Button type="button" variant="outline" icon={null} onClick={reset}>
            Use the standard questions
          </Button>
        )}
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </form>
  );
}

export function ServiceEditor({slug}) {
  const [params] = useSearchParams();
  const {reload} = useCatalogEdits();
  const service = useService(slug);
  const creating = slug === 'new';
  const product = getProduct(creating ? (params.get('product') ?? 'legal') : (service?.product ?? ''));
  const back = (
    <Link
      to={`/admin/services${product ? `?product=${product.slug}` : ''}`}
      className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
    >
      <ArrowLeft aria-hidden className="size-4" /> All services
    </Link>
  );
  if (!product || (!creating && !service))
    return (
      <div className="space-y-6">
        {back}
        <p className="body">No such service.</p>
      </div>
    );

  return (
    <div className="max-w-3xl space-y-12">
      <div>
        {back}
        <h2 className="mt-6 text-3xl">{creating ? `New ${product.short} service or package` : service.name}</h2>
        {!creating && (
          <p className="mt-2 text-sm text-muted">
            {product.name} · {service.category} · {service.price ? inr(service.price) : 'Off sale or on quote'} ·{' '}
            <Link to={`/services/${service.slug}`} className="underline underline-offset-4">
              See it on the website
            </Link>
          </p>
        )}
      </div>
      {(creating || service.custom) && (
        <section>
          <Label n={1}>The service</Label>
          <div className="mt-6">
            <DetailsForm
              key={service?.slug ?? 'new'}
              product={product}
              service={creating ? null : service}
              onSaved={reload}
            />
          </div>
        </section>
      )}
      {creating ? (
        <p className="text-sm text-muted">Once it is added, set the questions it asks before and after payment here.</p>
      ) : (
        <QuestionsForm service={service} onSaved={reload} n={service.custom ? 2 : 1} />
      )}
    </div>
  );
}
