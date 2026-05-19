import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import {
  Avatar,
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
} from "@/components/hq/primitives";
import { departments, staff } from "@/lib/mock-data";

export const Route = createFileRoute("/hq/staff/")({
  component: StaffPage,
  head: () => ({ meta: [{ title: "Staff & Departments — Javalab HQ" }] }),
});

function StaffPage() {
  return (
    <div>
      <PageHeader
        title="Staff & Departments"
        description="The humans behind Javalab Tech — org structure, roles, attendance, and KPIs."
        action={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3 text-xs font-medium text-primary-foreground">
            <UserPlus className="size-3.5" /> Invite staff
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <SectionHeader title="Departments" subtitle={`${departments.length} divisions`} />
          <ul className="mt-3 space-y-2">
            {departments.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-glass-border bg-background/40 p-3 transition-colors hover:border-primary/30"
              >
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Head · {d.head}
                  </p>
                </div>
                <span className="font-display text-lg font-semibold text-primary-glow">
                  {d.count}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <SectionHeader title="Staff directory" subtitle={`${staff.length} active members`} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Department</th>
                  <th className="py-2 font-medium">Presence</th>
                  <th className="py-2 font-medium">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-glass-border/50 last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.name} />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-xs">{s.role}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{s.dept}</td>
                    <td className="py-2.5"><StatusPill status={s.status} /></td>
                    <td className="py-2.5"><StatusPill status={s.attendance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-3">
          <SectionHeader title="Role permissions" subtitle="High-level access matrix" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-glass-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 font-medium">Role</th>
                  {["Clients", "Subscriptions", "Finance", "Projects", "Vault", "Developer"].map((m) => (
                    <th key={m} className="py-2 font-medium">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Super Admin", "✓ ✓", "✓ ✓", "✓ ✓", "✓ ✓", "✓ ✓", "✓ ✓"],
                  ["Manager", "✓", "✓", "✓", "✓ ✓", "—", "—"],
                  ["Finance", "view", "view", "✓ ✓", "—", "—", "—"],
                  ["Developer", "—", "—", "—", "✓", "view", "✓ ✓"],
                  ["Support", "✓", "view", "—", "—", "—", "—"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-glass-border/50 last:border-0">
                    {row.map((cell, i) => (
                      <td key={i} className={i === 0 ? "py-2 font-medium" : "py-2 text-muted-foreground"}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              ✓ ✓ full · ✓ edit · view = read-only · — none
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
