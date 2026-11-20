// Money and date formatting, Indian style.
export const inr = (rupees) =>
  new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0}).format(rupees);

export const formatDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Sends signed-out visitors to /login and back here afterwards. */
