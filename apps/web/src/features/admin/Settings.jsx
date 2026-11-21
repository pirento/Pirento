// Site settings: the announcement banner, which products' checkout is paused, and the partner commission rate.
import {useEffect, useState} from 'react';
import {PRODUCTS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';

export function Settings() {
  const current = useApi('/catalog/settings');
  const [form, setForm] = useState(null);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (current.data) setForm(current.data);
  }, [current.data]);
  if (current.error) return <p className="body">⚠ {current.error.message}</p>;
  if (!form) return <p className="body text-muted">Loading…</p>;

  const banner = (k, v) => setForm((f) => ({...f, banner: {...f.banner, [k]: v}}));
  const togglePause = (slug) =>
    setForm((f) => ({
      ...f,
      paused: f.paused.includes(slug) ? f.paused.filter((s) => s !== slug) : [...f.paused, slug],
    }));
  const save = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      setForm(await api('/catalog/staff/settings', {method: 'PATCH', body: form}));
      setNote('Saved. Visitors see it on their next page load.');
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-12">
      <section>
        <Label n={1}>Announcement</Label>
        <label className="mt-6 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.banner.on}
            onChange={(e) => banner('on', e.target.checked)}
            className="size-4"
          />
          Show it on every site
        </label>
        <div className="mt-4 grid gap-4">
          <Field
            label="Text (up to 160 characters)"
            maxLength={160}
            value={form.banner.text}
            onChange={(e) => banner('text', e.target.value)}
          />
          <Field
            label="Link to a page on this site (optional, e.g. /legal)"
            value={form.banner.link}
            onChange={(e) => banner('link', e.target.value)}
          />
        </div>
      </section>
      <section>
        <Label n={2}>Pause checkout</Label>
        <p className="mt-4 text-sm text-muted">
          A paused product still shows its pages and prices but takes no new orders.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRODUCTS.map((p) => {
            const on = form.paused.includes(p.slug);
            return (
              <button
                key={p.slug}
                type="button"
                aria-pressed={on}
                onClick={() => togglePause(p.slug)}
                className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
              >
                {p.name}
                {on && ' · paused'}
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <Label n={3}>Partner commission</Label>
        <p className="mt-4 text-sm text-muted">
          Pirento One partners get this share of each order placed through their link, in their wallet when the order is
          completed. 0 pays nothing. A change applies to orders completed after it.
        </p>
        <div className="mt-4 max-w-48">
          <Field
            label="Percent of the order (0 to 50)"
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={form.commissionPct ?? 0}
            onChange={(e) =>
              setForm((f) => ({...f, commissionPct: e.target.value === '' ? 0 : Number(e.target.value)}))
            }
          />
        </div>
      </section>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="accent">
          Save settings
        </Button>
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </form>
  );
}
