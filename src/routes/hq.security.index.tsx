import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/hq/security/")({
  component: () => (
    <ComingSoon
      title="Security Center"
      description="Enterprise-grade controls — 2FA, sessions, IPs, audit, and threat monitoring."
      features={[
        "Two-factor authentication",
        "Role & permission policies",
        "Session management",
        "Login history",
        "IP allow-lists",
        "Audit logs",
        "Device management",
        "Threat monitoring",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Security — Javalab HQ" }] }),
});
