// Pirento One and Vault open only once the person's Bharat ID is issued; until then this stands in for the dashboard.
import {Button} from '../../components/ui/Button';
import {appDashboards, bharatIdGate as copy} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {AppFrame} from '../products/AppFrame';

export function BharatIdGate({product, section, children}) {
  const me = useApi('/identity/me');
  const status = me.data?.status ?? 'none';
  if (status === 'approved') return children;

  const frame = {product, section, ready: !me.loading};
  if (me.loading) return <AppFrame {...frame} title={appDashboards[product.slug]?.hello ?? product.name} />;
  return (
    <AppFrame {...frame} title={copy.title} intro={copy.intro(product.name)}>
      <div className="max-w-2xl rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
        {me.error ? (
          <p role="alert" className="body">
            ⚠ {me.error.message}
          </p>
        ) : (
          <>
            <p className="body">{copy.status[status] ?? copy.status.none}</p>
            <Button to="/bharat-id/dashboard" variant="accent" className="mt-6">
              {copy.button[status] ?? copy.button.none}
            </Button>
          </>
        )}
      </div>
    </AppFrame>
  );
}
