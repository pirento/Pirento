// The Bharat ID for Business dashboard: where the account stands, company details, API keys, the consent log
// and the API reference. Reached with the sign-in our team emails on approval.
import {Navigate, useParams} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {bharatIdBusiness as copy} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {usePageMeta} from '../../lib/page';
import {useSignedIn} from '../auth/useSignedIn';
import {AppFrame} from '../products/AppFrame';
import {Button} from '../../components/ui/Button';
import {BusinessOverview} from './BusinessOverview';
import {CompanyDetails} from './CompanyDetails';
import {ApiKeys} from './ApiKeys';
import {ConsentLog} from './ConsentLog';
import {ApiReference} from './ApiReference';
import {Billing} from './Billing';
import {ChecksLog} from './ChecksLog';
import {Console} from './Console';

const SECTIONS = {
  overview: BusinessOverview,
  company: CompanyDetails,
  keys: ApiKeys,
  consents: ConsentLog,
  checks: ChecksLog,
  billing: Billing,
  docs: ApiReference,
};
const product = getProduct('bharat-id');

export function BusinessDashboard() {
  const {section = 'overview'} = useParams();
  const {redirect, user} = useSignedIn();
  const me = useApi(user ? '/identity/business/me' : null);
  const current = copy.dashboard.sections.find((s) => s.id === section);
  usePageMeta({title: `${copy.dashboard.title} · ${current?.label ?? 'Dashboard'}`});
  if (redirect) return redirect;
  if (!current) return <Navigate to="/bharat-id/business/dashboard" replace />;

  const frame = {
    product,
    section,
    eyebrow: `${copy.dashboard.title} · ${current.label}`,
    ready: Boolean(user) && !me.loading,
  };
  if (!user || me.loading) return <AppFrame {...frame} title={current.label} />;
  if (me.error) {
    return (
      <AppFrame {...frame} title={copy.dashboard.title}>
        <div className="max-w-2xl rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
          <p className="body">{me.error.status === 404 ? copy.dashboard.none : `⚠ ${me.error.message}`}</p>
          <Button to="/bharat-id/business#request" variant="accent" className="mt-6">
            {copy.ask}
          </Button>
        </div>
      </AppFrame>
    );
  }
  const Section = SECTIONS[section];
  // Every console page carries the company, test or live, and the credit left.
  return (
    <Section frame={{...frame, action: <Console business={me.data.business} />}} data={me.data} reload={me.reload} />
  );
}
