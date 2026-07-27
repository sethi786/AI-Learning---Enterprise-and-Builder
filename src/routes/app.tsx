import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/app")({
  component: PortalLayout,
});

/**
 * Chrome for the learning portal. Lives here rather than in `__root` so the
 * marketing site and the sign-in page render without a sidebar wrapped
 * around them.
 */
function PortalLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">
              Enterprise AI Career Learning Simulator
            </span>
            {/* Without this the portal is a one-way door — there is no other
                route back out to the public site. */}
            <Link
              to="/"
              className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to site
            </Link>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
