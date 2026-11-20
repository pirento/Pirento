// Pirento Green: pick a drive and a number of trees, see the total before you sign in.
import {useState} from 'react';
import {GREEN_DRIVES} from '@pirento/shared';
import {Button} from '../../../components/ui/Button';
import {inr} from '../../../lib/format';
import {useServicesFor} from '../../../lib/prices';
import {WidgetCard} from './Card';

export function TreeCalculator() {
  const services = useServicesFor('green');
  const [drive, setDrive] = useState(GREEN_DRIVES[0].driveId);
  const [trees, setTrees] = useState(10);
  const service = services.find((s) => s.slug === `green-${drive}`);
  const price = service?.price;
  return (
    <WidgetCard label="Plan a sponsorship">
      <fieldset className="mt-5">
        <legend className="text-sm text-muted">Drive</legend>
        <div className="mt-2 grid gap-2">
          {GREEN_DRIVES.map((d) => {
            const p = services.find((s) => s.slug === `green-${d.driveId}`)?.price;
            return (
              <label
                key={d.driveId}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-sm ${drive === d.driveId ? 'border-ink' : 'border-rule'}`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="drive"
                    value={d.driveId}
                    checked={drive === d.driveId}
                    onChange={() => setDrive(d.driveId)}
                    className="accent-current"
                  />
                  <span>
                    <span className="block font-medium">{d.name}</span>
                    <span className="text-muted">{d.region}</span>
                  </span>
                </span>
                <span className="tabular-nums">{p ? `${inr(p)}/tree` : 'Paused'}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="mt-5 block text-sm">
        <span className="flex justify-between text-muted">
          Trees <span className="text-ink tabular-nums">{trees}</span>
        </span>
        <input
          type="range"
          min="1"
          max="500"
          value={trees}
          onChange={(e) => setTrees(Number(e.target.value))}
          className="mt-2 w-full accent-current"
        />
      </label>
      <div className="mt-5 flex items-baseline justify-between border-t border-rule pt-5">
        <span className="text-muted">Total</span>
        <span className="num text-3xl!">{price ? inr(price * trees) : '—'}</span>
      </div>
      {price && (
        <Button to={`/checkout/green-${drive}`} variant="accent" className="mt-5 w-full justify-center">
          Sponsor trees
        </Button>
      )}
    </WidgetCard>
  );
}
