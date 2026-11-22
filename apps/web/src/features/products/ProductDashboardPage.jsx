// /<product>/dashboard: picks the right dashboard for each product.
import {Navigate, useParams} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {Ai} from '../ai/AiPage';
import {Capital} from '../capital/CapitalPage';
import {NotFound} from '../ecosystem/NotFoundPage';
import {BharatId} from '../identity/BharatIdPage';
import {BharatIdGate} from '../identity/BharatIdGate';
import {Intern} from '../learning/InternPage';
import {One} from '../partner/OnePage';
import {OrdersDashboard} from './OrdersDashboard';
import {ProductWallet} from './ProductWallet';
import {Vault} from '../vault/VaultPage';
import {usePageMeta} from '../../lib/page';
import {SINGLE_PAGE_SECTIONS, productDashboards} from '../../data/site';

const APPS = {intern: Intern, vault: Vault, ai: Ai, one: One, capital: Capital, 'bharat-id': BharatId};
// These open only once the person's Bharat ID is issued (their services refuse until then too).
const NEEDS_BHARAT_ID = ['one', 'vault'];

export function ProductDashboard() {
  const {slug, section} = useParams();
  const product = getProduct(slug);
  usePageMeta({title: product ? `${product.name} · Dashboard` : 'Not found'});
  if (!product) return <NotFound />;
  // There is one support desk; a product's Support section is the way to it.
  if (section === 'support') return <Navigate to={`/support?product=${slug}`} replace />;
  // Every product shows the one wallet inside its own dashboard.
  if (section === 'wallet') return <ProductWallet product={product} />;
  const App = APPS[slug];
  if (App) {
    // An app product shows the sections in its sidebar; anything else in the URL goes to its overview.
    const known = (productDashboards[slug] ?? SINGLE_PAGE_SECTIONS).some((s) => s.id === (section ?? 'overview'));
    if (!known || section === 'overview') return <Navigate to={`/${slug}/dashboard`} replace />;
    const app = <App product={product} section={section ?? 'overview'} />;
    return NEEDS_BHARAT_ID.includes(slug) ? (
      <BharatIdGate product={product} section={section ?? 'overview'}>
        {app}
      </BharatIdGate>
    ) : (
      app
    );
  }
  return <OrdersDashboard product={product} section={section} />;
}

export const ProductRedirect = () => {
  const {slug} = useParams();
  return <Navigate to={`/${slug}`} replace />;
};
