import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/_hq/office/")({
  component: () => (
    <ComingSoon
      title="Office Desk"
      description="The internal workspace — where Javalab Tech actually works together."
      features={[
        "Company announcements",
        "Team chat",
        "Video meetings",
        "Shared documents",
        "Internal tickets",
        "Calendar & scheduling",
        "Knowledge base & wiki",
        "Birthday & leave board",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Office Desk — Javalab HQ" }] }),
});
