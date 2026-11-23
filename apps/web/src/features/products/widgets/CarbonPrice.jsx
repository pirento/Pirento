// Pirento Green: today's carbon credit price and its chart, with the way into the market.
import {Button} from '../../../components/ui/Button';
import {green} from '../../../data/site';
import {useApi} from '../../../lib/api/useApi';
import {PriceChart} from '../../green/PriceChart';
import {PriceLine} from '../../green/Market';
import {WidgetCard} from './Card';

const copy = green.widget;

export function CarbonPrice() {
  const {data} = useApi('/green/market');
  return (
    <WidgetCard label={copy.label}>
      <div className="mt-4">
        {data?.price ? <PriceLine market={data} /> : <p className="text-muted">{data ? copy.unpriced : '…'}</p>}
      </div>
      {data?.history.length > 1 && (
        <div className="mt-6">
          <PriceChart history={data.history} height={140} />
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button to="/green/dashboard/market" variant="accent">
          {copy.cta}
        </Button>
        {data && !data.open && <span className="text-sm text-muted">{copy.closed}</span>}
      </div>
    </WidgetCard>
  );
}
