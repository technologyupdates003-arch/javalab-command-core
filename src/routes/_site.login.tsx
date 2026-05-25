import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setInfo("Reset link sent. Check your email.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
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
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_24px_-4px_oklch(0.65_0.22_35/0.6)]">
              <Lock className="size-5 text-primary-foreground" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
              {mode === "login" && "Welcome back"}
              {mode === "forgot" && "Reset your password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login" && "Sign in to your client portal."}
              {mode === "forgot" && "We'll email you a reset link."}
            </p>
          </div>

          <form className="mt-6 space-y-3" onSubmit={submit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {mode !== "forgot" && (
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            )}
            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            {info && <div className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">{info}</div>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow text-sm font-medium text-primary-foreground shadow-[0_0_28px_-4px_oklch(0.65_0.22_35/0.7)]"
            >
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Send reset link"}
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
                <Link to="/signup" className="hover:text-primary-glow">Create account</Link>
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
