// Password health, judged on the server so a saved password never travels just to be checked.

// A short list of the passwords people pick most; anything here is weak whatever its length.
const COMMON = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'abc123',
  '111111',
  'iloveyou',
  'admin',
  'welcome',
  'india123',
  'letmein',
  'monkey',
  'dragon',
  '000000',
]);

/** Weak: shorter than 10, fewer than three kinds of character, or a common password. */
export function isWeak(password) {
  if (password.length < 10 || COMMON.has(password.toLowerCase())) return true;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  return kinds < 3;
}

/** For each entry: weak, and reused (the same password saved under another entry). Never the password itself. */
export function healthOf(entries) {
  const count = new Map();
  for (const e of entries) count.set(e.password, (count.get(e.password) ?? 0) + 1);
  return entries.map((e) => ({_id: e._id, weak: isWeak(e.password), reused: count.get(e.password) > 1}));
}
