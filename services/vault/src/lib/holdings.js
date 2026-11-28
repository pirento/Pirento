// Turns the financial information an Account Aggregator delivers (ReBIT schemas) into vault records: one per mutual
// fund or ETF holding, one per demat account of stocks, one per insurance policy. Field names vary in case between
// providers, so they are looked up ignoring case and underscores.

const norm = (k) => k.toLowerCase().replace(/[_-]/g, '');

/** obj[name] for the first name present, ignoring case and underscores. */
export function pick(obj, ...names) {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = Object.keys(obj);
  for (const n of names) {
    const k = keys.find((x) => norm(x) === norm(n));
    if (k !== undefined && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const num = (v) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v));
const money = (v) => (num(v) === undefined ? undefined : String(Math.round(num(v) * 100) / 100));
const text = (v) => (v === undefined ? undefined : String(v).slice(0, 4000));
const date = (v) => (v && /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : undefined);
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''));

const summaryOf = (fiData) => {
  const account = pick(fiData, 'account') ?? fiData;
  return pick(account, 'summary') ?? {};
};
const holdingsOf = (summary) => list(pick(pick(pick(summary, 'investment') ?? summary, 'holdings') ?? {}, 'holding'));

/**
 * Records for one delivered account: [{externalId, kind, title, fields}]. `externalId` keeps a refetch updating the
 * same record instead of adding another.
 */
export function recordsFrom({fiType, accountId, masked, fipId, fiData}) {
  const type = String(fiType ?? '').toUpperCase();
  const summary = summaryOf(fiData);
  const base = `digio:${accountId}`;
  if (type === 'MUTUAL_FUNDS') {
    return holdingsOf(summary).map((h, i) => {
      const units = num(pick(h, 'closingUnits', 'units'));
      const nav = num(pick(h, 'nav', 'rate'));
      const fund = text(pick(h, 'schemeName', 'isinDescription', 'amc', 'isin')) ?? 'Mutual fund';
      return {
        externalId: `${base}:${pick(h, 'isin', 'schemeCode') ?? i}`,
        kind: 'mutual-fund',
        title: fund.slice(0, 120),
        fields: clean({
          fund,
          folio: text(pick(h, 'folioNo', 'folio') ?? masked),
          units: units === undefined ? undefined : String(units),
          value: money(pick(h, 'currentValue') ?? (units !== undefined && nav !== undefined ? units * nav : undefined)),
          note: `Fetched through Digio from ${fipId ?? 'your provider'}`,
        }),
      };
    });
  }
  if (type === 'ETF') {
    return holdingsOf(summary).map((h, i) => {
      const units = num(pick(h, 'units', 'closingUnits'));
      const nav = num(pick(h, 'nav', 'lastTradedPrice'));
      const name = text(pick(h, 'isinDescription', 'issuerName', 'isin')) ?? 'ETF';
      return {
        externalId: `${base}:${pick(h, 'isin') ?? i}`,
        kind: 'etf',
        title: name.slice(0, 120),
        fields: clean({
          name,
          demat: text(masked),
          units: units === undefined ? undefined : String(units),
          value: money(units !== undefined && nav !== undefined ? units * nav : undefined),
        }),
      };
    });
  }
  if (type === 'EQUITIES') {
    const rows = holdingsOf(summary).map((h) => {
      const units = num(pick(h, 'units'));
      const price = num(pick(h, 'lastTradedPrice'));
      const name = pick(h, 'issuerName', 'isinDescription', 'isin') ?? 'Share';
      return `${name}: ${units ?? '?'}${price !== undefined ? ` at ₹${price}` : ''}`;
    });
    return [
      {
        externalId: base,
        kind: 'stock',
        title: `Demat ${masked ?? ''}`.trim().slice(0, 120),
        fields: clean({
          broker: text(fipId),
          demat: text(masked),
          holdings: rows.length ? text(rows.join('\n')) : undefined,
          value: money(pick(summary, 'currentValue')),
        }),
      },
    ];
  }
  if (type === 'INSURANCE_POLICIES' || type === 'INSURANCE') {
    const kindName = String(pick(summary, 'policyType', 'coverType') ?? '').toUpperCase();
    const health = kindName.includes('HEALTH') || kindName.includes('MEDICAL');
    const title = text(pick(summary, 'policyName')) ?? 'Insurance policy';
    const policyNo = text(pick(summary, 'policyNumber') ?? masked);
    const renewal = date(pick(summary, 'nextPremiumDueDate', 'policyExpiryDate', 'maturityDate'));
    return [
      {
        externalId: base,
        kind: health ? 'health-insurance' : 'insurance',
        title: title.slice(0, 120),
        fields: clean({
          insurer: text(fipId),
          policyNo,
          cover: money(pick(summary, 'sumAssured', 'coverAmount')),
          ...(health ? {} : {premium: money(pick(summary, 'premiumAmount'))}),
          renewal,
        }),
      },
    ];
  }
  return []; // deposits and other types are not kept in the vault
}
