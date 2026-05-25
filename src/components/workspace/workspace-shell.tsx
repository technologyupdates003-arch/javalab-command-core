import { Link, useParams, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  LayoutDashboard,
  ShoppingBag,
  Wallet as WalletIcon,
  LogOut,
  Check,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS, PRODUCT_BY_SLUG, type ProductDef } from "@/lib/products-catalog";

type Sub = { product_slug: string; product_name: string; category: string };

export function WorkspaceShell({
  tenantName,
  tenantSlug,
  activeProduct,
  subscriptions,
  children,
}: {
  tenantName: string;
  tenantSlug: string;
  activeProduct: ProductDef | null;
  subscriptions: Sub[];
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const subscribedDefs = subscriptions
    .map((s) => PRODUCT_BY_SLUG[s.product_slug])
    .filter(Boolean) as ProductDef[];

  const productNav = activeProduct?.nav ?? [];
  const baseProduct = activeProduct
    ? `/app/${tenantSlug}/${activeProduct.workspacePath}`
    : null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="p-4">
          <ProductSwitcher
            tenantName={tenantName}
            tenantSlug={tenantSlug}
            active={activeProduct}
            products={subscribedDefs}
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 text-sm">
          {activeProduct && baseProduct ? (
            <SidebarSection title={activeProduct.name}>
              {productNav.map((item) => {
                const href = baseProduct + (item.to.startsWith("?") ? item.to : item.to ? "/" + item.to : "");
                const isActive =
                  item.to === ""
                    ? pathname === baseProduct
                    : pathname.startsWith(baseProduct + "/" + item.to.replace(/^\?/, "")) ||
                      (item.to.startsWith("?") && pathname === baseProduct);
                return (
                  <SidebarLink key={item.label} href={href} active={isActive}>
                    {item.label}
                  </SidebarLink>
                );
              })}
            </SidebarSection>
          ) : (
            <SidebarSection title="Workspace">
              <SidebarLink href={`/app/${tenantSlug}`} active={pathname === `/app/${tenantSlug}`}>
                <LayoutDashboard className="size-4" /> Overview
              </SidebarLink>
            </SidebarSection>
          )}

          <SidebarSection title="Account">
            <SidebarLink
              href={`/app/${tenantSlug}/marketplace`}
              active={pathname.startsWith(`/app/${tenantSlug}/marketplace`)}
            >
              <ShoppingBag className="size-4" /> Marketplace
            </SidebarLink>
            <SidebarLink
              href={`/app/${tenantSlug}/billing`}
              active={pathname.startsWith(`/app/${tenantSlug}/billing`)}
            >
              <WalletIcon className="size-4" /> Billing & Wallet
            </SidebarLink>
          </SidebarSection>
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3 text-sm">
            {activeProduct ? (
              <>
                <activeProduct.icon className="size-4 text-primary" />
                <span className="font-medium">{activeProduct.name}</span>
              </>
            ) : (
              <span className="font-medium">{tenantName}</span>
            )}
          </div>
          <div className="md:hidden">
            <ProductSwitcher
              tenantName={tenantName}
              tenantSlug={tenantSlug}
              active={activeProduct}
              products={subscribedDefs}
            />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={href}
      className={[
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function ProductSwitcher({
  tenantName,
  tenantSlug,
  active,
  products,
}: {
  tenantName: string;
  tenantSlug: string;
  active: ProductDef | null;
  products: ProductDef[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent">
        <div className="min-w-0">
          <div className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
            {tenantName}
          </div>
          <div className="truncate font-medium">{active?.name ?? "Choose product"}</div>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>My Products</DropdownMenuLabel>
        {products.length === 0 && (
          <div className="px-2 py-2 text-xs text-muted-foreground">No active products yet.</div>
        )}
        {products.map((p) => (
          <DropdownMenuItem key={p.slug} asChild>
            <Link
              to={`/app/${tenantSlug}/${p.workspacePath}`}
              className="flex items-center gap-2"
            >
              <p.icon className="size-4" />
              <span className="flex-1">{p.name}</span>
              {active?.slug === p.slug && <Check className="size-4 text-primary" />}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/app/${tenantSlug}/marketplace`} className="flex items-center gap-2">
            <ShoppingBag className="size-4" /> Browse Marketplace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductLockedCard({ tenantSlug, product }: { tenantSlug: string; product: ProductDef }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
        <Lock className="size-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{product.name} is not on your plan</h2>
      <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
      <Link
        to={`/app/${tenantSlug}/marketplace`}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <ShoppingBag className="size-4" /> Subscribe in Marketplace
      </Link>
    </div>
  );
}