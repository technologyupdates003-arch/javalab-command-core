import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_site/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Client portal — Javalab Tech" },
      { name: "description", content: "Sign in to the Javalab Tech client portal — subscriptions, invoices, support and project status." },
      { property: "og:title", content: "Client portal — Javalab Tech" },
      { property: "og:description", content: "Access your Javalab Tech client portal." },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative w-full max-w-md">
        <div className="glass-elevated rounded-3xl p-8">
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_24px_-4px_oklch(0.72_0.22_250/0.6)]">
              <Lock className="size-5 text-primary-foreground" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
              {mode === "login" && "Welcome back"}
              {mode === "register" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login" && "Sign in to your client portal."}
              {mode === "register" && "Start using Javalab products in minutes."}
              {mode === "forgot" && "We'll email you a reset link."}
            </p>
          </div>

          <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
            {mode === "register" && (
              <input
                placeholder="Full name"
                className="h-11 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            )}
            <input
              type="email"
              placeholder="you@company.com"
              className="h-11 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {mode !== "forgot" && (
              <input
                type="password"
                placeholder="Password"
                className="h-11 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            )}
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow text-sm font-medium text-primary-foreground shadow-[0_0_28px_-4px_oklch(0.72_0.22_250/0.7)]"
            >
              {mode === "login" && "Sign in"}
              {mode === "register" && "Create account"}
              {mode === "forgot" && "Send reset link"}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="hover:text-primary-glow">
                  Forgot password?
                </button>
                <span className="mx-2 opacity-40">·</span>
                <button onClick={() => setMode("register")} className="hover:text-primary-glow">
                  Create account
                </button>
              </>
            )}
            {mode !== "login" && (
              <button onClick={() => setMode("login")} className="hover:text-primary-glow">
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-glass-border bg-background/40 p-4 text-center text-xs text-muted-foreground">
          Staff member?{" "}
          <Link to="/hq" className="inline-flex items-center gap-1 text-primary-glow hover:underline">
            <Mail className="size-3" /> Go to Command Center
          </Link>
        </div>
      </div>
    </section>
  );
}
