// Pirento Green's credit arithmetic. Credits are held in units of 0.01 credit; money is in paise.
const YEAR_MS = 365.25 * 86_400_000;

/** Whole units grown by `trees` at `rate` credits per tree per year, between two dates. Never negative. */
export function grownUnits(trees, rate, from, to = new Date()) {
  const years = (new Date(to) - new Date(from)) / YEAR_MS;
  if (!(rate > 0) || !(years > 0)) return 0;
  return Math.floor(trees * rate * years * 100);
}

/** Paise for `units` at `price` paise per credit: a buyer pays the rounded-up amount, a seller gets it rounded down. */
export const costOf = (units, price, side) => (side === 'buy' ? Math.ceil : Math.floor)((units * price) / 100);

/** "12.34" for 1234 units. */
export const credits = (units) => (units / 100).toFixed(2);
