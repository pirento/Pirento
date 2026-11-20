/** "Asha Rani Verma" → "Asha V.": enough to recognise someone, not enough to profile them. */
export function publicName(fullName) {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  return rest.length ? `${first} ${rest.at(-1)[0]}.` : first;
}
