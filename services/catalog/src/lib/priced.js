// Services with the admin's price changes applied.
import {getService} from '@pirento/shared';

/** A service with its admin override applied: a new price, or off sale (price null). */
export function withOverride(service, override) {
  if (!service || !override) return service;
  if (override.offSale) return {...service, price: null};
  return override.price ? {...service, price: override.price} : service;
}

export const pricedService = (slug, overrides) => withOverride(getService(slug), overrides[slug]);
