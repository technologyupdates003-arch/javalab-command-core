// Public site mock data
export const featuredProducts = [
  { slug: "retail-pos", name: "Retail POS", tag: "POS", desc: "Lightning-fast point-of-sale built for shops with multiple branches.", price: "from $29/mo" },
  { slug: "wallet", name: "Multi-currency Wallet", tag: "Financial", desc: "Send, receive, hold and convert money across 30+ currencies.", price: "Custom" },
  { slug: "school", name: "School Management", tag: "Education", desc: "Students, fees, attendance, results — one elegant platform.", price: "from $99/mo" },
  { slug: "hospital", name: "Hospital Management", tag: "Healthcare", desc: "Patients, billing, appointments and pharmacy in one HIS.", price: "Custom" },
  { slug: "hr", name: "HR & Payroll", tag: "Business", desc: "Hire, pay, track and grow your team without spreadsheets.", price: "from $49/mo" },
  { slug: "sms", name: "Bulk SMS Platform", tag: "Channels", desc: "Send millions of messages with smart routing and APIs.", price: "Pay-as-you-go" },
];

export const services = [
  {
    slug: "web", icon: "🌐", title: "Website Development",
    blurb: "Marketing sites, ecommerce, web apps and portals — engineered for scale.",
    features: ["Corporate websites", "Ecommerce", "Custom web apps", "Portals", "Landing pages"],
  },
  {
    slug: "mobile", icon: "📱", title: "Mobile App Development",
    blurb: "Native and cross-platform apps that feel native and ship fast.",
    features: ["Android", "iOS", "Cross-platform", "Business apps", "Wallet apps"],
  },
  {
    slug: "pos", icon: "🧾", title: "POS Systems",
    blurb: "Cloud POS for retail, restaurants, pharmacies, wholesale and multi-branch.",
    features: ["Retail POS", "Restaurant POS", "Pharmacy POS", "Wholesale POS", "Multi-branch", "Custom POS"],
  },
  {
    slug: "wallet", icon: "💳", title: "Wallet Solutions",
    blurb: "Wallets, remittance, payments and mobile-money rails.",
    features: ["Multi-currency wallets", "Remittance", "Payment systems", "STK Push"],
  },
  {
    slug: "school", icon: "🎓", title: "School Management",
    blurb: "Run the entire school — academics, fees, parents and reports.",
    features: ["Student portal", "Fee management", "Attendance", "Results"],
  },
  {
    slug: "hospital", icon: "🏥", title: "Hospital Systems",
    blurb: "Patient-first hospital information systems with billing & pharmacy.",
    features: ["Patient management", "Billing", "Appointments", "Pharmacy"],
  },
  {
    slug: "hr", icon: "👥", title: "HR Systems",
    blurb: "Payroll, attendance and people operations without the chaos.",
    features: ["Payroll", "Attendance", "Employee management"],
  },
  {
    slug: "booking", icon: "📅", title: "Booking Systems",
    blurb: "Reservations, scheduling and payments for service businesses.",
    features: ["Reservations", "Scheduling", "Payments"],
  },
  {
    slug: "sms", icon: "📨", title: "Bulk SMS Platform",
    blurb: "Reach customers at scale with campaigns, APIs and analytics.",
    features: ["SMS campaigns", "APIs", "Sender IDs", "Analytics"],
  },
];

export const testimonials = [
  { quote: "Javalab rebuilt our pharmacy operations from the ground up. Sales reconcile to the cent every night.", who: "Carol N.", role: "MD, Acme Pharma" },
  { quote: "Their hotel POS handles 600+ checkouts a day across four properties without breaking a sweat.", who: "Idris M.", role: "Ops Director, Sunrise Hotels" },
  { quote: "We went from spreadsheets to a real wallet platform in 11 weeks. Best vendor decision we've made.", who: "Ann W.", role: "CTO, Atlas Mobile Money" },
];

export const portfolio = [
  { slug: "atlas-wallet", title: "Atlas Wallet", category: "Fintech", year: 2025, blurb: "Multi-currency wallet powering 240k+ monthly active users." },
  { slug: "sunrise-pms", title: "Sunrise Hotel PMS", category: "Hospitality", year: 2024, blurb: "Property management system with channel manager for 4 hotels." },
  { slug: "brightline-sacco", title: "Brightline SACCO", category: "Financial", year: 2025, blurb: "End-to-end SACCO core with mobile app, USSD and loan engine." },
  { slug: "kifaru-schools", title: "Kifaru Schools", category: "Education", year: 2024, blurb: "Multi-tenant school platform serving 36 schools across Tanzania." },
  { slug: "pinnacle-his", title: "Pinnacle Hospital HIS", category: "Healthcare", year: 2023, blurb: "Hospital information system covering OPD, IPD, pharmacy and billing." },
  { slug: "greenleaf-pos", title: "GreenLeaf Supermarket", category: "Retail", year: 2025, blurb: "Multi-branch supermarket POS with realtime stock sync." },
];

export const plansPublic = [
  { name: "Starter", price: 29, color: "oklch(0.78 0.18 200)", best: false, features: ["1 branch", "Up to 3 users", "Core modules", "Email support", "Mobile app", "Cloud backups"] },
  { name: "Pro", price: 99, color: "oklch(0.72 0.22 250)", best: true, features: ["Up to 5 branches", "Unlimited users", "All modules", "Priority support", "API access", "Custom reports", "Bulk SMS credits"] },
  { name: "Enterprise", price: 399, color: "oklch(0.78 0.17 75)", best: false, features: ["Unlimited everything", "Dedicated success manager", "99.9% SLA", "On-premise option", "Custom integrations", "White-label", "Onboarding & training"] },
];

export const blogPosts = [
  { slug: "stk-push-2026", title: "What's new with STK Push in 2026", category: "Engineering", date: "May 14, 2026", read: "6 min", excerpt: "A deep dive into the latest Daraja APIs and what changed for merchants and developers." },
  { slug: "scaling-pos", title: "How we scaled a multi-branch POS to 12M tx/month", category: "Case Study", date: "Apr 28, 2026", read: "9 min", excerpt: "Architecture, queueing, idempotency and the offline-first patterns that kept us sane." },
  { slug: "ai-customer-support", title: "Embedding AI into customer support without losing the human touch", category: "Product", date: "Apr 02, 2026", read: "5 min", excerpt: "How we use LLMs to triage tickets while keeping humans in charge of the hard ones." },
  { slug: "saas-pricing", title: "We rewrote our pricing 3 times. Here's what worked.", category: "Business", date: "Mar 19, 2026", read: "7 min", excerpt: "Lessons from rolling out per-tenant, per-seat and hybrid pricing across 9 products." },
];

export const jobs = [
  { slug: "senior-fullstack", title: "Senior Full-Stack Engineer", dept: "Engineering", type: "Full-time", location: "Nairobi / Remote" },
  { slug: "mobile-engineer", title: "Mobile Engineer (Flutter)", dept: "Engineering", type: "Full-time", location: "Nairobi" },
  { slug: "product-designer", title: "Product Designer", dept: "Design", type: "Full-time", location: "Remote (EAT)" },
  { slug: "csm", title: "Customer Success Manager", dept: "Customer Success", type: "Full-time", location: "Nairobi" },
  { slug: "sales-exec", title: "Enterprise Sales Executive", dept: "Sales", type: "Full-time", location: "Kampala / Nairobi" },
  { slug: "devops", title: "DevOps / Platform Engineer", dept: "Engineering", type: "Full-time", location: "Remote" },
];

export const partners = ["Safaricom", "Equity", "Visa", "Mastercard", "M-Pesa", "Airtel", "DPO", "Pesapal"];

export const stats = [
  { label: "Active clients", value: "1,284+" },
  { label: "Projects shipped", value: "640+" },
  { label: "Countries served", value: "12" },
  { label: "SMS processed (24h)", value: "412K" },
  { label: "Transactions (24h)", value: "28.4K" },
  { label: "Products deployed", value: "24" },
];
