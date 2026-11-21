// Order life cycle. Staff move an order forward; cancelling a paid order refunds it.
import {intakeQuestions} from '../data/intake.js';

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

/** Phone is always asked; then the product's own questions, or the set an admin gave this service. */
export function checkoutQuestions(product, slug, own) {
  return [
    {id: 'phone', label: 'Phone number', placeholder: '10-digit mobile number', pattern: '^[6-9]\\d{9}$'},
    ...(product === 'giftox' ? GIFT_DELIVERY : []),
    ...(own ?? intakeQuestions(product, slug)),
  ];
}

/** Ids an admin's question may not take: checkout asks these itself. */
export const FIXED_QUESTION_IDS = ['phone', ...GIFT_DELIVERY.map((q) => q.id)];

/** The questions before payment for a service as it sells now (see applyEdit in the catalogue). */
export const serviceQuestions = (service) => checkoutQuestions(service.product, service.slug, service.questions);

/** The questions an order was asked: kept on the order since admin may change them; older orders use the defaults. */
export const askedQuestions = (order) => order.asked ?? checkoutQuestions(order.product, order.serviceSlug);

/** Whether a live order still waits on the customer's answers to its after-payment questions. */
export const needsDetails = (order) =>
  ['paid', 'in_progress'].includes(order.status) && order.afterQuestions?.length > 0 && !order.detailsAt;

/**
 * What the team records when it delivers a Green or Giftox order, and the line the customer is emailed.
 * The customer sees the same record on their order.
 */
export const FULFILMENT = {
  green: {
    title: 'Trees planted',
    fields: [
      {id: 'site', label: 'Planting site', placeholder: 'Village, block, district', required: true},
      {
        id: 'plantedOn',
        label: 'Planted on',
        placeholder: 'YYYY-MM-DD',
        pattern: '^20\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
      },
      {id: 'lat', label: 'Latitude', placeholder: 'e.g. 26.9124', pattern: '^-?\\d{1,2}(\\.\\d{1,6})?$'},
      {id: 'lng', label: 'Longitude', placeholder: 'e.g. 75.7873', pattern: '^-?\\d{1,3}(\\.\\d{1,6})?$'},
    ],
    note: (order, d) =>
      `${order.quantity} tree${order.quantity === 1 ? '' : 's'} planted at ${d.site} on ${d.plantedOn}. Open your order for the spot on the map.`,
  },
  giftox: {
    title: 'Gift dispatched',
    fields: [
      {id: 'courier', label: 'Courier', placeholder: 'e.g. Delhivery', required: true},
      {
        id: 'tracking',
        label: 'Tracking number (AWB)',
        placeholder: 'From the courier slip',
        pattern: '^[A-Za-z0-9-]{4,40}$',
      },
    ],
    note: (order, d) => `Your gift box is on its way with ${d.courier}. Tracking number: ${d.tracking}.`,
  },
};

/** Checks the team's delivery record for an order's product. Same rules as checkout answers. */
export const validateFulfilment = (product, input) =>
  FULFILMENT[product]
    ? checkAnswers(FULFILMENT[product].fields, input)
    : {error: 'This product has no delivery record'};

/**
 * Checks answers against a question set. Returns {answers} with only known
 * keys, or {error}. Choice answers must be one of the options; free text is
 * optional unless `required`, and capped.
 */
export const validateIntake = (service, input) => checkAnswers(serviceQuestions(service), input);

export function checkAnswers(questions, input) {
  const answers = {};
  for (const q of questions) {
    const value = typeof input?.[q.id] === 'string' ? input[q.id].trim() : '';
    if (q.options) {
      if (!q.options.includes(value)) return {error: `Choose an answer for "${q.label}"`};
    } else if (q.pattern) {
      if (!new RegExp(q.pattern).test(value))
        return {error: `Enter a valid ${q.label[0].toLowerCase()}${q.label.slice(1)}`};
    } else if (q.required && !value) {
      return {error: `Enter "${q.label}"`};
    } else if (value.length > 500) {
      return {error: `"${q.label}" must be 500 characters or fewer`};
    }
    if (value) answers[q.id] = value;
  }
  return {answers};
}
