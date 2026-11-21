// Asking the catalog service for a service's live price.
import {ApiError, callService} from '@pirento/shared/server';
import {config} from '../config.js';

/**
 * The service as it sells right now, with any admin price change, from the
 * catalog service. If the catalog cannot answer we refuse rather than guess a
 * price: charging an old price is worse than asking someone to retry.
 */
export async function liveService(slug) {
  try {
    return await callService(config.catalogUrl, '/internal/service', {slug});
  } catch {
    throw new ApiError(503, 'CATALOG_DOWN', 'Prices could not be loaded. Try again in a minute.');
  }
}
