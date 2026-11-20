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
import {Vault} from '../vault/VaultPage';
import {usePageMeta} from '../../lib/page';

const APPS = {intern: Intern, vault: Vault, ai: Ai, one: One, capital: Capital, 'bharat-id': BharatId};

export function ProductDashboard() {
  const {slug} = useParams();
  const product = getProduct(slug);
  usePageMeta({title: product ? `${product.name} · Dashboard` : 'Not found'});
  if (!product) return <NotFound />;
  const App = APPS[slug];
  return App ? <App /> : <OrdersDashboard product={product} />;
}

export const ProductRedirect = () => {
  const {slug} = useParams();
  return <Navigate to={`/${slug}`} replace />;
};
