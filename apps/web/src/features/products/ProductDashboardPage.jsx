// /<product>/dashboard: picks the right dashboard for each product.
import {Navigate, useParams} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {Ai} from '../ai/AiPage';
import {Capital} from '../capital/CapitalPage';
import {NotFound} from '../ecosystem/NotFoundPage';
import {BharatId} from '../identity/BharatIdPage';
import {Intern} from '../learning/InternPage';
import {One} from '../partner/OnePage';
import {OrdersDashboard} from './OrdersDashboard';
import {ProductWallet} from './ProductWallet';
import {Vault} from '../vault/VaultPage';
import {usePageMeta} from '../../lib/page';

const APPS = {intern: Intern, vault: Vault, ai: Ai, one: One, capital: Capital, 'bharat-id': BharatId};

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
  // Products with one page ignore any other section in the URL and show it.
  if (App) return section ? <Navigate to={`/${slug}/dashboard`} replace /> : <App />;
  return <OrdersDashboard product={product} section={section} />;
}

export const ProductRedirect = () => {
  const {slug} = useParams();
  return <Navigate to={`/${slug}`} replace />;
};
