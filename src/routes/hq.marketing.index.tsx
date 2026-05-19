import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/hq/marketing/")({
  component: () => (
    <ComingSoon
      title="Marketing Center"
      description="Growth engine — campaigns, leads, funnels, and conversion analytics."
      features={[
        "Bulk SMS campaigns",
        "Email campaigns",
        "Lead management",
        "Funnels & landing pages",
        "Social scheduling",
        "Conversion analytics",
        "Attribution reports",
        "A/B experiments",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Marketing — Javalab HQ" }] }),
});
