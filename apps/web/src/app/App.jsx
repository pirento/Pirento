// The app shell: picks a layout per route (site, app or sign-in) and renders the page in it.
import {Banner} from '../components/layout/Banner';
import {Suspense, useEffect} from 'react';
import {Route, Routes} from 'react-router-dom';
import {startSmoothScroll} from '../lib/motion';
import {useSiteTheme} from '../lib/site';
import {Navbar} from '../components/layout/Navbar';
import {Footer} from '../components/layout/Footer';
import {Preloader} from '../components/layout/Preloader';
import {Cursor} from '../components/layout/Cursor';
import {AppLayout} from '../components/layout/AppLayout';
import {RouteEffects} from './RouteEffects';
import {ROUTES} from './routes';
import {RouteLoader} from '../components/layout/RouteLoader';

/** Marketing pages: navbar on top, footer below. */
function SiteLayout({children}) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <Banner />
    </>
  );
}

// Each route names its frame: the marketing site, the working app, or a bare sign-in page.
const LAYOUTS = {
  site: SiteLayout,
  app: AppLayout,
  auth: ({children}) => <main id="main">{children}</main>,
};

/** What every page shares: preloader, cursor, page-change effects, and its layout. */
export function App() {
  useEffect(() => {
    startSmoothScroll();
  }, []);
  useSiteTheme(); // paints the page in the current product's colours

  return (
    <>
      <Preloader />
      <Cursor />
      <RouteEffects />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {ROUTES.map(({path, element, Page, layout = 'site'}) => {
            const Frame = LAYOUTS[layout];
            return <Route key={path} path={path} element={<Frame>{element ?? <Page />}</Frame>} />;
          })}
        </Routes>
      </Suspense>
    </>
  );
}
