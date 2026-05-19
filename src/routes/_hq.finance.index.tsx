import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hq/primitives";

export const Route = createFileRoute("/_hq/finance/")({
  component: () => (
    <ComingSoon
      title="Finance & Accounting"
      description="Revenue, expenses, payroll, wallets, taxes — the financial bloodstream."
      features={[
        "Revenue reports",
        "Expenses",
        "Profit analysis",
        "Payroll",
        "Wallet transactions",
        "Payment tracking",
        "Tax reports",
        "Invoices & statements",
      ]}
    />
  ),
  head: () => ({ meta: [{ title: "Finance — Javalab HQ" }] }),
});
