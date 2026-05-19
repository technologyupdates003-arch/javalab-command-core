import { createFileRoute } from "@tanstack/react-router";
import { Calendar, MoreHorizontal, Plus } from "lucide-react";
import {
  Avatar,
  GlassCard,
  PageHeader,
  StatusPill,
} from "@/components/hq/primitives";
import { projects } from "@/lib/mock-data";

export const Route = createFileRoute("/_hq/projects/")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "Projects — Javalab HQ" }] }),
});

const cols: { key: string; title: string }[] = [
  { key: "todo", title: "Backlog" },
  { key: "in_progress", title: "In Progress" },
  { key: "review", title: "Review" },
  { key: "blocked", title: "Blocked" },
  { key: "done", title: "Done" },
];

function ProjectsPage() {
  return (
    <div>
      <PageHeader
        title="Project Command"
        description="Kanban across every client engagement and internal initiative."
        action={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3 text-xs font-medium text-primary-foreground">
            <Plus className="size-3.5" /> New project
          </button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-5">
        {cols.map((col) => {
          const items = projects.filter((p) => p.status === col.key);
          return (
            <div key={col.key} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <StatusPill status={col.key} />
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((p) => (
                  <GlassCard key={p.id} hover className="p-3">
                    <p className="text-sm font-medium leading-snug">{p.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.client}
                    </p>
                    <div className="mt-3">
                      <div className="h-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary-glow"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>{p.progress}%</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-2.5" /> {p.due}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex -space-x-1.5">
                      {p.team.map((t) => (
                        <Avatar key={t} name={t} size={22} />
                      ))}
                    </div>
                  </GlassCard>
                ))}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-glass-border p-4 text-center text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
