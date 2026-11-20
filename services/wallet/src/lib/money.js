// Rupees (number, up to 2 decimals) → whole paise. Rejects anything else.
export function toPaise(rupees) {
  const paise = Math.round(rupees * 100);
  if (!Number.isFinite(rupees) || paise <= 0 || Math.abs(paise - rupees * 100) > 1e-6) {
    throw Object.assign(new Error('Amount must be positive with at most 2 decimals'), {
      status: 400,
      code: 'INVALID_AMOUNT',
    });
  }
  return paise;
}
