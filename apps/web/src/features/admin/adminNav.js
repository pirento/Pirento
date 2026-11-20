// The admin sections, and which staff roles may open each one.
// The same list drives the admin sidebar and the admin router, and mirrors
// the role checks each service makes on its own routes.
import {
  BadgeCheck,
  Briefcase,
  CreditCard,
  GraduationCap,
  Handshake,
  Inbox,
  LayoutDashboard,
  ScrollText,
  ShoppingBag,
  Users,
} from 'lucide-react';

// Mirrors ACCESS in packages/shared/src/server/auth.js; the services enforce it, this only hides links.
const ALL_STAFF = ['support', 'finance', 'staff', 'superadmin'];

export const ADMIN_SECTIONS = [
  {
    id: 'overview',
    intro: "Today's numbers across the ecosystem and the last 30 days.",
    label: 'Overview',
    icon: LayoutDashboard,
    roles: ALL_STAFF,
  },
  {
    id: 'orders',
    intro: 'Paid and in-progress orders, oldest first. Move each one along or cancel it.',
    label: 'Orders',
    icon: ShoppingBag,
    roles: ['staff', 'finance', 'superadmin'],
  },
  {
    id: 'bharat-id',
    intro: 'Submitted applications. Watch the video KYC, then approve or reject.',
    label: 'Bharat ID review',
    icon: BadgeCheck,
    roles: ['staff', 'superadmin'],
  },
  {
    id: 'tickets',
    intro: 'Support tickets waiting on the team.',
    label: 'Tickets',
    icon: Inbox,
    roles: ['support', 'staff', 'superadmin'],
  },
  {
    id: 'users',
    intro: 'Find any account. Open one to see its orders, wallet and Bharat ID.',
    label: 'Users',
    icon: Users,
    roles: ['support', 'finance', 'superadmin'],
  },
  {
    id: 'payments',
    intro: 'Every wallet movement across all accounts.',
    label: 'Payments',
    icon: CreditCard,
    roles: ['finance', 'superadmin'],
  },
  {
    id: 'certificates',
    intro: 'Pirento Intern certificates issued.',
    label: 'Certificates',
    icon: GraduationCap,
    roles: ['staff', 'superadmin'],
  },
  {
    id: 'partners',
    intro: 'Pirento One partners and the orders their code brought in.',
    label: 'Partners',
    icon: Handshake,
    roles: ['finance', 'superadmin'],
  },
  {
    id: 'services',
    intro: 'Every service on sale and its price, read from the catalogue.',
    label: 'Services & prices',
    icon: Briefcase,
    roles: ALL_STAFF,
  },
  {
    id: 'audit',
    intro: 'Every staff action: role changes, suspensions, order moves, ID decisions.',
    label: 'Audit trail',
    icon: ScrollText,
    roles: ['superadmin'],
  },
];

export const isStaffRole = (role) => ALL_STAFF.includes(role);
export const sectionsFor = (role) => ADMIN_SECTIONS.filter((s) => s.roles.includes(role));

export const ROLES = ['customer', 'support', 'finance', 'staff', 'superadmin'];
export const roleLabel = (role) =>
  ({superadmin: 'Superadmin', staff: 'Operations', finance: 'Finance', support: 'Support'})[role] ?? 'Customer';
export const ACCESS_OF = (id) => ADMIN_SECTIONS.find((s) => s.id === id)?.roles ?? [];
