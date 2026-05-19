import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/hq/sms/")({
  component: () => (
    <ComingSoon
      title="Bulk SMS Platform"
      description="Self-service SMS for tenants — sender IDs, contacts, templates, scheduling, and APIs."
      features={[
        "Send SMS / batches",
        "Sender ID management",
        "Contact lists",
        "Message templates",
        "Scheduling",
        "Delivery reports",
        "Billing & top-ups",
        "Developer API & webhooks",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Bulk SMS — Javalab HQ" }] }),
});
