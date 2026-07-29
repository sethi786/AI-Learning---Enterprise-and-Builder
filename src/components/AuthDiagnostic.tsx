import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Self-diagnosis for sign-in.
 *
 * Auth fails for a small number of reasons and Supabase reports almost all of
 * them as the same terse string, so "it doesn't work" is where most people
 * stop. This asks the project directly what it supports and reports the answers
 * against what this deployment needs, so the fix is identifiable without a
 * console or a support ticket.
 *
 * Everything shown here is already public: the project URL and anon key ship in
 * the client bundle by design, and the settings endpoint is unauthenticated.
 */

type Check = {
  label: string;
  state: "ok" | "warn" | "fail";
  detail: string;
  fix?: string;
};

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_ = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export function AuthDiagnostic() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const out: Check[] = [];
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    // 1. Is the app configured at all? A deploy missing these has no chance.
    if (!URL_ || !KEY_) {
      out.push({
        label: "Supabase credentials in this build",
        state: "fail",
        detail: `Missing ${!URL_ ? "VITE_SUPABASE_URL" : ""}${!URL_ && !KEY_ ? " and " : ""}${!KEY_ ? "VITE_SUPABASE_PUBLISHABLE_KEY" : ""}.`,
        fix: "Add both as environment variables in your hosting project, then redeploy. Vite inlines them at build time, so a redeploy is required — restarting is not enough.",
      });
      setChecks(out);
      setBusy(false);
      return;
    }
    out.push({
      label: "Supabase credentials in this build",
      state: "ok",
      detail: URL_,
    });

    // 2. Can the browser actually reach the project?
    let settings: {
      external?: Record<string, boolean>;
      disable_signup?: boolean;
      mailer_autoconfirm?: boolean;
    } | null = null;
    try {
      const res = await fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY_ } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      settings = await res.json();
      out.push({
        label: "Project reachable from this browser",
        state: "ok",
        detail: "The authentication service responded.",
      });
    } catch (e) {
      out.push({
        label: "Project reachable from this browser",
        state: "fail",
        detail: `Could not reach ${URL_} — ${e instanceof Error ? e.message : String(e)}`,
        fix: "Most often the project is paused (free projects pause after inactivity) or the URL is wrong. Open the Supabase dashboard and check the project is active, then compare the URL exactly.",
      });
      setChecks(out);
      setBusy(false);
      return;
    }

    // 3. Is signing up allowed at all?
    if (settings?.disable_signup) {
      out.push({
        label: "New accounts",
        state: "fail",
        detail: "Sign-ups are disabled on this project.",
        fix: "Supabase → Authentication → Sign In / Providers → enable 'Allow new users to sign up'.",
      });
    } else {
      out.push({ label: "New accounts", state: "ok", detail: "Sign-ups are allowed." });
    }

    // 4. Google, which is the button most people press first.
    const google = settings?.external?.google;
    out.push(
      google
        ? { label: "Google sign-in", state: "ok", detail: "The Google provider is enabled." }
        : {
            label: "Google sign-in",
            state: "warn",
            detail: "The Google provider is not enabled on this project.",
            fix: "Supabase → Authentication → Providers → Google. You will need a client ID and secret from the Google Cloud console. Email sign-in works without this.",
          },
    );

    // 5. Email confirmation, which is where most first sign-ups stall.
    out.push(
      settings?.mailer_autoconfirm
        ? {
            label: "Email confirmation",
            state: "ok",
            detail: "Confirmation is off — new accounts can sign in immediately.",
          }
        : {
            label: "Email confirmation",
            state: "warn",
            detail: "New accounts must confirm by email before they can sign in with a password.",
            fix: "Supabase's built-in sender is rate limited to a handful of emails per hour and often lands in spam. Either use the one-time sign-in link above, which confirms and signs you in together, or configure your own SMTP under Authentication → Emails.",
          },
    );

    // 6. Redirect allowlist — invisible until OAuth silently bounces.
    out.push({
      label: "This address must be on the redirect allowlist",
      state: "warn",
      detail: origin,
      fix: `Supabase → Authentication → URL Configuration. Set Site URL to ${origin} and add ${origin}/** to Redirect URLs. Sign-in links and Google both return here, and an address that is not listed is rejected without a visible error.`,
    });

    setChecks(out);
    setBusy(false);
  }

  return (
    <div className="mt-6">
      {!checks ? (
        <Button variant="ghost" size="sm" onClick={run} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign-in not working? Check the configuration
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="text-sm font-semibold">Configuration check</div>
          {checks.map((c) => (
            <div key={c.label} className="flex gap-2.5 text-sm">
              {c.state === "ok" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : c.state === "warn" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              )}
              <div className="min-w-0">
                <div className="font-medium">{c.label}</div>
                <div className="break-words text-muted-foreground">{c.detail}</div>
                {c.fix ? (
                  <div className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Fix: </span>
                    {c.fix}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setChecks(null)} className="mt-1">
            Hide
          </Button>
        </div>
      )}
    </div>
  );
}
