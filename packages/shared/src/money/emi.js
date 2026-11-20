/** Reducing-balance EMI: P·r·(1+r)^n / ((1+r)^n − 1), with r the monthly rate. */
export function emi(principal, annualPercent, months) {
  if (!principal || !months) return 0;
  const r = annualPercent / 12 / 100;
  if (!r) return principal / months;
  const f = (1 + r) ** months;
  return (principal * r * f) / (f - 1);
}
