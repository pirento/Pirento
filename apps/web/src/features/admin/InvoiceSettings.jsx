// Admin → Invoices → Settings: the seller's registered address, the invoice number prefix and a note, and for each
// product (listed from the catalogue, only edited here) its SAC or HSN code and GST rate. Until a product has both,
// and the address is set, its invoices are plain and say they are not GST tax invoices.
import {useState} from 'react';
import {COMPANY} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';

function Seller({s, onSaved}) {
  const [f, setF] = useState({address: s.address ?? '', prefix: s.prefix ?? 'PIR', note: s.note ?? ''});
  const [msg, setMsg] = useState('');
  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/orders/staff/invoices/settings', {method: 'PUT', body: f});
      setMsg('Saved. Invoices issued from now on use it.');
      onSaved();
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} noValidate className="space-y-4 rounded-[22px] border border-rule p-6">
      <p className="font-medium">Seller</p>
      <p className="text-sm text-muted">
        {COMPANY.legalName} · GSTIN {COMPANY.gstin} · CIN {COMPANY.cin}
      </p>
      <TextArea
        label="Registered address (printed on every invoice)"
        rows={3}
        maxLength={300}
        value={f.address}
        onChange={(e) => setF({...f, address: e.target.value})}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Number prefix (PIR/26-27/00001)"
          maxLength={5}
          value={f.prefix}
          onChange={(e) => setF({...f, prefix: e.target.value.toUpperCase()})}
        />
        <Field
          label="A line on every invoice (optional)"
          maxLength={300}
          value={f.note}
          onChange={(e) => setF({...f, note: e.target.value})}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" icon={null}>
          Save
        </Button>
        {msg && (
          <p role="status" className="text-sm">
            {msg}
          </p>
        )}
      </div>
    </form>
  );
}

function ProductRow({p, rates, onSaved}) {
  const [code, setCode] = useState(p.code);
  const [rate, setRate] = useState(p.rate === null ? '' : String(p.rate));
  const [msg, setMsg] = useState('');
  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api(`/orders/staff/invoices/settings/products/${p.product}`, {
        method: 'PUT',
        body: {code, rate: Number(rate)},
      });
      setMsg('Saved.');
      onSaved();
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} noValidate className="flex flex-wrap items-end gap-3 border-b border-rule py-4">
      <div className="min-w-40 flex-1">
        <p className="font-medium">{p.name}</p>
        <p className="mt-1">
          <Tag tone="rule">{p.code && p.rate !== null ? 'Tax invoices' : 'Plain invoices'}</Tag>
        </p>
      </div>
      <div className="w-36">
        <Field
          label={`${p.codeType} code`}
          inputMode="numeric"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <label className="block">
        <span className="text-sm font-medium">GST rate</span>
        <select
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="mt-2 block rounded-[14px] border border-rule bg-paper px-4 py-3"
        >
          <option value="">Choose…</option>
          {rates.map((r) => (
            <option key={r} value={r}>
              {r}%
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline" icon={null} disabled={!code || rate === ''}>
        Save
      </Button>
      {msg && (
        <p role="status" className="w-full text-sm">
          {msg}
        </p>
      )}
    </form>
  );
}

export function InvoiceSettingsTab() {
  const one = useApi('/orders/staff/invoices/settings');
  const d = one.data;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-8">
      <Seller s={d.settings} onSaved={one.reload} />
      <div>
        <p className="font-medium">Each product’s tax</p>
        <p className="mt-1 text-sm text-muted">
          Every product sold through orders is listed here from the catalogue. Services take a SAC code, goods an HSN
          code. Prices already include GST, so the tax is taken out of what the customer paid. Check codes and rates
          with your accountant.
        </p>
        <div className="mt-4 border-t border-rule">
          {d.products.map((p) => (
            <ProductRow key={p.product} p={p} rates={d.rates} onSaved={one.reload} />
          ))}
        </div>
      </div>
    </div>
  );
}
