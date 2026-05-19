import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-elevated rounded-2xl p-5 transition-all",
        hover && "hover:border-primary/40 hover:shadow-[0_0_40px_-8px_oklch(0.72_0.22_250/0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
  format = (v) => String(v),
}: {
  label: string;
  value: number | string;
  delta?: number;
  icon?: LucideIcon;
  accent?: string;
  format?: (v: number | string) => string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-elevated relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-30 blur-2xl"
        style={{ background: accent ?? "var(--gradient-primary)" }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {format(value)}
          </p>
        </div>
        {Icon && (
          <div className="glass flex size-9 items-center justify-center rounded-xl text-primary">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success ring-success/30",
    operational: "bg-success/15 text-success ring-success/30",
    online: "bg-success/15 text-success ring-success/30",
    stable: "bg-success/15 text-success ring-success/30",
    in: "bg-success/15 text-success ring-success/30",
    trial: "bg-primary/15 text-primary-glow ring-primary/30",
    pending: "bg-warning/15 text-warning ring-warning/30",
    degraded: "bg-warning/15 text-warning ring-warning/30",
    away: "bg-warning/15 text-warning ring-warning/30",
    beta: "bg-warning/15 text-warning ring-warning/30",
    review: "bg-warning/15 text-warning ring-warning/30",
    in_progress: "bg-primary/15 text-primary-glow ring-primary/30",
    todo: "bg-muted-foreground/15 text-muted-foreground ring-white/10",
    done: "bg-success/15 text-success ring-success/30",
    blocked: "bg-destructive/15 text-destructive ring-destructive/30",
    suspended: "bg-destructive/15 text-destructive ring-destructive/30",
    churned: "bg-muted-foreground/15 text-muted-foreground ring-white/10",
    offline: "bg-muted-foreground/15 text-muted-foreground ring-white/10",
    leave: "bg-muted-foreground/15 text-muted-foreground ring-white/10",
    remote: "bg-primary/15 text-primary-glow ring-primary/30",
    field: "bg-primary/15 text-primary-glow ring-primary/30",
    service: "bg-chart-5/15 text-chart-5 ring-chart-5/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1",
        map[status] ?? map.todo,
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      <span className="live-dot size-1.5 rounded-full bg-success" />
      {label}
    </span>
  );
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-chart-5/30 font-display text-[10px] font-semibold text-foreground ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          <span className="text-gradient">{title}</span>
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ComingSoon({
  title,
  description,
  features,
}: {
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <GlassCard className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <LiveDot label="Scaffolded" />
            <span className="text-xs text-muted-foreground">
              UI shell ready · wire to your Node.js backend next
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f}
                className="glass rounded-xl p-4 transition-colors hover:border-primary/30"
              >
                <div className="mb-2 h-2 w-12 rounded-full bg-gradient-to-r from-primary to-primary-glow" />
                <p className="text-sm font-medium">{f}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 w-3/4 rounded-full bg-white/5" />
                  <div className="h-1.5 w-1/2 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
