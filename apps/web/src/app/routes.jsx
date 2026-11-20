// The route table: every page, its layout (site, app or sign-in), loaded lazily.
import {lazy} from 'react';
import {Home} from '../features/ecosystem/HomePage';
import {NotFound} from '../features/ecosystem/NotFoundPage';

// Pages load on first visit, so the home page ships the least JavaScript.
const page = (load, name) => lazy(() => load().then((m) => ({default: m[name]})));

/**
 * Every page of the site, in matching order. To add a page: write it under
 * features/<area>/, then add one line here. Product sites (/:slug) stay last,
 * so a fixed path like /verify is never mistaken for a product.
 */
export const ROUTES = [
  // Pirento Ecosystem
  {path: '/', element: <Home />},
  {path: '/products', Page: page(() => import('../features/ecosystem/ProductsPage'), 'Products')},
  {path: '/products/:slug', Page: page(() => import('../features/products/ProductDashboardPage'), 'ProductRedirect')},

  // Signing in and the shared account
  {path: '/login', layout: 'auth', Page: page(() => import('../features/auth/LoginPage'), 'Login')},
  {path: '/admin/login', layout: 'auth', Page: page(() => import('../features/auth/LoginPage'), 'StaffLogin')},
  {path: '/register', layout: 'auth', Page: page(() => import('../features/auth/RegisterPage'), 'Register')},
  {
    path: '/forgot-password',
    layout: 'auth',
    Page: page(() => import('../features/auth/ForgotPasswordPage'), 'ForgotPassword'),
  },
  {
    path: '/forgot-user-id',
    layout: 'auth',
    Page: page(() => import('../features/auth/ForgotUserIdPage'), 'ForgotUserId'),
  },
  {path: '/about', Page: page(() => import('../features/about/AboutPage'), 'About')},
  {path: '/terms', Page: page(() => import('../features/ecosystem/LegalPage'), 'Terms')},
  {path: '/privacy', Page: page(() => import('../features/ecosystem/LegalPage'), 'Privacy')},
  {path: '/refunds', Page: page(() => import('../features/ecosystem/LegalPage'), 'Refunds')},
  {path: '/dashboard', layout: 'app', Page: page(() => import('../features/account/DashboardPage'), 'Dashboard')},
  {path: '/account', layout: 'app', Page: page(() => import('../features/account/AccountPage'), 'Account')},
  {path: '/wallet', layout: 'app', Page: page(() => import('../features/account/WalletPage'), 'Wallet')},

  // Buying: catalogue, service pages, checkout, orders
  {path: '/legal/services', Page: page(() => import('../features/legal/CataloguePage'), 'Legal')},
  {path: '/services/:slug', Page: page(() => import('../features/legal/ServicePage'), 'Service')},
  {path: '/checkout/:slug', Page: page(() => import('../features/orders/CheckoutPage'), 'Checkout')},
  {path: '/orders', layout: 'app', Page: page(() => import('../features/account/HubPages'), 'AllOrders')},
  {path: '/receipts', layout: 'app', Page: page(() => import('../features/account/HubPages'), 'AllReceipts')},
  {path: '/orders/:id', Page: page(() => import('../features/orders/OrderPage'), 'OrderPage')},

  // Public checks and help
  {path: '/verify', Page: page(() => import('../features/verify/VerifyPage'), 'Verify')},
  {path: '/verify/:code', Page: page(() => import('../features/verify/VerifyPage'), 'Verify')},
  {path: '/support', Page: page(() => import('../features/support/SupportPage'), 'Support')},
  {path: '/support/:id', Page: page(() => import('../features/support/TicketPage'), 'Ticket')},

  // Staff
  {path: '/admin', layout: 'app', Page: page(() => import('../features/admin/AdminPage'), 'Admin')},
  {path: '/admin/:section', layout: 'app', Page: page(() => import('../features/admin/AdminPage'), 'Admin')},
  {path: '/admin/:section/:id', layout: 'app', Page: page(() => import('../features/admin/AdminPage'), 'Admin')},
  {path: '/staff', Page: page(() => import('../features/admin/StaffRedirect'), 'Staff')},

  // The ten product sites: home at /<slug>, app at /<slug>/dashboard, legal pages at /<slug>/terms and so on
  {path: '/:slug', Page: page(() => import('../features/products/ProductHomePage'), 'ProductHome')},
  {
    path: '/:slug/dashboard',
    layout: 'app',
    Page: page(() => import('../features/products/ProductDashboardPage'), 'ProductDashboard'),
  },
  {
    path: '/:slug/dashboard/orders/:id',
    layout: 'app',
    Page: page(() => import('../features/orders/OrderDetail'), 'OrderDetail'),
  },
  {
    path: '/:slug/dashboard/receipts/:id',
    layout: 'app',
    Page: page(() => import('../features/orders/ReceiptPage'), 'Receipt'),
  },
  {
    path: '/:slug/dashboard/:section',
    layout: 'app',
    Page: page(() => import('../features/products/ProductDashboardPage'), 'ProductDashboard'),
  },
  // Each product's own legal pages, in its colours
  {path: '/:slug/terms', Page: page(() => import('../features/ecosystem/LegalPage'), 'Terms')},
  {path: '/:slug/privacy', Page: page(() => import('../features/ecosystem/LegalPage'), 'Privacy')},
  {path: '/:slug/refunds', Page: page(() => import('../features/ecosystem/LegalPage'), 'Refunds')},

  {path: '*', element: <NotFound />},
];
