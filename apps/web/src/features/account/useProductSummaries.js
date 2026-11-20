// One line of real status per product for the ecosystem dashboard, e.g.
// "2 orders, 1 in progress" or "In review". Each product's own API answers;
// a product that fails to answer just shows nothing rather than breaking the page.
import {useEffect, useState} from 'react';
import {formatBharatId} from '@pirento/shared';
import {api} from '../../lib/api/client';

const ORDER_PRODUCTS = ['legal', 'black', 'green', 'giftox'];
const IDENTITY_STATUS = {draft: 'Application started', submitted: 'In review', rejected: 'Needs a change'};
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const SOURCES = {
  orders: async () => {
    const orders = await api('/orders');
    return Object.fromEntries(
      ORDER_PRODUCTS.map((slug) => {
        const mine = orders.filter((o) => o.product === slug);
        const active = mine.filter((o) => ['paid', 'in_progress'].includes(o.status)).length;
        return [slug, mine.length ? `${plural(mine.length, 'order')}${active ? `, ${active} in progress` : ''}` : null];
      }),
    );
  },
  'bharat-id': async () => {
    const doc = await api('/identity/me');
    if (!doc) return {'bharat-id': 'Not started'};
    return {'bharat-id': doc.bharatId ? `ID ${formatBharatId(doc.bharatId)}` : IDENTITY_STATUS[doc.status]};
  },
  intern: async () => ({intern: plural((await api('/learning/me')).certificates.length, 'certificate')}),
  vault: async () => ({vault: plural((await api('/vault/files')).files.length, 'file')}),
  ai: async () => ({ai: plural((await api('/ai/chats')).length, 'chat')}),
  one: async () => {
    const partner = await api('/orders/partner/me');
    return {one: partner ? `Code ${partner.code} · ${plural(partner.orders.length, 'referral')}` : 'Not a partner yet'};
  },
};

export function useProductSummaries() {
  const [lines, setLines] = useState({capital: 'Waitlist open'});
  useEffect(() => {
    let live = true;
    for (const load of Object.values(SOURCES)) {
      load().then(
        (part) => live && setLines((l) => ({...l, ...part})),
        () => {}, // that product's line stays empty
      );
    }
    return () => {
      live = false;
    };
  }, []);
  return lines;
}
