// Checks that AA data in the ReBIT shapes becomes the right vault records.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordsFrom} from './holdings.js';

test('mutual fund holdings become one record each, valued at units × NAV', () => {
  const out = recordsFrom({
    fiType: 'MUTUAL_FUNDS',
    accountId: 'A1',
    masked: 'XXXX6704',
    fipId: 'CAMS',
    fiData: {
      account: {
        summary: {
          investment: {
            holdings: {
              holding: [
                {isin: 'INF1', schemeName: 'Index Fund', folioNo: 'F1', closingUnits: '10.5', nav: '100'},
                {isin: 'INF2', amc: 'Some AMC', closing_units: 2, nav: 50},
              ],
            },
          },
        },
      },
    },
  });
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], {
    externalId: 'digio:A1:INF1',
    kind: 'mutual-fund',
    title: 'Index Fund',
    fields: {fund: 'Index Fund', folio: 'F1', units: '10.5', value: '1050', note: 'Fetched through Digio from CAMS'},
  });
  assert.equal(out[1].fields.value, '100');
  assert.equal(out[1].fields.folio, 'XXXX6704');
});

test('stocks are one record per demat account, insurance one per policy', () => {
  const [stock] = recordsFrom({
    fiType: 'EQUITIES',
    accountId: 'D1',
    masked: 'XX12',
    fipId: 'CDSL',
    fiData: {
      Account: {Summary: {currentValue: '2500', Investment: {Holdings: {Holding: {issuerName: 'ACME', units: 5}}}}},
    },
  });
  assert.equal(stock.kind, 'stock');
  assert.equal(stock.fields.holdings, 'ACME: 5');
  assert.equal(stock.fields.value, '2500');

  const [health] = recordsFrom({
    fiType: 'INSURANCE_POLICIES',
    accountId: 'P1',
    fiData: {
      account: {summary: {policyName: 'Family Floater', policyType: 'HEALTH', policyNumber: 'H9', sumAssured: 500000}},
    },
  });
  assert.equal(health.kind, 'health-insurance');
  assert.equal(health.fields.policyNo, 'H9');
  assert.equal(health.fields.cover, '500000');
  assert.deepEqual(recordsFrom({fiType: 'DEPOSIT', accountId: 'X', fiData: {}}), []);
});
