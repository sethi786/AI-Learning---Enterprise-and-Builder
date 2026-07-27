import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

/**
 * Pathless layout for the public marketing site: it contributes chrome but no
 * URL segment, so pages keep clean top-level paths like `/paths` and `/about`.
 */
function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
