// Search over Pirento Intern: open roles and published lessons. With OPENSEARCH_URL, an OpenSearch index (fast and
// fuzzy at any size), kept current by the models' save hooks; without it, an escaped regex on Mongo.
import {Client} from '@opensearch-project/opensearch';
import {env} from '@pirento/shared/server';

const INDEX = 'pirento-intern';
let client;
const os = () => {
  if (client !== undefined) return client;
  const node = env('OPENSEARCH_URL', '');
  client = node ? new Client({node}) : null;
  return client;
};
export const searchReady = () => Boolean(os());

/** A search hit as the browser shows it. */
export const openingDoc = (o) => ({
  kind: 'Opening',
  title: o.title,
  text: `${o.company ?? 'Pirento'} ${o.description}`.slice(0, 2000),
  to: '/intern/dashboard/openings',
  live: Boolean(o.open),
});
export const lessonDoc = (l) => ({
  kind: 'Lesson',
  title: l.title,
  text: String(l.body).slice(0, 2000),
  to: `/intern/dashboard/learn?lesson=${l._id}`,
  live: Boolean(l.published),
});

/** Puts one record in the index, or takes it out when it is not live. Never fails the write that caused it. */
export async function syncDoc(id, doc) {
  if (!os()) return;
  try {
    if (doc.live) await os().index({index: INDEX, id: String(id), body: doc});
    else
      await os()
        .delete({index: INDEX, id: String(id)})
        .catch(() => {});
  } catch (err) {
    console.error('search index', err.message);
  }
}

/** Live hits for `q`, best first. */
export async function searchIndex(q, size = 8) {
  const res = await os().search({
    index: INDEX,
    body: {
      size,
      query: {
        bool: {
          filter: [{term: {live: true}}],
          must: {multi_match: {query: q, fields: ['title^3', 'text'], fuzziness: 'AUTO'}},
        },
      },
    },
  });
  return res.body.hits.hits.map((h) => ({id: h._id, kind: h._source.kind, title: h._source.title, to: h._source.to}));
}
