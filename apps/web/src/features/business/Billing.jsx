// Business dashboard: prepaid billing. Live calls are paid from the owner's Pirento wallet at our price list;
// test calls are free. Add money here; every charge shows in the wallet's entries.
import {DashSection} from '../../components/ui/DashSection';
import {inr} from '../../lib/format';
import {WalletPanel} from '../account/WalletPanel';
import {AppFrame} from '../products/AppFrame';
import {authMethod} from '@pirento/shared';

const LABELS = {verify: 'Verify a Bharat ID', consent: 'Ask for consent'};

export function Billing({frame, data}) {
  return (
    <AppFrame
      {...frame}
      title="Billing."
      intro="Prepaid: add money, and each live call takes its price. Test calls are free."
    >
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <WalletPanel n={1} />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <DashSection n={2} id="prices" label="Prices" title="What a live / call costs.">
            <ul className="divide-y divide-rule rounded-[18px] border border-rule">
              {Object.entries(data.prices).map(([k, paise]) => (
                <li key={k} className="flex items-center justify-between gap-4 p-4 text-sm">
                  <span>{LABELS[k] ?? `Check: ${authMethod(k)?.label ?? k}`}</span>
                  <span className="tabular-nums">{paise ? inr(paise / 100) : 'Free'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              A call is charged when it is accepted. Without enough credit it is refused (402).
            </p>
          </DashSection>
        </div>
      </div>
    </AppFrame>
  );
}
