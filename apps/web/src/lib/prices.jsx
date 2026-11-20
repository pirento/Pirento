// Admin price changes, merged into the shared catalogue so every price shown is the one the server charges.
import {createContext, useContext, useEffect, useState} from 'react';
import {getService, servicesFor} from '@pirento/shared';
import {api} from './api/client';

const PricesContext = createContext({overrides: {}, reload: () => {}});

export function PricesProvider({children}) {
  const [overrides, setOverrides] = useState({});
  // Until this answers, the catalogue prices show; the server re-prices every order anyway.
  const reload = () => api('/catalog/prices').then(setOverrides, () => {});
  useEffect(() => {
    reload();
  }, []);
  return <PricesContext.Provider value={{overrides, reload}}>{children}</PricesContext.Provider>;
}

/** A service with its override: a new price, or price null when taken off sale. */
export const withOverride = (service, o) =>
  !service || !o ? service : o.offSale ? {...service, price: null} : o.price ? {...service, price: o.price} : service;

export function useService(slug) {
  const {overrides} = useContext(PricesContext);
  return withOverride(getService(slug), overrides[slug]);
}

export function useServicesFor(product) {
  const {overrides} = useContext(PricesContext);
  return servicesFor(product).map((s) => withOverride(s, overrides[s.slug]));
}

/** For admin: the raw overrides map, and a way to refresh it after a change. */
export const usePriceOverrides = () => useContext(PricesContext);
