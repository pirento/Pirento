import {Suspense, useEffect} from 'react';
import {Route, Routes} from 'react-router-dom';
import {startSmoothScroll} from '../lib/motion';
import {useSiteTheme} from '../lib/site';
import {Navbar} from '../components/layout/Navbar';
import {Footer} from '../components/layout/Footer';
import {Preloader} from '../components/layout/Preloader';
import {Cursor} from '../components/layout/Cursor';
import {RouteEffects} from './RouteEffects';
import {ROUTES} from './routes';

/** The shell every page shares: preloader, cursor, navbar, the page, footer. */
export function App() {
  useEffect(() => {
    startSmoothScroll();
  }, []);
  useSiteTheme(); // paints the page in the current product's colours

  return (
    <>
      <Preloader />
      <Cursor />
      <Navbar />
      <RouteEffects />
      <main id="main">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Routes>
            {ROUTES.map(({path, element, Page}) => (
              <Route key={path} path={path} element={element ?? <Page />} />
            ))}
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
