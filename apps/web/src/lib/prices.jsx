// The admin's edits to the catalogue (prices, questions, services made in admin), merged in so every page shows
// what the server sells and charges.
import {createContext, useContext, useEffect, useState} from 'react';
import {LEGAL_CATALOGUE, categoriesOf, editedService, editedServicesFor, slugify} from '@pirento/shared';
import {api} from './api/client';

const PricesContext = createContext({edits: {}, reload: () => {}});

export function PricesProvider({children}) {
  const [edits, setEdits] = useState({});
  // Until this answers, the catalogue as built shows; the server re-prices and re-checks every order anyway.
  const reload = () => api('/catalog/prices').then(setEdits, () => {});
  useEffect(() => {
    reload();
  }, []);
  return <PricesContext.Provider value={{edits, reload}}>{children}</PricesContext.Provider>;
}

/** One service as it sells now: a new price, or price null when off sale; its own questions; or made in admin. */
export function useService(slug) {
  const {edits} = useContext(PricesContext);
  return editedService(slug, edits);
}

export function useServicesFor(product) {
  const {edits} = useContext(PricesContext);
  return editedServicesFor(product, edits);
}

/** For admin: the raw edits map, and a way to refresh it after a change. */
export const useCatalogEdits = () => useContext(PricesContext);

/** Legal's areas of law in order, then any category made in admin, each with its anchor on /legal/services. */
export function useLegalAreas() {
  const services = useServicesFor('legal');
  return categoriesOf(
    services,
    LEGAL_CATALOGUE.map((c) => c.title),
  ).map((title) => ({title, anchor: slugify(title), count: services.filter((s) => s.category === title).length}));
}
