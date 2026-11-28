// The admin sections, and which staff roles may open each one.
// The same list drives the admin sidebar and the admin router, and mirrors
// the role checks each service makes on its own routes.
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Banknote,
  Briefcase,
  ClipboardList,
  CreditCard,
  FilePlus2,
  GraduationCap,
  Handshake,
  Inbox,
  HeartHandshake,
  LayoutDashboard,
  Mail,
  ListChecks,
  QrCode,
  Megaphone,
  ScrollText,
  SlidersHorizontal,
  TicketPercent,
  UserCog,
  UserPlus,
  UserX,
  ShoppingBag,
  Sparkles,
  Sprout,
  Users,
} from 'lucide-react';

// Mirrors ACCESS in packages/shared/src/server/auth.js; the services enforce it, this only hides links.
const ALL_STAFF = ['support', 'finance', 'staff', 'superadmin'];

const OPS = ['staff', 'superadmin'];
const MONEY = ['finance', 'superadmin'];
const SUPER = ['superadmin'];

// Grouped in the sidebar by `group`, in this order.
export const ADMIN_SECTIONS = [
  {
    id: 'overview',
    group: 'Overview',
    label: 'Overview',
    icon: LayoutDashboard,
    roles: ALL_STAFF,
    intro: 'What needs doing now. Finance and superadmins also see the numbers for the whole ecosystem.',
  },
  {
    id: 'my-work',
    group: 'Work',
    label: 'My work',
    icon: ClipboardList,
    roles: ['support', 'staff', 'superadmin'],
    intro: 'Everything assigned to you: the orders you are working on and the tickets waiting on you.',
  },
  {
    id: 'book',
    group: 'Work',
    label: 'Book a service',
    icon: FilePlus2,
    roles: OPS, // ACCESS.booking
    intro: 'Place an order for a customer, say after a call. It waits in their dashboard and they pay it there.',
  },
  {
    id: 'orders',
    group: 'Work',
    label: 'Orders',
    icon: ShoppingBag,
    roles: ['staff', 'finance', 'superadmin'],
    intro: 'Paid and in-progress orders, oldest first. Take one, move it along, or send the customer a note.',
  },
  {
    id: 'green',
    group: 'Work',
    label: 'Pirento Green',
    icon: Sprout,
    roles: ['staff', 'finance', 'superadmin'], // ACCESS.orders
    intro:
      'The carbon market (price, open or closed, growth rate per drive, trades) for finance and superadmins; trees sponsored and planted, drive by drive; and the sponsorships still waiting for a planting record.',
  },
  {
    id: 'bharat-id',
    group: 'Work',
    label: 'Bharat ID review',
    icon: BadgeCheck,
    roles: OPS,
    intro:
      'Check the Digio video KYC and the signed declaration, then approve or reject. Suspend or restore issued IDs, and review the changes holders ask for.',
  },
  {
    id: 'enrol',
    group: 'Work',
    label: 'New Bharat ID',
    icon: UserPlus,
    roles: ALL_STAFF, // ACCESS.enrol
    intro: 'Start a Bharat ID for someone who is not signed in. They finish it from a link sent by email and SMS.',
  },
  {
    id: 'centres',
    group: 'Work',
    label: 'Enrolment centres',
    icon: QrCode,
    roles: ALL_STAFF, // ACCESS.enrol to see; ACCESS.identity to make and close
    intro:
      'Places where people start their Bharat ID by scanning a QR. Download each centre’s QR or a poster to print.',
  },
  {
    id: 'business',
    group: 'Work',
    label: 'Bharat ID for Business',
    icon: Building2,
    roles: OPS, // ACCESS.business
    intro:
      'Requests for the Bharat ID API. Approving makes their account and emails the sign-in; live access opens after the company details are checked.',
  },
  {
    id: 'tickets',
    group: 'Work',
    label: 'Tickets',
    icon: Inbox,
    roles: ['support', 'staff', 'superadmin'],
    intro: 'Support tickets waiting on the team. Open one to reply, take it, or add a team note.',
  },
  {
    id: 'enquiries',
    group: 'Work',
    label: 'Enquiries',
    icon: Mail,
    roles: ['support', 'staff', 'superadmin'], // ACCESS.support
    intro: 'Messages from the contact form on every site. Reply by email or phone, then mark them handled.',
  },
  {
    id: 'vault',
    group: 'Work',
    label: 'Vault',
    icon: HeartHandshake,
    roles: ['support', 'staff', 'superadmin'], // ACCESS.vault; releasing: superadmin only (ACCESS.vaultRelease)
    intro:
      'Legacy plans that need the team: call the nominee, check the death certificate, release (superadmins), and help claim insurance. Never what is inside a vault.',
  },
  {
    id: 'openings',
    group: 'Work',
    label: 'Openings',
    icon: Megaphone,
    roles: OPS,
    intro:
      'Internships and jobs on the Pirento Intern site: post your own, approve what companies post, and take each applicant from shortlist to interview, offer, tasks and certificate.',
  },
  {
    id: 'companies',
    group: 'Work',
    label: 'Intern companies',
    icon: Building2,
    roles: OPS, // ACCESS.openings
    intro: 'Companies asking to post internships. Approve them first; each opening they post is reviewed again.',
  },
  {
    id: 'waitlist',
    group: 'Work',
    label: 'Capital waitlist',
    icon: ListChecks,
    roles: ['support', 'staff', 'superadmin'],
    intro: 'People who asked to hear when Pirento Capital starts lending.',
  },
  {
    id: 'users',
    group: 'People',
    label: 'Users',
    icon: Users,
    roles: ['support', 'finance', 'superadmin'],
    intro: 'Find any account. Open one to see its orders, wallet and Bharat ID.',
  },
  {
    id: 'team',
    group: 'People',
    label: 'Team',
    icon: UserCog,
    roles: SUPER,
    intro: 'Everyone with a staff role, the products they work on, and their open orders.',
  },
  {
    id: 'deletions',
    group: 'People',
    label: 'Account deletions',
    icon: UserX,
    roles: SUPER,
    intro: 'People who asked to delete their account. Approving forgets them across every service.',
  },
  {
    id: 'payments',
    group: 'Money',
    label: 'Payments',
    icon: CreditCard,
    roles: MONEY,
    intro: 'Every wallet movement across all accounts.',
  },
  {
    id: 'withdrawals',
    group: 'Money',
    label: 'Withdrawals',
    icon: Banknote,
    roles: MONEY,
    intro:
      'Customers asking to take wallet money out. Send it through RazorpayX when it is set up, or by UPI yourself and mark it paid with the UTR.',
  },
  {
    id: 'coupons',
    group: 'Money',
    label: 'Discount codes',
    icon: TicketPercent,
    roles: MONEY,
    intro: 'Codes customers type at checkout. The server checks every code; the browser never sets a price.',
  },
  {
    id: 'partners',
    group: 'Money',
    label: 'Partners',
    icon: Handshake,
    roles: MONEY,
    intro: 'Pirento One plans, partners, the orders their code brought in, and their commission.',
  },
  {
    id: 'certificates',
    group: 'Records',
    label: 'Certificates',
    icon: GraduationCap,
    roles: OPS,
    intro: 'Pirento Intern certificates issued.',
  },
  {
    id: 'programme',
    group: 'Work',
    label: 'Intern programme',
    icon: GraduationCap,
    roles: OPS, // ACCESS.openings; prices are superadmin only
    intro:
      'The 3, 6, 9 and 12-month programmes: prices, who is enrolled and their mark, live classes and recordings, and practice tasks the AI could not grade.',
  },
  {
    id: 'intern-work',
    group: 'Work',
    label: 'Intern paid work',
    icon: Briefcase,
    roles: OPS,
    intro:
      'Paid work from across Pirento for eligible interns. The AI suggests who fits and why; you confirm, review, and approving pays their wallet.',
  },
  {
    id: 'ai',
    group: 'Records',
    label: 'Pirento AI',
    icon: Sparkles,
    roles: ['support', 'staff', 'superadmin'], // ACCESS.ai; settings and plans: superadmin
    intro:
      'How much the assistant is used, its switch and free allowance, paid plans, the knowledge it answers from, and answers people rated.',
  },
  {
    id: 'courses',
    group: 'Records',
    label: 'Intern courses',
    icon: BookOpen,
    roles: OPS, // ACCESS.learning
    intro:
      'Each track: exam time, pass mark and how many questions are drawn; the questions you add to its bank; and its lessons with practice questions.',
  },
  {
    id: 'services',
    group: 'Records',
    label: 'Services & prices',
    icon: Briefcase,
    roles: ALL_STAFF,
    intro:
      'Every service and its price. Finance and superadmins change a price or take a service off sale; superadmins add services, set each one’s packages and page, and the questions asked before and after payment.',
  },
  {
    id: 'settings',
    group: 'Records',
    label: 'Site settings',
    icon: SlidersHorizontal,
    roles: SUPER,
    intro: 'The announcement banner, and pausing checkout for a product.',
  },
  {
    id: 'audit',
    group: 'Records',
    label: 'Audit trail',
    icon: ScrollText,
    roles: SUPER,
    intro: 'Every staff action: roles, suspensions, money, orders, IDs, tickets, settings.',
  },
];

export const isStaffRole = (role) => ALL_STAFF.includes(role);
/** Where someone's own area is: staff work in the admin, customers in their dashboard. */
export const homeFor = (user) => (isStaffRole(user?.role) ? '/admin' : '/dashboard');
export const sectionsFor = (role) => ADMIN_SECTIONS.filter((s) => s.roles.includes(role));

export const ROLES = ['customer', 'support', 'finance', 'staff', 'superadmin'];
export const roleLabel = (role) =>
  ({superadmin: 'Superadmin', staff: 'Operations', finance: 'Finance', support: 'Support'})[role] ?? 'Customer';
export const ACCESS_OF = (id) => ADMIN_SECTIONS.find((s) => s.id === id)?.roles ?? [];
