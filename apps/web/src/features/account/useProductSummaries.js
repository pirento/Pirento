// One line of real status per product for the hub, and whether you use that product at all, e.g.
// "2 requests, 1 in progress". Each product's own API answers; one that fails just shows nothing.
import {useEffect, useState} from 'react';
import {formatBharatId} from '@pirento/shared';
import {api} from '../../lib/api/client';

const ORDER_PRODUCTS = ['legal', 'black', 'green', 'giftox'];
const IDENTITY_STATUS = {draft: 'Application started', submitted: 'In review', rejected: 'Needs a change'};
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** {slug: {line, used}}: `used` puts the product among "your products" on the hub. */
const one = (slug, line, used) => ({[slug]: {line, used}});

const SOURCES = {
  orders: async () => {
    const orders = await api('/orders');
    return Object.assign(
      {},
      ...ORDER_PRODUCTS.map((slug) => {
        const mine = orders.filter((o) => o.product === slug);
        const active = mine.filter((o) => ['paid', 'in_progress'].includes(o.status)).length;
        return one(
          slug,
          mine.length ? `${plural(mine.length, 'order')}${active ? `, ${active} in progress` : ''}` : null,
          mine.length > 0,
        );
      }),
    );
  },
  'bharat-id': async () => {
    const doc = await api('/identity/me');
    if (!doc) return one('bharat-id', 'Not started', false);
    return one('bharat-id', doc.bharatId ? `ID ${formatBharatId(doc.bharatId)}` : IDENTITY_STATUS[doc.status], true);
  },
  intern: async () => {
    const me = await api('/learning/me');
    return one(
      'intern',
      plural(me.certificates.length, 'certificate'),
      me.certificates.length + me.attempts.length > 0,
    );
  },
  vault: async () => {
    const n = (await api('/vault/files')).files.length;
    return one('vault', plural(n, 'file'), n > 0);
  },
  ai: async () => {
    const n = (await api('/ai/chats')).length;
    return one('ai', plural(n, 'chat'), n > 0);
  },
  one: async () => {
    const partner = await api('/orders/partner/me');
    return one(
      'one',
      partner ? `Code ${partner.code} · ${plural(partner.orders.length, 'referral')}` : 'Not a partner yet',
      Boolean(partner),
    );
  },
};

export function useProductSummaries() {
  const [summaries, setSummaries] = useState({capital: {line: 'Waitlist open', used: false}});
  useEffect(() => {
    let live = true;
    for (const load of Object.values(SOURCES)) {
      load().then(
        (part) => live && setSummaries((s) => ({...s, ...part})),
        () => {}, // that product's line stays empty
      );
    }
    return () => {
      live = false;
    };
  }, []);
  return summaries;
}
