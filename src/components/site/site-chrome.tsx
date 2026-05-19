import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/services", label: "Services" },
  { to: "/products", label: "Products" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
  { to: "/careers", label: "Careers" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_24px_-4px_oklch(0.72_0.22_250/0.6)]">
            <span className="font-display text-sm font-bold text-primary-foreground">J</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold tracking-tight">JAVALAB</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Tech</span>
          </div>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "rounded-md px-3 py-2 text-xs font-medium transition-colors " +
                  (active
                    ? "text-primary-glow"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/login"
            className="hidden text-xs font-medium text-muted-foreground hover:text-foreground md:block"
          >
            Client portal
          </Link>
          <Link
            to="/quote"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3.5 text-xs font-medium text-primary-foreground shadow-[0_0_20px_-4px_oklch(0.72_0.22_250/0.6)] transition-shadow hover:shadow-[0_0_32px_-4px_oklch(0.72_0.22_250/0.9)]"
          >
            Start Project <ArrowRight className="size-3.5" />
          </Link>
          <button
            className="glass inline-flex size-9 items-center justify-center rounded-lg lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-glass-border bg-background/95 px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {nav.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-white/5"
              >
                Client portal
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-glass-border bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-5 md:px-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
              <span className="font-display text-sm font-bold text-primary-foreground">J</span>
            </div>
            <span className="font-display text-base font-bold tracking-tight">JAVALAB TECH</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            We build the digital infrastructure that runs modern African businesses —
            POS, wallets, websites, mobile apps, school, hospital and HR systems.
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground/70">
            © {new Date().getFullYear()} Javalab Tech. All rights reserved.
          </p>
        </div>
        {[
          {
            t: "Solutions",
            l: [
              ["Services", "/services"],
              ["Products", "/products"],
              ["Portfolio", "/portfolio"],
              ["Pricing", "/pricing"],
            ],
          },
          {
            t: "Company",
            l: [
              ["Blog", "/blog"],
              ["Careers", "/careers"],
              ["Contact", "/contact"],
              ["Support", "/support"],
            ],
          },
          {
            t: "Account",
            l: [
              ["Client Portal", "/login"],
              ["Request Quote", "/quote"],
              ["Command Center", "/hq"],
            ],
          },
        ].map((c) => (
          <div key={c.t}>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {c.t}
            </p>
            <ul className="space-y-2">
              {c.l.map(([label, to]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary-glow"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
