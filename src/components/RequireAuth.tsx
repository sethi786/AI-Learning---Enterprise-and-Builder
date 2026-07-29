import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wordmark } from "@/components/site/Logo";
import { useSession } from "@/lib/session";

/**
 * The gate on the learning portal.
 *
 * Enforced in the component rather than in a route `beforeLoad`, because the
 * Supabase session lives in browser storage and is not available during server
 * rendering — a loader-level guard would redirect every first paint, including
 * for a signed-in learner.
 *
 * This is a product gate, not a security boundary. Anything that must actually
 * be protected is protected by row-level security on the database; this stops a
 * learner starting work that cannot be saved, which is the real cost of an
 * anonymous portal — you build up a record and lose it when the browser clears.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  // Full href including search, so a deep link survives the round trip.
  const here = useRouterState({ select: (r) => r.location.href });

  // Frozen on the first unauthenticated render, and never recomputed.
  //
  // Reading `here` live inside the effect is an infinite loop: navigating to
  // /auth updates `location.href` while this component is still mounted, so
  // the effect re-fires with `next=/auth?next=…` and redirects to itself. That
  // shipped once and rendered four routes blank.
  const target = useRef<string | null>(null);
  const redirected = useRef(false);
  if (target.current === null && !loading && !user) {
    target.current = here.startsWith("/app") ? here : "/app";
  }

  useEffect(() => {
    if (loading || user || redirected.current) return;
    redirected.current = true;
    navigate({ to: "/auth", search: { next: target.current ?? "/app" }, replace: true });
  }, [loading, user, navigate]);

  // A learner who signs in and comes back must not be stuck behind a stale
  // redirect flag if the session later drops.
  useEffect(() => {
    if (user) {
      redirected.current = false;
      target.current = null;
    }
  }, [user]);

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center px-6">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-brand"
            aria-hidden
          />
          <span>Checking your session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // The redirect above handles this in practice. This renders for the frame
    // before navigation lands, and as a working fallback if navigation fails —
    // a bare spinner there would look like a hang with no way out.
    return (
      <div className="grid min-h-svh place-items-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2">
            <Wordmark />
          </Link>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Sign in to keep your work</CardTitle>
              <CardDescription>
                The learning portal saves every simulator run, board decision and competency you
                demonstrate — that record is what you export as evidence later. It needs an account
                to belong to.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full gap-2">
                <Link to="/auth" search={{ next: target.current ?? "/app" }}>
                  <LogIn className="h-4 w-4" /> Sign in or create an account
                </Link>
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Free, and you can use a Google account or an email address. The public pages —
                career paths, what the roles involve, who this is for — stay open without one.
              </p>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to="/">Back to the public site</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
