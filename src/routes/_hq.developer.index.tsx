import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/_hq/developer/")({
  component: () => (
    <ComingSoon
      title="Developer Center"
      description="Internal engineering ops — APIs, env vars, deploys, monitoring, and Git."
      features={[
        "API management",
        "Environment variables",
        "Deployment logs",
        "Server monitoring",
        "Database management",
        "Git integrations",
        "Error monitoring",
        "Webhook logs",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Developer — Javalab HQ" }] }),
});
