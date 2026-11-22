import {test} from 'node:test';
import assert from 'node:assert/strict';
import {declarationPdf, wrap} from './declaration.js';

const doc = {
  _id: 'abc123',
  email: 'a@example.com',
  sections: {personal: {fullName: 'Asha (Test) Rao', dob: '1990-01-01'}, documents: {aadhaar: 'XXXX XXXX 1234'}},
};

test('wraps at spaces within the width', () => {
  assert.deepEqual(wrap('aa bb cc', 5), ['aa bb', 'cc']);
});

test('builds a PDF whose xref points at each object', () => {
  const pdf = declarationPdf(doc, new Date('2026-01-01')).toString('latin1');
  assert.ok(pdf.startsWith('%PDF-1.4') && pdf.trimEnd().endsWith('%%EOF'));
  assert.ok(pdf.includes('Asha \\(Test\\) Rao') && pdf.includes('XXXX XXXX 1234'));
  const xref = Number(pdf.match(/startxref\n(\d+)/)[1]);
  assert.ok(pdf.slice(xref).startsWith('xref'));
  for (const [i, off] of [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((m, i) => [i + 1, Number(m[1])])) {
    assert.ok(pdf.slice(off).startsWith(`${i} 0 obj`), `object ${i}`);
  }
});
