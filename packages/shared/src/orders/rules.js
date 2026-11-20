import {intakeQuestions} from '../data/intake.js';

// Order life cycle. Staff move an order forward; cancelling a paid order refunds it.
export const ORDER_STEPS = [
  {status: 'pending_payment', label: 'Awaiting payment'},
  {status: 'paid', label: 'Paid'},
  {status: 'in_progress', label: 'In progress'},
  {status: 'completed', label: 'Completed'},
];

export const STAFF_TRANSITIONS = {
  pending_payment: ['cancelled'],
  paid: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const statusLabel = (status) =>
  status === 'cancelled' ? 'Cancelled' : (ORDER_STEPS.find((s) => s.status === status)?.label ?? status);

// A gift needs somewhere to go.
const GIFT_DELIVERY = [
  {id: 'recipientName', label: 'Recipient name', required: true},
  {id: 'address', label: 'Delivery address', placeholder: 'House, street, area, city', required: true},
  {id: 'pincode', label: 'PIN code', placeholder: '6 digits', pattern: '^[1-9]\\d{5}$'},
];

/** Phone is always asked; then the product's own questions. */
export function checkoutQuestions(product, slug) {
  return [
    {id: 'phone', label: 'Phone number', placeholder: '10-digit mobile number', pattern: '^[6-9]\\d{9}$'},
    ...(product === 'giftox' ? GIFT_DELIVERY : []),
    ...intakeQuestions(product, slug),
  ];
}

/**
 * Checks answers against the question set. Returns {answers} with only known
 * keys, or {error}. Choice answers must be one of the options; free text is
 * optional and capped.
 */
export function validateIntake(product, slug, input) {
  const answers = {};
  for (const q of checkoutQuestions(product, slug)) {
    const value = typeof input?.[q.id] === 'string' ? input[q.id].trim() : '';
    if (q.options) {
      if (!q.options.includes(value)) return {error: `Choose an answer for "${q.label}"`};
    } else if (q.pattern) {
      if (!new RegExp(q.pattern).test(value)) return {error: `Enter a valid ${q.label.toLowerCase()}`};
    } else if (q.required && !value) {
      return {error: `Enter "${q.label}"`};
    } else if (value.length > 500) {
      return {error: `"${q.label}" must be 500 characters or fewer`};
    }
    if (value) answers[q.id] = value;
  }
  return {answers};
}
