// Pirento Vault's records and legacy rules, shared by the browser and the vault service: the kinds of record a person
// keeps (each with its own fields), how a record is checked, and the check-in schedule that starts a nominee's release.

// Field types: text (one line), long (many lines), number (₹ or units), date, secret (sealed and shown only on
// request, like a password). Every field is optional except the record's title.
const f = (id, label, type = 'text') => ({id, label, type});

/** The kinds of record, grouped as the dashboard shows them. `linked`: shown in Linked accounts. */
export const VAULT_KINDS = [
  {
    id: 'login',
    group: 'Logins',
    label: 'User ID',
    fields: [
      f('site', 'Website or app'),
      f('userId', 'User ID'),
      f('password', 'Password', 'secret'),
      f('note', 'Note', 'long'),
    ],
  },
  {
    id: 'bank',
    group: 'Money',
    label: 'Bank account',
    fields: [
      f('bank', 'Bank'),
      f('accountNo', 'Account number', 'secret'),
      f('ifsc', 'IFSC'),
      f('branch', 'Branch'),
      f('balance', 'Balance (₹)', 'number'),
      f('note', 'Note', 'long'),
    ],
  },
  {
    id: 'account',
    group: 'Money',
    label: 'Other account',
    fields: [
      f('provider', 'Where it is held'),
      f('accountNo', 'Account or folio number', 'secret'),
      f('value', 'Value (₹)', 'number'),
      f('note', 'Note', 'long'),
    ],
  },
  {
    id: 'mutual-fund',
    group: 'Investments',
    label: 'Mutual fund',
    linked: true,
    fields: [
      f('fund', 'Fund'),
      f('folio', 'Folio number', 'secret'),
      f('units', 'Units', 'number'),
      f('value', 'Value (₹)', 'number'),
      f('note', 'Note', 'long'),
    ],
  },
  {
    id: 'stock',
    group: 'Investments',
    label: 'Stocks',
    linked: true,
    fields: [
      f('broker', 'Broker'),
      f('demat', 'Demat account', 'secret'),
      f('holdings', 'Holdings', 'long'),
      f('value', 'Value (₹)', 'number'),
    ],
  },
  {
    id: 'etf',
    group: 'Investments',
    label: 'ETF',
    linked: true,
    fields: [
      f('name', 'ETF'),
      f('demat', 'Demat account', 'secret'),
      f('units', 'Units', 'number'),
      f('value', 'Value (₹)', 'number'),
    ],
  },
  {
    id: 'insurance',
    group: 'Insurance',
    label: 'Life or other insurance',
    linked: true,
    fields: [
      f('insurer', 'Insurer'),
      f('policyNo', 'Policy number', 'secret'),
      f('cover', 'Sum assured (₹)', 'number'),
      f('premium', 'Premium (₹)', 'number'),
      f('renewal', 'Next renewal', 'date'),
      f('nominee', 'Nominee on the policy'),
    ],
  },
  {
    id: 'health-insurance',
    group: 'Insurance',
    label: 'Health insurance',
    linked: true,
    fields: [
      f('insurer', 'Insurer'),
      f('policyNo', 'Policy number', 'secret'),
      f('cover', 'Cover (₹)', 'number'),
      f('members', 'Members covered'),
      f('renewal', 'Next renewal', 'date'),
      f('tpa', 'TPA or helpline'),
    ],
  },
  {
    id: 'lent',
    group: 'Udhaar',
    label: 'Money lent (to get back)',
    fields: [
      f('person', 'Given to'),
      f('mobile', 'Their mobile'),
      f('amount', 'Amount (₹)', 'number'),
      f('date', 'Given on', 'date'),
      f('note', 'Note', 'long'),
    ],
  },
  {
    id: 'owed',
    group: 'Udhaar',
    label: 'Money owed (to pay back)',
    fields: [
      f('person', 'Owed to'),
      f('mobile', 'Their mobile'),
      f('amount', 'Amount (₹)', 'number'),
      f('due', 'Due on', 'date'),
      f('note', 'Note', 'long'),
    ],
  },
  {
    id: 'dream',
    group: 'Life',
    label: 'Dream or goal',
    fields: [
      f('goal', 'The dream'),
      f('target', 'Target (₹)', 'number'),
      f('by', 'By', 'date'),
      f('note', 'Note', 'long'),
    ],
  },
  {
    id: 'will',
    group: 'Life',
    label: 'Will or wishes',
    fields: [
      f('wishes', 'Your wishes', 'long'),
      f('executor', 'Executor'),
      f('registered', 'Registered will: where and when'),
      f('note', 'Note', 'long'),
    ],
  },
  {id: 'note', group: 'Life', label: 'Note', fields: [f('text', 'Note', 'long')]},
  {
    id: 'other',
    group: 'Life',
    label: 'Anything else',
    fields: [f('details', 'Details', 'long'), f('secret', 'Secret part', 'secret')],
  },
];

export const vaultKind = (id) => VAULT_KINDS.find((k) => k.id === id);

const LIMIT = {text: 200, long: 4000, secret: 500, number: 20, date: 10};

/**
 * Checks a record against its kind: a title, only that kind's fields, each within its length, numbers as numbers
 * and dates as YYYY-MM-DD. Returns {data} (fields trimmed, empty ones dropped) or {error}.
 */
export function validateRecord(kindId, title, fields = {}) {
  const kind = vaultKind(kindId);
  if (!kind) return {error: 'Choose what kind of record this is'};
  const name = String(title ?? '').trim();
  if (!name) return {error: 'Give the record a title'};
  if (name.length > 120) return {error: 'Keep the title under 120 characters'};
  const data = {};
  for (const field of kind.fields) {
    const v = String(fields[field.id] ?? '').trim();
    if (!v) continue;
    if (v.length > LIMIT[field.type]) return {error: `${field.label} is too long`};
    if (field.type === 'number' && !/^\d+(\.\d{1,2})?$/.test(v)) return {error: `${field.label}: numbers only`};
    if (field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return {error: `${field.label}: use a date`};
    data[field.id] = v;
  }
  const extra = Object.keys(fields).find((id) => !kind.fields.some((x) => x.id === id));
  if (extra) return {error: 'Unknown field'};
  return {data: {kind: kind.id, title: name, fields: data}};
}

/**
 * The check-in that starts a release. A person is "seen" each time they use the vault or answer a reminder. After
 * `quietMonths` with no sign of them, a reminder goes in each of `reminderMonths` (email and SMS; WhatsApp is
 * Expected); if none is answered, the team calls the nominee. Nothing is released until the team has verified a death
 * certificate.
 */
export const LEGACY = {
  quietMonths: 3,
  reminderMonths: [4, 5, 6],
  callAfterMonths: 6,
  // The stages of a case, in order. A sign of life at any point before "verified" returns it to "active".
  stages: ['active', 'reminding', 'call-nominee', 'nominee-reached', 'verified', 'released', 'closed'],
};

/** Which stage a quiet account is in after `months` without a sign of life (whole months). */
export function quietStage(months) {
  if (months < LEGACY.quietMonths + 1) return {stage: 'active', reminder: 0};
  if (months <= LEGACY.callAfterMonths)
    return {stage: 'reminding', reminder: LEGACY.reminderMonths.filter((m) => m <= months).length};
  return {stage: 'call-nominee', reminder: LEGACY.reminderMonths.length};
}
