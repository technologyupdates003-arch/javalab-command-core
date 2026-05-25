import {
  MessageSquare,
  ShoppingCart,
  Server,
  Globe,
  Wallet,
  GraduationCap,
  Stethoscope,
  Users,
  CalendarDays,
  Smartphone,
  Layout,
  type LucideIcon,
} from "lucide-react";

export type ProductSlug =
  | "bulk-sms"
  | "retail-pos"
  | "hosting"
  | "domains"
  | "wallet"
  | "school"
  | "hospital"
  | "hr"
  | "booking"
  | "mobile-apps"
  | "website";

export type WorkspaceNavItem = {
  label: string;
  to: string; // relative path under /app/$slug/<product>
};

export type ProductDef = {
  slug: ProductSlug;
  name: string;
  category: string;
  tagline: string;
  icon: LucideIcon;
  monthly: number; // KES
  currency: string;
  features: string[];
  // Workspace route segment (matches src/routes/app.$slug.<segment>.tsx)
  workspacePath: string;
  // Sidebar items shown inside the product workspace
  nav: WorkspaceNavItem[];
  available: boolean; // true if it has a real workspace, false = coming soon stub
};

export const PRODUCTS: ProductDef[] = [
  {
    slug: "bulk-sms",
    name: "Bulk SMS",
    category: "Communication",
    tagline: "Send SMS campaigns and transactional messages across Kenya.",
    icon: MessageSquare,
    monthly: 999,
    currency: "KES",
    features: ["Sender IDs", "Contact groups", "Templates", "Scheduling", "Delivery reports", "Developer API"],
    workspacePath: "sms",
    nav: [
      { label: "Overview", to: "" },
      { label: "Compose & Send", to: "?tab=send" },
      { label: "Contacts", to: "?tab=contacts" },
      { label: "Sender IDs", to: "?tab=senders" },
      { label: "History", to: "?tab=history" },
    ],
    available: true,
  },
  {
    slug: "retail-pos",
    name: "Retail POS",
    category: "Point of Sale",
    tagline: "Modern point-of-sale for shops, restaurants and pharmacies.",
    icon: ShoppingCart,
    monthly: 2499,
    currency: "KES",
    features: ["Sales & checkout", "Inventory", "Staff & cashiers", "Customers", "Reports", "Multi-branch"],
    workspacePath: "pos",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "hosting",
    name: "Web Hosting",
    category: "Infrastructure",
    tagline: "cPanel hosting on fast SSD servers with free SSL.",
    icon: Server,
    monthly: 499,
    currency: "KES",
    features: ["cPanel", "Free SSL", "Email accounts", "Daily backups", "99.9% uptime"],
    workspacePath: "hosting",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "domains",
    name: "Domain Names",
    category: "Infrastructure",
    tagline: "Register and manage .com, .co.ke and 100+ TLDs.",
    icon: Globe,
    monthly: 0,
    currency: "KES",
    features: ["Domain search", "Registration", "DNS", "Auto-renew", "Privacy"],
    workspacePath: "domains",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "wallet",
    name: "Wallet & Payments",
    category: "Fintech",
    tagline: "Collect M-Pesa payments and manage your float.",
    icon: Wallet,
    monthly: 0,
    currency: "KES",
    features: ["M-Pesa STK push", "Collections", "Wallet float", "Reconciliation"],
    workspacePath: "wallet",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "school",
    name: "School Management",
    category: "Education",
    tagline: "End-to-end school management for academies and colleges.",
    icon: GraduationCap,
    monthly: 4999,
    currency: "KES",
    features: ["Students", "Fees", "Attendance", "Exams", "Parent SMS"],
    workspacePath: "school",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "hospital",
    name: "Hospital Management",
    category: "Healthcare",
    tagline: "Clinics & hospitals — patients, billing, prescriptions.",
    icon: Stethoscope,
    monthly: 5999,
    currency: "KES",
    features: ["Patients", "Appointments", "Billing", "Prescriptions", "Lab"],
    workspacePath: "hospital",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "hr",
    name: "HR Management",
    category: "Workforce",
    tagline: "Payroll, attendance and HR for growing teams.",
    icon: Users,
    monthly: 1999,
    currency: "KES",
    features: ["Staff", "Payroll", "Attendance", "Leave"],
    workspacePath: "hr",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "booking",
    name: "Booking System",
    category: "Operations",
    tagline: "Appointments and reservations for service businesses.",
    icon: CalendarDays,
    monthly: 1499,
    currency: "KES",
    features: ["Online booking", "Calendar", "Reminders", "Staff schedules"],
    workspacePath: "booking",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "mobile-apps",
    name: "Mobile Apps",
    category: "Custom",
    tagline: "Custom Android & iOS apps built for your business.",
    icon: Smartphone,
    monthly: 0,
    currency: "KES",
    features: ["Quote-based", "Design", "Development", "Maintenance"],
    workspacePath: "mobile-apps",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
  {
    slug: "website",
    name: "Website Solutions",
    category: "Custom",
    tagline: "Marketing sites, e-commerce and web applications.",
    icon: Layout,
    monthly: 0,
    currency: "KES",
    features: ["Design", "Development", "SEO", "Maintenance"],
    workspacePath: "website",
    nav: [{ label: "Overview", to: "" }],
    available: false,
  },
];

export const PRODUCT_BY_SLUG: Record<string, ProductDef> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p]),
);

export const PRODUCT_BY_PATH: Record<string, ProductDef> = Object.fromEntries(
  PRODUCTS.map((p) => [p.workspacePath, p]),
);