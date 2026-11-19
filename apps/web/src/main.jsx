import {StrictMode, useEffect} from 'react';
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
import {Product, Products} from './pages/Products';
import {Legal, Service} from './pages/Legal';
import {Account, Login} from './pages/Account';
import {Checkout, OrderPage, Staff, Verify} from './pages/Orders';
import {BharatId} from './pages/BharatId';
import {Intern} from './pages/Intern';
import {Vault} from './pages/Vault';
import {Support, Ticket} from './pages/Support';
import {NotFound} from './pages/NotFound';

// Scroll to top on page change (or to #hash), and fade the new page in.
function RouteEffects() {
  const {pathname, hash} = useLocation();
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
        </Routes>
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
