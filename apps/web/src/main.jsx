import {StrictMode, Suspense, lazy, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Route, Routes, useLocation} from 'react-router-dom';
import gsap from 'gsap';
import './index.css';
import {SessionProvider} from './lib/api';
import {lenis, reducedMotion, scrollToTop, startSmoothScroll} from './lib/motion';
import {Navbar} from './components/Navbar';
import {Footer} from './components/Footer';
import {Preloader} from './components/Preloader';
import {Cursor} from './components/Cursor';
import {Home} from './pages/Home';
import {NotFound} from './pages/NotFound';

// Every other page loads on first visit, so the home page ships less JavaScript.
const page = (load, name) => lazy(() => load().then((m) => ({default: m[name]})));
const Products = page(() => import('./pages/Products'), 'Products');
const Product = page(() => import('./pages/Products'), 'Product');
const Legal = page(() => import('./pages/Legal'), 'Legal');
const Service = page(() => import('./pages/Legal'), 'Service');
const Login = page(() => import('./pages/Account'), 'Login');
const Account = page(() => import('./pages/Account'), 'Account');
const Checkout = page(() => import('./pages/Orders'), 'Checkout');
const OrderPage = page(() => import('./pages/Orders'), 'OrderPage');
const Staff = page(() => import('./pages/Orders'), 'Staff');
const Verify = page(() => import('./pages/Orders'), 'Verify');
const BharatId = page(() => import('./pages/BharatId'), 'BharatId');
const Intern = page(() => import('./pages/Intern'), 'Intern');
const Vault = page(() => import('./pages/Vault'), 'Vault');
const Support = page(() => import('./pages/Support'), 'Support');
const Ticket = page(() => import('./pages/Support'), 'Ticket');
const Ai = page(() => import('./pages/Ai'), 'Ai');
const One = page(() => import('./pages/One'), 'One');
const Capital = page(() => import('./pages/Capital'), 'Capital');
const Admin = page(() => import('./pages/Admin'), 'Admin');

// Scroll to top on page change (or to #hash), and fade the new page in.
function RouteEffects() {
  const {pathname, hash, search} = useLocation();
  useEffect(() => {
    // Remember a Pirento One partner code from a shared link; checkout sends it.
    const ref = new URLSearchParams(search).get('ref');
    if (ref && /^P[0-9A-F]{6}$/i.test(ref)) {
      try {
        localStorage.setItem('pirento.ref', ref.toUpperCase());
      } catch {
        /* storage blocked: the referral is simply not recorded */
      }
    }
  }, [search]);
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) return void (lenis ? lenis.scrollTo(el) : el.scrollIntoView({behavior: 'smooth'}));
    }
    scrollToTop();
    if (!reducedMotion())
      gsap.fromTo('#main', {opacity: 0, y: 12}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'});
  }, [pathname, hash]);
  return null;
}

function App() {
  useEffect(startSmoothScroll, []);
  return (
    <>
      <Preloader />
      <Cursor />
      <Navbar />
      <RouteEffects />
      <main id="main">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<Product />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/services/:slug" element={<Service />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout/:slug" element={<Checkout />} />
            <Route path="/orders/:id" element={<OrderPage />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:code" element={<Verify />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/bharat-id" element={<BharatId />} />
            <Route path="/intern" element={<Intern />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/support" element={<Support />} />
            <Route path="/support/:id" element={<Ticket />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/ai" element={<Ai />} />
            <Route path="/one" element={<One />} />
            <Route path="/capital" element={<Capital />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
