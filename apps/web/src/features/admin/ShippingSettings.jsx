// Admin → Shipments → Settings: automatic shipping on or off, the pickup address, and each shippable product's
// parcel. The products come from the catalogue by themselves (a new Giftox product appears here at once); each row
// can only be edited, never added or removed here.
import {useState} from 'react';
import {Truck} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {shippingCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

const copy = shippingCopy.settings;
const EMPTY = {name: '', address: '', pincode: '', mobile: ''};

function General({data, onSaved}) {
  const [auto, setAuto] = useState(data.settings.auto);
  const [shipper, setShipper] = useState(data.settings.shipper?.address ? data.settings.shipper : EMPTY);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setShipper({...shipper, [k]: e.target.value});
  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/orders/staff/shipping/settings', {
        method: 'PUT',
        body: {auto, shipper: shipper.address ? shipper : null},
      });
      setMsg('Saved.');
      onSaved();
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  const sweep = async () => {
    setMsg('');
    try {
      const {made} = await api('/orders/staff/shipping/sweep', {method: 'POST'});
      setMsg(made ? `${made} parcel${made === 1 ? '' : 's'} made.` : 'No order was waiting.');
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} noValidate className="space-y-6 rounded-[22px] border border-rule p-6">
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="mt-1 size-4" />
        <span>
          <span className="font-medium">{copy.auto}</span>
          <span className="mt-1 block text-sm text-muted">{copy.autoNote}</span>
        </span>
      </label>
      <div>
        <p className="font-medium">{copy.shipper}</p>
        <p className="mt-1 text-sm text-muted">{copy.shipperNote}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name" maxLength={80} value={shipper.name} onChange={set('name')} />
          <Field label="Mobile" inputMode="numeric" maxLength={10} value={shipper.mobile} onChange={set('mobile')} />
          <div className="sm:col-span-2">
            <Field label="Address" maxLength={300} value={shipper.address} onChange={set('address')} />
          </div>
          <Field label="PIN code" inputMode="numeric" maxLength={6} value={shipper.pincode} onChange={set('pincode')} />
        </div>
        {!data.settings.shipper?.address && data.shipper?.address && (
          <p className="mt-3 text-sm text-muted">
            In use now: {data.shipper.name}, {data.shipper.address}, {data.shipper.pincode}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" icon={null}>
          Save settings
        </Button>
        <Button type="button" variant="outline" icon={Truck} onClick={sweep}>
          {copy.sweep}
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

function ServiceRow({s, onSaved}) {
  const [f, setF] = useState({
    autoShip: s.autoShip,
    weightKg: String(s.weightKg),
    lengthCm: String(s.lengthCm),
    breadthCm: String(s.breadthCm),
    heightCm: String(s.heightCm),
  });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({...f, [k]: e.target.value});
  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api(`/orders/staff/shipping/services/${s.slug}`, {
        method: 'PUT',
        body: {
          autoShip: f.autoShip,
          weightKg: Number(f.weightKg),
          lengthCm: Number(f.lengthCm),
          breadthCm: Number(f.breadthCm),
          heightCm: Number(f.heightCm),
        },
      });
      setMsg('Saved.');
      onSaved();
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} noValidate className="border-b border-rule py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-medium">
          {s.name} {s.price && <span className="text-sm text-muted">· {inr(s.price)}</span>}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.autoShip}
            onChange={(e) => setF({...f, autoShip: e.target.checked})}
            className="size-4"
          />
          Ships by itself
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Field label="Weight (kg)" inputMode="decimal" value={f.weightKg} onChange={set('weightKg')} />
        <Field label="Length (cm)" inputMode="numeric" value={f.lengthCm} onChange={set('lengthCm')} />
        <Field label="Breadth (cm)" inputMode="numeric" value={f.breadthCm} onChange={set('breadthCm')} />
        <Field label="Height (cm)" inputMode="numeric" value={f.heightCm} onChange={set('heightCm')} />
        <div className="flex items-end gap-3">
          <Button type="submit" variant="outline" icon={null}>
            Save
          </Button>
        </div>
      </div>
      {msg && (
        <p role="status" className="mt-2 text-sm">
          {msg}
        </p>
      )}
    </form>
  );
}

export function ShippingSettings() {
  const one = useApi('/orders/staff/shipping/settings');
  const d = one.data;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-8">
      <General data={d} onSaved={one.reload} />
      <div>
        <p className="font-medium">{copy.services}</p>
        <p className="mt-1 text-sm text-muted">{copy.servicesNote}</p>
        <div className="mt-4 border-t border-rule">
          {d.services.map((s) => (
            <ServiceRow key={s.slug} s={s} onSaved={one.reload} />
          ))}
        </div>
      </div>
    </div>
  );
}
