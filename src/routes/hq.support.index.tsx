import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/hq/support/")({
  component: () => (
    <ComingSoon
      title="Customer Support"
      description="Tickets, live chat, WhatsApp, calls — everything customer-facing in one queue."
      features={[
        "Ticket management",
        "Live chat",
        "WhatsApp integration",
        "Knowledge base",
        "Call logs",
        "Complaint tracking",
        "SLA monitoring",
        "Resolution analytics",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Support — Javalab HQ" }] }),
});
