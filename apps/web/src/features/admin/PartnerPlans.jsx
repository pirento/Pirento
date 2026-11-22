// Pirento One plans in admin: finance sees them; a superadmin makes a free or paid plan and changes or retires it.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

const BLANK = {
  name: '',
  price: 0,
  months: 0,
  commissionPct: 0,
  features: '',
  recommended: false,
  active: true,
  sort: 0,
};
// The form keeps rupees and one feature per line; the server stores paise and a list.
const toForm = (p) => ({...p, price: p.price / 100, features: p.features.join('\n')});
const toBody = (f) => ({
  name: f.name,
  price: Number(f.price) || 0,
  months: Number(f.months) || 0,
  commissionPct: Number(f.commissionPct) || 0,
  features: f.features
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean),
  recommended: f.recommended,
  active: f.active,
  sort: Number(f.sort) || 0,
});

function PlanForm({plan, onDone}) {
  const [f, setF] = useState(plan ? toForm(plan) : BLANK);
  const [error, setError] = useState('');
  const set = (k) => (e) =>
    setF((x) => ({...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value}));
  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(plan ? `/orders/staff/partner-plans/${plan._id}` : '/orders/staff/partner-plans', {
        method: plan ? 'PATCH' : 'POST',
        body: toBody(f),
      });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={save} className="space-y-4 rounded-[18px] border border-rule p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" required maxLength={40} value={f.name} onChange={set('name')} />
        <Field label="Price in ₹ (0 = free)" type="number" min={0} value={f.price} onChange={set('price')} />
        <Field label="Months (0 for free)" type="number" min={0} max={36} value={f.months} onChange={set('months')} />
        <Field
          label="Commission %"
          type="number"
          min={0}
          max={50}
          step={0.5}
          value={f.commissionPct}
          onChange={set('commissionPct')}
        />
      </div>
      <TextArea
        label="What it includes (one per line, up to 8)"
        required={false}
        rows={4}
        value={f.features}
        onChange={set('features')}
      />
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={f.recommended} onChange={set('recommended')} />
          Show as recommended
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={f.active} onChange={set('active')} />
          On offer
        </label>
        <div className="w-28">
          <Field label="Order" type="number" min={0} max={99} value={f.sort} onChange={set('sort')} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="accent">
          {plan ? 'Save plan' : 'Add plan'}
        </Button>
        <button type="button" onClick={() => onDone(false)} className="text-sm underline">
          Cancel
        </button>
        {error && (
          <p role="alert" className="text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
    </form>
  );
}

export function PartnerPlans() {
  const plans = useApi('/orders/staff/partner-plans');
  const {user} = useSession();
  const canEdit = user?.role === 'superadmin'; // ACCESS.catalog
  const [editing, setEditing] = useState(null); // a plan, 'new', or null
  const done = () => {
    setEditing(null);
    plans.reload();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl">Plans</h2>
        {canEdit && editing !== 'new' && (
          <Button variant="outline" onClick={() => setEditing('new')}>
            New plan
          </Button>
        )}
      </div>
      <p className="text-sm text-muted">
        Partners start on the free plan (price 0). A paid plan is bought from the wallet and keeps the rate it was
        bought at until it ends. A change applies to purchases from now on; retire a plan instead of deleting it.
      </p>
      {editing === 'new' && <PlanForm onDone={done} />}
      {plans.error && <p className="body">⚠ {plans.error.message}</p>}
      {plans.data?.length === 0 && (
        <p className="body text-muted">No plans yet. Partners earn no commission until one exists.</p>
      )}
      <ul className="space-y-3">
        {plans.data?.map((p) =>
          editing?._id === p._id ? (
            <li key={p._id}>
              <PlanForm plan={p} onDone={done} />
            </li>
          ) : (
            <li
              key={p._id}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[18px] border border-rule px-5 py-4"
            >
              <span className="font-medium">{p.name}</span>
              <span className="tabular-nums">{p.price ? `${inr(p.price / 100)} · ${p.months} months` : 'Free'}</span>
              <span className="tabular-nums">{p.commissionPct}% commission</span>
              {p.recommended && <Tag tone="accent">Recommended</Tag>}
              {!p.active && <Tag>Retired</Tag>}
              {canEdit && (
                <button type="button" onClick={() => setEditing(p)} className="ml-auto text-sm underline">
                  Edit
                </button>
              )}
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
