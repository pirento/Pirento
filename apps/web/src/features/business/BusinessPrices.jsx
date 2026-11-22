// Admin: the Bharat ID for Business price list (each live call, in rupees). Staff see it; a superadmin changes it.
import {useEffect, useState} from 'react';
import {authMethod} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';

const LABELS = {verify: 'Verify a Bharat ID', consent: 'Ask for consent'};

export function BusinessPrices() {
  const prices = useApi('/identity/staff/business/prices');
  const {user} = useSession();
  const canEdit = user?.role === 'superadmin'; // ACCESS.catalog
  const [form, setForm] = useState(null);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (prices.data) setForm(Object.fromEntries(Object.entries(prices.data).map(([k, p]) => [k, p / 100])));
  }, [prices.data]);
  if (!form) return null;
  const save = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await api('/identity/staff/business/prices', {
        method: 'PUT',
        body: Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Math.round(Number(v) || 0)])),
      });
      setNote('Saved. New live calls are charged at these prices.');
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <details className="rounded-[18px] border border-rule p-5">
      <summary className="cursor-pointer font-medium">
        Price list (each live call, prepaid from the business’s wallet)
      </summary>
      <form onSubmit={save} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(form).map((k) => (
            <Field
              key={k}
              label={`${LABELS[k] ?? authMethod(k)?.label ?? k} (₹, 0 = free)`}
              type="number"
              min={0}
              disabled={!canEdit}
              value={form[k]}
              onChange={(e) => setForm((f) => ({...f, [k]: e.target.value}))}
            />
          ))}
        </div>
        {canEdit && (
          <Button type="submit" variant="accent">
            Save prices
          </Button>
        )}
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </form>
    </details>
  );
}
