// Opening a ticket, the one way every door does it (the support desk, Pirento AI, WhatsApp): numbered, sorted in the
// background, and confirmed to the customer with its number on their notification channels.
import {getProduct} from '@pirento/shared';
import {nextSeq, notify} from '@pirento/shared/server';
import {Ticket} from '../models/Ticket.js';
import {triage} from './triage.js';

export async function openTicket({userId, email, subject, message, product, orderNo, priority, via}) {
  const ticket = await Ticket.create({
    ticketNo: (await nextSeq('ticket')) + 10_000_000,
    userId,
    email,
    subject,
    orderNo,
    product,
    ...(priority && {priority}),
    ...(via && {via}),
    messages: [{from: 'customer', body: message}],
  });
  triage(ticket); // in the background
  notify(userId, {
    event: 'ticket.opened',
    brand: getProduct(product ?? '')?.name ?? 'Pirento',
    label: `Ticket #${ticket.ticketNo}`,
    big: 'We have your request',
    note: `"${subject}". Our team replies here and on your notification channels; keep the ticket number handy.`,
    link: `/support/${ticket._id}`,
  });
  return ticket;
}
