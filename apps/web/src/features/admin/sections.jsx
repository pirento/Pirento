// What each admin section renders. Which roles see which section lives in adminNav.js.
import {StaffQueue} from './StaffQueue';
import {Overview} from './Overview';
import {Users} from './Users';
import {Payments} from './Payments';
import {Certificates} from './Certificates';
import {Partners} from './Partners';
import {Services} from './Services';
import {Audit} from './Audit';
import {Withdrawals} from './Withdrawals';
import {Coupons} from './Coupons';
import {Team} from './Team';
import {Waitlist} from './Waitlist';
import {Enquiries} from './Enquiries';
import {Deletions} from './Deletions';
import {MyWork} from './MyWork';
import {BookService} from './BookService';
import {Settings} from './Settings';
import {Openings} from './Openings';
import {Companies} from './Companies';
import {Courses} from './Courses';
import {Programme} from './Programme';
import {InternWork} from './InternWork';
import {IdentityQueue} from '../identity/IdentityQueue';
import {BusinessQueue} from '../business/BusinessQueue';
import {EnrolQueue} from '../identity/EnrolQueue';
import {Centres} from '../identity/Centres';
import {FILTERS, StaffOrder} from '../orders/StaffOrder';
import {TicketQueue} from '../support/TicketQueue';

export const SECTIONS = {
  overview: Overview,
  'my-work': MyWork,
  book: BookService,
  orders: () => (
    <StaffQueue
      path="/orders/staff/queue"
      filters={FILTERS}
      byProduct={{}}
      search="Order number, email or service"
      render={(o, reload) => <StaffOrder key={o._id} order={o} onChange={reload} />}
    />
  ),
  // Wrapped so the import cycle (those pages import helpers from here) resolves at render time.
  'bharat-id': () => <IdentityQueue />,
  business: () => <BusinessQueue />,
  enrol: () => <EnrolQueue />,
  centres: () => <Centres />,
  tickets: () => <TicketQueue />,
  enquiries: Enquiries,
  users: Users,
  payments: Payments,
  withdrawals: Withdrawals,
  coupons: Coupons,
  team: Team,
  waitlist: Waitlist,
  deletions: Deletions,
  settings: Settings,
  openings: Openings,
  companies: Companies,
  courses: Courses,
  programme: Programme,
  'intern-work': InternWork,
  certificates: Certificates,
  partners: Partners,
  services: Services,
  audit: Audit,
};
