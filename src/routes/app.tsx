import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { progress } from "@/lib/progress";
import { useProgressSync } from "@/lib/useProgressSync";

export const Route = createFileRoute("/app")({
  component: PortalLayout,
});

/**
 * Records where the learner has been so the dashboard can offer to resume.
 * `progressStore.touch` existed but was never called, leaving `lastVisited`
 * permanently empty.
 */
function useVisitTracking() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  useEffect(() => {
    progress.touch(pathname);
  }, [pathname]);
}

/**
 * Chrome for the learning portal. Lives here rather than in `__root` so the
 * marketing site and the sign-in page render without a sidebar wrapped
 * around them.
 */
function PortalLayout() {
  useVisitTracking();
  useProgressSync();
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-background">
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
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
