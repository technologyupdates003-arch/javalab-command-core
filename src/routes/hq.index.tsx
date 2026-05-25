import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Building2,
  CreditCard,
  MessageSquare,
  ShoppingCart,
  SquareKanban,
  TicketCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  GlassCard,
  LiveDot,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/hq/primitives";
import {
  activityFeed,
  kpis,
  productMix,
  revenueSeries,
  serverHealth,
} from "@/lib/mock-data";

export const Route = createFileRoute("/hq/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "HQ Dashboard — Javalab Command Center" }] }),
});

const fmtMoney = (v: number | string) =>
  typeof v === "number"
    ? "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : String(v);
const fmtNum = (v: number | string) =>
  typeof v === "number" ? v.toLocaleString("en-US") : String(v);

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-glass-border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <LiveDot label="Realtime · Production" />
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome back, <span className="text-gradient">Commander.</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {kpis.activeClients.toLocaleString()} active tenants across{" "}
              {productMix.length} product divisions · all systems nominal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="glass rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                MRR
              </p>
              <p className="font-display text-xl font-semibold">
                {fmtMoney(kpis.mrr)}
              </p>
            </div>
            <div className="glass rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Today
              </p>
              <p className="font-display text-xl font-semibold text-primary-glow">
                {fmtMoney(kpis.todayRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Clients"
          value={kpis.activeClients}
          delta={4.8}
          icon={Building2}
          format={fmtNum}
        />
        <StatCard
          label="Monthly Recurring"
          value={kpis.mrr}
          delta={7.2}
          icon={CreditCard}
          format={fmtMoney}
          accent="linear-gradient(135deg, oklch(0.72 0.18 155), oklch(0.78 0.18 200))"
        />
        <StatCard
          label="Active Projects"
          value={kpis.activeProjects}
          delta={-2.1}
          icon={SquareKanban}
          format={fmtNum}
        />
        <StatCard
          label="Staff Online"
          value={kpis.staffOnline}
          delta={0}
          icon={UsersRound}
          format={fmtNum}
        />
        <StatCard
          label="SMS sent (24h)"
          value={kpis.smsSent24h}
          delta={12.4}
          icon={MessageSquare}
          format={fmtNum}
          accent="linear-gradient(135deg, oklch(0.78 0.17 75), oklch(0.7 0.22 320))"
        />
        <StatCard
          label="POS Transactions (24h)"
          value={kpis.posTx24h}
          delta={5.6}
          icon={ShoppingCart}
          format={fmtNum}
        />
        <StatCard
          label="Wallet Volume (24h)"
          value={482900}
          delta={9.1}
          icon={Wallet}
          format={fmtMoney}
        />
        <StatCard
          label="Open Tickets"
          value={kpis.openTickets}
          delta={-18.0}
          icon={TicketCheck}
          format={fmtNum}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <SectionHeader
            title="Revenue & Subscriptions"
            subtitle="Last 30 days · all products"
            action={<LiveDot />}
          />
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.22 35)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="oklch(0.65 0.22 35)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="oklch(0.6 0 0)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.6 0 0)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.15 0.008 240)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.72 0.24 30)"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard>
          <SectionHeader title="Product Mix" subtitle="Share of MRR" />
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productMix}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {productMix.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.15 0.008 240)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {productMix.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span>{p.name}</span>
                </div>
                <span className="text-muted-foreground">{p.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Health + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <SectionHeader title="System Health" subtitle="Realtime service status" action={<LiveDot />} />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {serverHealth.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-xl border border-glass-border bg-background/40 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="size-3.5 text-primary-glow" />
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {s.latency}ms
                  </span>
                  <StatusPill status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <SectionHeader title="Live Activity" action={<LiveDot />} />
          <ul className="mt-3 space-y-3">
            {activityFeed.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-glow" />
                <div className="flex-1">
                  <p className="text-xs">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {a.when} ago · {a.type}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
