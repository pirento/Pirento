// The work queues shown as admin sections.
import {StaffQueue} from './StaffQueue';
import {IdentityQueue} from '../identity/IdentityQueue';
import {FILTERS, StaffOrder} from '../orders/StaffOrder';
import {TicketQueue} from '../support/TicketQueue';

export const STAFF_SECTIONS = {
  Orders: () => (
    <StaffQueue
      path="/orders/staff/queue"
      filters={FILTERS}
      render={(o, reload) => <StaffOrder key={o._id} order={o} onChange={reload} />}
    />
  ),
  // Wrapped so the import cycle (those pages import helpers from here) resolves at render time.
  'Bharat ID': () => <IdentityQueue />,
  Tickets: () => <TicketQueue />,
};

/** Old address of the work queue; it now lives inside the admin dashboard. */
