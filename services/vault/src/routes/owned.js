import {isId, notFound} from '@pirento/shared/server';

/** The caller's own document by URL id; someone else's reads as not found. */
export async function findOwned(Model, req, projection) {
  const doc = isId(req.params.id) && (await Model.findOne({_id: req.params.id, userId: req.user.sub}, projection));
  if (!doc) throw notFound('Not found');
  return doc;
}
