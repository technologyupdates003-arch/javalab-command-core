import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Banknote,
  Bot,
  Building2,
  Code2,
  CreditCard,
  HeadphonesIcon,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  ShieldCheck,
  SquareKanban,
  Users,
  UsersRound,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Overview",
    items: [{ title: "HQ Dashboard", url: "/hq", icon: LayoutDashboard }],
  },
  {
    label: "Revenue",
    items: [
      { title: "Clients", url: "/hq/clients", icon: Building2 },
      { title: "Subscriptions", url: "/hq/subscriptions", icon: CreditCard },
      { title: "Finance", url: "/hq/finance", icon: Banknote },
    ],
  },
  {
    label: "Products",
    items: [
      { title: "SaaS Products", url: "/hq/products", icon: Package },
      { title: "Bulk SMS", url: "/hq/sms", icon: MessageSquare },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Projects", url: "/hq/projects", icon: SquareKanban },
      { title: "Staff & Departments", url: "/hq/staff", icon: UsersRound },
      { title: "Office Desk", url: "/hq/office", icon: Users },
      { title: "Password Vault", url: "/hq/vault", icon: KeyRound },
    ],
  },
  {
    label: "Growth & Care",
    items: [
      { title: "Marketing", url: "/hq/marketing", icon: Megaphone },
      { title: "Support", url: "/hq/support", icon: HeadphonesIcon },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Security", url: "/hq/security", icon: ShieldCheck },
      { title: "Developer", url: "/hq/developer", icon: Code2 },
      { title: "AI Assistant", url: "/hq/ai", icon: Bot },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/hq" className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_20px_-2px_oklch(0.72_0.22_250/0.6)]">
            <Activity className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-bold tracking-tight">JAVALAB</span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Command Center
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="scrollbar-thin">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              {g.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary-glow data-[active=true]:ring-1 data-[active=true]:ring-primary/30"
                    >
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <div className="size-8 rounded-full bg-gradient-to-br from-chart-5/40 to-primary/40 ring-1 ring-white/10" />
          <div className="flex-1 leading-tight">
            <p className="text-xs font-medium">Anton Osika</p>
            <p className="text-[10px] text-muted-foreground">Super Admin</p>
          </div>
          <span className="size-2 rounded-full bg-success" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
