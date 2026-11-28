// Account → Billing details: the name, GSTIN, address and state printed on the person's invoices from now on (a
// business claims input tax credit with its GSTIN). All optional; the state also sets the place of supply.
import {useEffect, useState} from 'react';
import {STATE_NAMES, isGstin, stateOfGstin} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {invoiceCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';

const copy = invoiceCopy.billing;
const EMPTY = {name: '', gstin: '', address: '', state: ''};

export function BillingCard({n}) {
  const saved = useApi('/auth/me/billing');
  const [f, setF] = useState(EMPTY);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (saved.data) setF({...EMPTY, ...saved.data});
  }, [saved.data]);
  const set = (k) => (e) => setF({...f, [k]: k === 'gstin' ? e.target.value.toUpperCase() : e.target.value});
  const gstinError = f.gstin && !isGstin(f.gstin) ? 'Enter a valid 15-character GSTIN' : '';
  const submit = async (e) => {
    e.preventDefault();
    if (gstinError) return;
    try {
      // A GSTIN names its state; use it when no state was chosen.
      const state = f.state || stateOfGstin(f.gstin)?.name || '';
      await api('/auth/me/billing', {method: 'PUT', body: {...f, state}});
      setF({...f, state});
      setNote(copy.saved);
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={n}>{copy.title}</Label>
      <p className="mt-4 text-sm text-muted">{copy.intro}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={copy.name} maxLength={120} value={f.name} onChange={set('name')} />
        <Field label={copy.gstin} maxLength={15} value={f.gstin} onChange={set('gstin')} error={gstinError} />
        <div className="sm:col-span-2">
          <Field label={copy.address} maxLength={300} value={f.address} onChange={set('address')} />
        </div>
        <label className="block">
          <span className="text-sm font-medium">{copy.state}</span>
          <select
            value={f.state}
            onChange={set('state')}
            className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3"
          >
            <option value="">—</option>
            {STATE_NAMES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" icon={null}>
          {copy.save}
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
