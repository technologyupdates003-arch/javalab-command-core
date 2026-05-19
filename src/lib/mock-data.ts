// Centralized mock data. Swap each export with API call later.

export type Status = "active" | "trial" | "suspended" | "churned" | "pending";

export const kpis = {
  activeClients: 1284,
  mrr: 184250,
  todayRevenue: 12480,
  activeProjects: 47,
  staffOnline: 38,
  smsSent24h: 412930,
  posTx24h: 28471,
  openTickets: 23,
};

export const revenueSeries = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  revenue: 4200 + Math.round(Math.sin(i / 3) * 1800 + i * 110 + Math.random() * 800),
  subs: 900 + Math.round(i * 12 + Math.sin(i / 4) * 30),
}));

export const productMix = [
  { name: "Cloud POS", value: 38, color: "oklch(0.72 0.22 250)" },
  { name: "Financial", value: 22, color: "oklch(0.78 0.18 200)" },
  { name: "Business Mgmt", value: 18, color: "oklch(0.72 0.18 155)" },
  { name: "Bulk SMS", value: 12, color: "oklch(0.78 0.17 75)" },
  { name: "Mobile/Web", value: 10, color: "oklch(0.7 0.22 320)" },
];

export const serverHealth = [
  { name: "API Gateway", status: "operational", latency: 42 },
  { name: "POS Cluster", status: "operational", latency: 68 },
  { name: "SMS Worker", status: "degraded", latency: 312 },
  { name: "Wallet Core", status: "operational", latency: 51 },
  { name: "Auth Service", status: "operational", latency: 28 },
  { name: "Database (primary)", status: "operational", latency: 12 },
];

export const activityFeed = [
  { id: "a1", who: "Acme Pharma", what: "renewed Pharmacy POS — Pro", when: "2m", type: "subscription" },
  { id: "a2", who: "Mary K.", what: "closed ticket #4821", when: "6m", type: "support" },
  { id: "a3", who: "Sunrise Hotel", what: "upgraded to Hotel POS — Enterprise", when: "14m", type: "subscription" },
  { id: "a4", who: "Dev Team", what: "deployed wallet-core v2.18", when: "22m", type: "deploy" },
  { id: "a5", who: "Bulk SMS", what: "campaign 'Eid Promo' sent 84,200 messages", when: "41m", type: "marketing" },
  { id: "a6", who: "Brightline SACCO", what: "signed annual contract", when: "1h", type: "sales" },
  { id: "a7", who: "Finance", what: "payroll batch processed (KES 4.2M)", when: "2h", type: "finance" },
];

export const clients = [
  { id: "c1", name: "Acme Pharma Ltd", industry: "Pharmacy", plan: "Pro", products: ["Pharmacy POS", "Bulk SMS"], mrr: 480, status: "active" as Status, since: "2023-04-12", country: "KE" },
  { id: "c2", name: "Sunrise Hotel Group", industry: "Hospitality", plan: "Enterprise", products: ["Hotel POS", "CRM"], mrr: 1850, status: "active" as Status, since: "2022-11-02", country: "KE" },
  { id: "c3", name: "Brightline SACCO", industry: "Finance", plan: "Enterprise", products: ["SACCO System", "Wallet"], mrr: 2400, status: "active" as Status, since: "2024-01-20", country: "UG" },
  { id: "c4", name: "Mama Mboga Wholesale", industry: "Retail", plan: "Starter", products: ["Wholesale POS"], mrr: 90, status: "trial" as Status, since: "2026-05-01", country: "KE" },
  { id: "c5", name: "Kifaru Schools", industry: "Education", plan: "Pro", products: ["School Mgmt"], mrr: 620, status: "active" as Status, since: "2023-08-19", country: "TZ" },
  { id: "c6", name: "Pinnacle Hospital", industry: "Healthcare", plan: "Enterprise", products: ["Hospital Mgmt", "HR"], mrr: 3100, status: "active" as Status, since: "2022-06-30", country: "KE" },
  { id: "c7", name: "GreenLeaf Supermarket", industry: "Retail", plan: "Pro", products: ["Supermarket POS"], mrr: 540, status: "suspended" as Status, since: "2023-02-14", country: "KE" },
  { id: "c8", name: "Nile Welfare Society", industry: "Non-profit", plan: "Starter", products: ["Welfare System"], mrr: 120, status: "active" as Status, since: "2024-09-09", country: "UG" },
  { id: "c9", name: "Coastline Bistro", industry: "F&B", plan: "Pro", products: ["Restaurant POS"], mrr: 380, status: "active" as Status, since: "2024-03-11", country: "KE" },
  { id: "c10", name: "Atlas Mobile Money", industry: "Fintech", plan: "Enterprise", products: ["Wallet", "Remittance"], mrr: 5200, status: "active" as Status, since: "2021-12-01", country: "KE" },
  { id: "c11", name: "Vintage Hardware", industry: "Retail", plan: "Starter", products: ["Hardware POS"], mrr: 110, status: "churned" as Status, since: "2023-05-05", country: "KE" },
  { id: "c12", name: "Sky Booking Co.", industry: "Travel", plan: "Pro", products: ["Booking System"], mrr: 460, status: "pending" as Status, since: "2026-05-15", country: "RW" },
];

export const products = [
  { id: "p1", group: "Cloud POS", name: "Retail POS", tenants: 184, mrr: 38200, status: "stable" },
  { id: "p2", group: "Cloud POS", name: "Pharmacy POS", tenants: 96, mrr: 24800, status: "stable" },
  { id: "p3", group: "Cloud POS", name: "Restaurant POS", tenants: 142, mrr: 31200, status: "stable" },
  { id: "p4", group: "Cloud POS", name: "Wholesale POS", tenants: 71, mrr: 18900, status: "stable" },
  { id: "p5", group: "Cloud POS", name: "Hardware POS", tenants: 44, mrr: 9100, status: "stable" },
  { id: "p6", group: "Cloud POS", name: "Supermarket POS", tenants: 58, mrr: 14400, status: "stable" },
  { id: "p7", group: "Cloud POS", name: "Hotel POS", tenants: 32, mrr: 21000, status: "stable" },
  { id: "p8", group: "Cloud POS", name: "Multi-branch POS", tenants: 21, mrr: 17800, status: "beta" },
  { id: "p9", group: "Cloud POS", name: "Custom POS", tenants: 12, mrr: 9600, status: "stable" },
  { id: "p10", group: "Financial", name: "Multi-currency Wallet", tenants: 28, mrr: 22400, status: "stable" },
  { id: "p11", group: "Financial", name: "Digital Remittance", tenants: 14, mrr: 18200, status: "stable" },
  { id: "p12", group: "Financial", name: "Payment Gateway", tenants: 41, mrr: 16800, status: "stable" },
  { id: "p13", group: "Financial", name: "Mobile Money / STK", tenants: 67, mrr: 12200, status: "stable" },
  { id: "p14", group: "Business Mgmt", name: "School Management", tenants: 52, mrr: 14600, status: "stable" },
  { id: "p15", group: "Business Mgmt", name: "Hospital Management", tenants: 19, mrr: 17400, status: "stable" },
  { id: "p16", group: "Business Mgmt", name: "HR Management", tenants: 38, mrr: 9200, status: "stable" },
  { id: "p17", group: "Business Mgmt", name: "Booking System", tenants: 26, mrr: 6400, status: "stable" },
  { id: "p18", group: "Business Mgmt", name: "SACCO System", tenants: 17, mrr: 12800, status: "stable" },
  { id: "p19", group: "Business Mgmt", name: "Welfare System", tenants: 11, mrr: 3400, status: "stable" },
  { id: "p20", group: "Business Mgmt", name: "CRM", tenants: 64, mrr: 11200, status: "stable" },
  { id: "p21", group: "Business Mgmt", name: "Inventory", tenants: 88, mrr: 14800, status: "stable" },
  { id: "p22", group: "Channels", name: "Mobile App Dev", tenants: 23, mrr: 0, status: "service" },
  { id: "p23", group: "Channels", name: "Website Dev", tenants: 47, mrr: 0, status: "service" },
  { id: "p24", group: "Channels", name: "Bulk SMS Platform", tenants: 312, mrr: 18400, status: "stable" },
];

export const projects = [
  { id: "pr1", name: "Wallet v2.2 — STK retries", client: "Atlas Mobile Money", status: "in_progress", progress: 64, due: "2026-05-28", team: ["AM", "JK", "SO"] },
  { id: "pr2", name: "Pinnacle Hospital onboarding", client: "Pinnacle Hospital", status: "in_progress", progress: 38, due: "2026-06-10", team: ["RW", "MK"] },
  { id: "pr3", name: "Pharmacy POS — controlled drug ledger", client: "Acme Pharma", status: "review", progress: 92, due: "2026-05-22", team: ["JK"] },
  { id: "pr4", name: "Brightline SACCO mobile app", client: "Brightline SACCO", status: "in_progress", progress: 51, due: "2026-07-04", team: ["AM", "SO", "TM"] },
  { id: "pr5", name: "Bulk SMS dashboard redesign", client: "Internal", status: "todo", progress: 8, due: "2026-06-30", team: ["MK", "TM"] },
  { id: "pr6", name: "Sunrise Hotel — channel manager", client: "Sunrise Hotel Group", status: "blocked", progress: 22, due: "2026-06-18", team: ["RW"] },
  { id: "pr7", name: "Kifaru Schools — fees module", client: "Kifaru Schools", status: "done", progress: 100, due: "2026-05-12", team: ["JK", "SO"] },
  { id: "pr8", name: "GreenLeaf — barcode rework", client: "GreenLeaf Supermarket", status: "todo", progress: 0, due: "2026-07-20", team: ["TM"] },
];

export const departments = [
  { id: "d1", name: "Development", head: "Alex Mwangi", count: 22 },
  { id: "d2", name: "Marketing", head: "Tasha Mboya", count: 7 },
  { id: "d3", name: "Finance", head: "Joy Karanja", count: 5 },
  { id: "d4", name: "Sales", head: "Sam Otieno", count: 9 },
  { id: "d5", name: "Customer Support", head: "Mary Kibet", count: 14 },
  { id: "d6", name: "HR", head: "Ruth Wambui", count: 3 },
  { id: "d7", name: "Operations", head: "Brian Ouma", count: 6 },
  { id: "d8", name: "Management", head: "CEO", count: 4 },
];

export const staff = [
  { id: "s1", name: "Alex Mwangi", role: "Head of Engineering", dept: "Development", status: "online", attendance: "in" },
  { id: "s2", name: "Joy Karanja", role: "Finance Manager", dept: "Finance", status: "online", attendance: "in" },
  { id: "s3", name: "Sam Otieno", role: "Senior Sales", dept: "Sales", status: "online", attendance: "field" },
  { id: "s4", name: "Mary Kibet", role: "Support Lead", dept: "Customer Support", status: "away", attendance: "in" },
  { id: "s5", name: "Tasha Mboya", role: "Marketing Lead", dept: "Marketing", status: "online", attendance: "in" },
  { id: "s6", name: "Ruth Wambui", role: "HR Manager", dept: "HR", status: "offline", attendance: "leave" },
  { id: "s7", name: "Brian Ouma", role: "Ops Manager", dept: "Operations", status: "online", attendance: "in" },
  { id: "s8", name: "Tim Mutua", role: "Mobile Engineer", dept: "Development", status: "online", attendance: "remote" },
  { id: "s9", name: "Rita Wachira", role: "QA Engineer", dept: "Development", status: "online", attendance: "in" },
  { id: "s10", name: "Kevin Njoroge", role: "DevOps", dept: "Development", status: "online", attendance: "remote" },
];

export const plans = [
  { id: "pl1", name: "Starter", price: 29, billing: "monthly", features: ["1 branch", "Email support", "Core modules"], active: 412, color: "oklch(0.78 0.18 200)" },
  { id: "pl2", name: "Pro", price: 99, billing: "monthly", features: ["5 branches", "Priority support", "All modules", "API access"], active: 638, color: "oklch(0.72 0.22 250)" },
  { id: "pl3", name: "Enterprise", price: 399, billing: "monthly", features: ["Unlimited", "Dedicated CSM", "SLA 99.9%", "On-prem option"], active: 134, color: "oklch(0.78 0.17 75)" },
];

export const failedPayments = [
  { id: "f1", client: "GreenLeaf Supermarket", amount: 540, reason: "Card declined", attempts: 3, when: "2h" },
  { id: "f2", client: "Vintage Hardware", amount: 110, reason: "Insufficient funds", attempts: 2, when: "5h" },
  { id: "f3", client: "Coastline Bistro", amount: 380, reason: "STK timeout", attempts: 1, when: "1d" },
];
