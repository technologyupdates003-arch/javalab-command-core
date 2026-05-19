import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/_hq/vault/")({
  component: () => (
    <ComingSoon
      title="Password Vault"
      description="Encrypted, role-restricted secrets — API keys, DB credentials, SSH keys, and client logins."
      features={[
        "API keys",
        "Database credentials",
        "Hosting credentials",
        "SSH keys",
        "Client credentials",
        "OTP-gated reveal",
        "Access logs",
        "Per-role restrictions",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Password Vault — Javalab HQ" }] }),
});
