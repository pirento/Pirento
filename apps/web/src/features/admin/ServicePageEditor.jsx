// Admin → Services & prices → one service: its packages and every section of its page. Superadmins only.
import {useEffect, useState} from 'react';
import {Plus, Trash2} from 'lucide-react';
import {ART_SCENES, ART_SECTIONS, packagesOf, slugify} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {useCatalogEdits} from '../../lib/prices';
import {servicePageCopy} from '../../data/site';
import {selectCls} from '../learning/Pipeline';
import {ServiceArt} from '../legal/ServiceArt';

const lines = (text) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function Note({note}) {
  return note ? (
    <p role="status" className="text-sm">
      {note}
    </p>
  ) : null;
}

function IconButton({label, onClick, children}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full border border-rule hover:border-ink"
    >
      {children}
    </button>
  );
}

const toRow = (p) => ({
  ...p,
  price: String(p.price),
  strike: p.strike ? String(p.strike) : '',
  includes: (p.includes ?? []).join('\n'),
});

/** The packages the service sells (1 to 4), one marked recommended. */
export function PackagesForm({service, onSaved, n}) {
  const {edits} = useCatalogEdits();
  const fresh = () => packagesOf(service).map(toRow);
  const [rows, setRows] = useState(fresh);
  const [note, setNote] = useState('');
  useEffect(() => {
    setRows(fresh());
  }, [service.slug, service.packages, service.price]);

  const set = (i, k, v) => setRows((rs) => rs.map((r, j) => (j === i ? {...r, [k]: v} : r)));
  const recommend = (i) => setRows((rs) => rs.map((r, j) => ({...r, recommended: j === i ? !r.recommended : false})));

  const send = async (packages, done) => {
    setNote('');
    try {
      await api(`/catalog/staff/services/${service.slug}/packages`, {method: 'PUT', body: {packages}});
      onSaved();
      setNote(done);
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const save = (e) => {
    e.preventDefault();
    send(
      rows.map((r) => ({
        // The id stays once made, so orders and links keep pointing at the same package.
        id: r.id || slugify(r.name) || 'package',
        name: r.name,
        price: Number(r.price),
        strike: r.strike ? Number(r.strike) : null,
        deliveryTime: r.deliveryTime ?? '',
        includes: lines(r.includes),
        recommended: Boolean(r.recommended),
      })),
      'Saved. The page and checkout show these at once; placed orders keep theirs.',
    );
  };
  const reset = () => {
    if (confirm('Go back to the packages Pirento ships with?')) send(null, 'The standard packages are back.');
  };

  if (!service.price) {
    return (
      <section>
        <Label n={n}>Packages</Label>
        <p className="mt-4 text-sm text-muted">This service is off sale or on quote. Put it on sale to set packages.</p>
      </section>
    );
  }

  return (
    <form onSubmit={save}>
      <Label n={n}>Packages</Label>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Up to four. The page lists them side by side and checkout charges the one picked; the cheapest is the “from”
        price. A struck price shows an earlier price crossed out.
      </p>
      <div className="mt-6 space-y-4">
        {rows.map((r, i) => (
          <fieldset key={i} className="space-y-4 rounded-[18px] border border-rule p-5">
            <div className="flex items-center justify-between gap-3">
              <legend className="font-medium">Package {i + 1}</legend>
              {rows.length > 1 && (
                <IconButton
                  label={`Remove package ${i + 1}`}
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                >
                  <Trash2 aria-hidden className="size-4" />
                </IconButton>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                required
                maxLength={40}
                value={r.name}
                onChange={(e) => set(i, 'name', e.target.value)}
              />
              <Field
                label="Delivery time (e.g. 7-10 days)"
                maxLength={60}
                value={r.deliveryTime ?? ''}
                onChange={(e) => set(i, 'deliveryTime', e.target.value)}
              />
              <Field
                label="Price in rupees"
                required
                type="number"
                min="1"
                inputMode="numeric"
                value={r.price}
                onChange={(e) => set(i, 'price', e.target.value)}
              />
              <Field
                label="Struck price (optional)"
                type="number"
                min="1"
                inputMode="numeric"
                value={r.strike}
                onChange={(e) => set(i, 'strike', e.target.value)}
              />
            </div>
            <TextArea
              label="What it includes, one per line"
              required={false}
              rows={4}
              value={r.includes}
              onChange={(e) => set(i, 'includes', e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={Boolean(r.recommended)}
                onChange={() => recommend(i)}
              />
              Mark as recommended
            </label>
          </fieldset>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {rows.length < 4 && (
          <Button
            type="button"
            variant="outline"
            icon={Plus}
            onClick={() =>
              setRows((rs) => [...rs, {id: '', name: '', price: '', strike: '', deliveryTime: '', includes: ''}])
            }
          >
            Add a package
          </Button>
        )}
        <Button type="submit" icon={null}>
          Save packages
        </Button>
        {edits[service.slug]?.packages && (
          <Button type="button" variant="outline" icon={null} onClick={reset}>
            Use the standard packages
          </Button>
        )}
        <Note note={note} />
      </div>
    </form>
  );
}

/** Rows of two fields (a step's title and words, a question and its answer), added and removed freely. */
function Pairs({label, rows, onChange, keys, labels}) {
  const [a, b] = keys;
  const set = (i, k, v) => onChange(rows.map((r, j) => (j === i ? {...r, [k]: v} : r)));
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      {rows.map((r, i) => (
        <div key={i} className="grid gap-3 rounded-[18px] border border-rule p-4 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-3">
            <Field label={labels[0]} value={r[a]} maxLength={200} onChange={(e) => set(i, a, e.target.value)} />
            <TextArea
              label={labels[1]}
              required={false}
              rows={2}
              value={r[b]}
              onChange={(e) => set(i, b, e.target.value)}
            />
          </div>
          <IconButton
            label={`Remove ${labels[0].toLowerCase()} ${i + 1}`}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            <Trash2 aria-hidden className="size-4" />
          </IconButton>
        </div>
      ))}
      <Button type="button" variant="outline" icon={Plus} onClick={() => onChange([...rows, {[a]: '', [b]: ''}])}>
        Add
      </Button>
    </fieldset>
  );
}

const LISTS = [
  ['whoFor', 'Who it is for, one per line'],
  ['included', 'What every package includes, one per line'],
  ['notIncluded', 'Not included, confirmed separately, one per line'],
  ['documents', 'Documents needed, one per line'],
  ['timeline', 'What affects the timeline, one per line'],
  ['deliverables', 'What the customer receives at the end, one per line'],
  ['mistakes', 'Common mistakes to avoid, one per line'],
];

/** Every section of the service page. An empty section is hidden on the website. */
/** One picture per section: a scene the site draws, or the team's own https image, and a caption. */
function ArtRows({art, onChange}) {
  const set = (section, key, value) => {
    const row = {...art[section], [key]: value || undefined};
    const next = {...art, [section]: row};
    if (!row.scene && !row.caption && !row.image) delete next[section];
    onChange(next);
  };
  return (
    <fieldset className="space-y-6">
      <legend className="text-sm font-medium">Pictures on the page</legend>
      <p className="max-w-2xl text-sm text-muted">
        Each section shows a drawing that explains the step. Pick another drawing, write your own caption, or use your
        own image (an https:// link). Leave a row empty to keep the standard one.
      </p>
      {Object.keys(ART_SECTIONS).map((section) => {
        const row = art[section] ?? {};
        return (
          <div key={section} className="grid gap-4 rounded-[18px] border border-rule p-4 md:grid-cols-[12rem_1fr]">
            <ServiceArt page={{art}} section={section} />
            <div className="space-y-3">
              <p className="font-medium">{servicePageCopy.guide.chips[section]}</p>
              <label className="block text-sm">
                <span className="sr-only">Drawing for {section}</span>
                <select
                  value={row.scene ?? ''}
                  onChange={(e) => set(section, 'scene', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Standard drawing ({ART_SECTIONS[section]})</option>
                  {ART_SCENES.map((scene) => (
                    <option key={scene} value={scene}>
                      {scene}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Caption"
                maxLength={160}
                placeholder={servicePageCopy.art[section]}
                value={row.caption ?? ''}
                onChange={(e) => set(section, 'caption', e.target.value)}
              />
              <Field
                label="Your own image (https:// link, optional)"
                type="url"
                maxLength={500}
                placeholder="https://"
                value={row.image ?? ''}
                onChange={(e) => set(section, 'image', e.target.value.trim())}
              />
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

export function PageForm({service, n}) {
  const res = useApi(`/catalog/staff/services/${service.slug}/page`);
  const [form, setForm] = useState(null);
  const [note, setNote] = useState('');
  useEffect(() => {
    const p = res.data?.page;
    if (p) setForm({...p, ...Object.fromEntries(LISTS.map(([k]) => [k, p[k].join('\n')]))});
  }, [res.data]);
  if (!form) return null;
  const set = (k) => (v) => setForm((f) => ({...f, [k]: v}));
  const clean = (rows, keys) => rows.filter((r) => keys.every((k) => r[k]?.trim())).map((r) => ({...r}));

  const send = async (page, done) => {
    setNote('');
    try {
      await api(`/catalog/staff/services/${service.slug}/page`, {method: 'PUT', body: {page}});
      res.reload();
      setNote(done);
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const save = (e) => {
    e.preventDefault();
    send(
      {
        intro: form.intro.trim(),
        ...Object.fromEntries(LISTS.map(([k]) => [k, lines(form[k])])),
        steps: clean(form.steps, ['title']),
        costs: clean(form.costs, ['title']),
        benefits: clean(form.benefits, ['title']),
        faqs: clean(form.faqs, ['q', 'a']),
        // Sent with every save, so editing the words never drops the pictures.
        art: form.art ?? {},
      },
      'Saved. The service page shows it at once.',
    );
  };
  const reset = () => {
    if (confirm('Go back to the page Pirento ships with?')) send(null, 'The standard page is back.');
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Label n={n}>The page</Label>
      <p className="max-w-2xl text-sm text-muted">
        Every section of the service’s page. Leave a section empty to hide it. Write only what is true for this service.
      </p>
      <TextArea
        label="Overview (a new line starts a new paragraph)"
        required={false}
        rows={5}
        maxLength={2000}
        value={form.intro}
        onChange={(e) => set('intro')(e.target.value)}
      />
      {LISTS.map(([k, label]) => (
        <TextArea
          key={k}
          label={label}
          required={false}
          rows={4}
          value={form[k]}
          onChange={(e) => set(k)(e.target.value)}
        />
      ))}
      <Pairs
        label="How it works (steps)"
        rows={form.steps}
        onChange={set('steps')}
        keys={['title', 'body']}
        labels={['Step', 'What happens']}
      />
      <Pairs
        label="What the cost is made of"
        rows={form.costs}
        onChange={set('costs')}
        keys={['title', 'body']}
        labels={['Cost part', 'What to know']}
      />
      <Pairs
        label="Benefits"
        rows={form.benefits}
        onChange={set('benefits')}
        keys={['title', 'body']}
        labels={['Benefit', 'Why it matters']}
      />
      <Pairs
        label="Questions and answers"
        rows={form.faqs}
        onChange={set('faqs')}
        keys={['q', 'a']}
        labels={['Question', 'Answer']}
      />
      <ArtRows art={form.art ?? {}} onChange={set('art')} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" icon={null}>
          Save the page
        </Button>
        {res.data?.edited.length > 0 && (
          <Button type="button" variant="outline" icon={null} onClick={reset}>
            Use the standard page
          </Button>
        )}
        <Note note={note} />
      </div>
    </form>
  );
}
