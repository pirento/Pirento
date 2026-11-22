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

/** A day with no time: start dates, due dates. */
export const formatDay = (d) =>
  new Date(d).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});

/** Sends signed-out visitors to /login and back here afterwards. */
