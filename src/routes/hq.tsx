import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/hq/app-sidebar";
import { TopBar } from "@/components/hq/top-bar";

export const Route = createFileRoute("/hq")({
  component: HQLayout,
});

function HQLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col bg-transparent">
          <TopBar />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px]">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
