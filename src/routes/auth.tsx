import { Link, createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { Wordmark } from "@/components/site/Logo";
import { AuthDiagnostic } from "@/components/AuthDiagnostic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — EAI Career Sim" },
      {
        name: "description",
        content: "Sign in to persist scenario runs, evidence, and review-board transcripts.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

// Signing in lands you in the portal, not on the marketing page. Anything that
// isn't a plain same-origin path is rejected so `next` can't be used to bounce
// a user off-site.
function safePath(p: string | undefined): string {
  if (!p) return "/app";
  if (!p.startsWith("/") || p.startsWith("//")) return "/app";
  return p;
}

function AuthPage() {
  const { next } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const target = safePath(next);

  useEffect(() => {
    if (!loading && user) navigate({ to: target, replace: true });
  }, [loading, user, navigate, target]);

  // Supabase returns terse strings for the two failures people actually hit.
  // Left as-is they read as "your password is wrong" when the real problem is
  // an unconfirmed address or a provider nobody enabled.
  function explain(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("email not confirmed")) {
      return "That account exists but the email address has not been confirmed yet. Use the confirmation link below, or sign in with a one-time link instead.";
    }
    if (m.includes("invalid login credentials")) {
      return "Email or password not recognised. If you signed up with Google, use the Google button — an account created that way has no password.";
    }
    if (m.includes("provider is not enabled")) {
      return "Google sign-in is not switched on for this project yet. Enable the Google provider in Supabase → Authentication → Providers, then try again. Email sign-in below works regardless.";
    }
    if (m.includes("redirect") || m.includes("not allowed")) {
      return `This address (${window.location.origin}) is not on the project's allowed redirect list. Add it in Supabase → Authentication → URL Configuration.`;
    }
    if (m.includes("rate limit") || m.includes("too many")) {
      return "Too many attempts for now. Supabase's built-in email sender is heavily rate limited on the free tier — wait a few minutes, or configure your own SMTP.";
    }
    return message;
  }

  async function signIn() {
    setErr(null);
    setNotice(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(explain(error.message));
  }

  async function signUp() {
    setErr(null);
    setNotice(null);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) {
      setErr(explain(error.message));
      return;
    }
    // When confirmation is switched off the session arrives immediately and the
    // redirect effect takes over. Telling that user to check their email would
    // send them looking for a message that is never sent.
    if (data.session) return;
    setNotice(
      `Account created. Check ${email} for a confirmation link — it may take a minute, and it is worth checking spam. If nothing arrives, use the one-time sign-in link instead.`,
    );
  }

  /**
   * Passwordless sign-in.
   *
   * The most reliable way in, and the reason it is offered first: no password
   * to forget, and it doubles as the escape hatch when a confirmation email was
   * never delivered — the same link confirms the address and signs you in.
   */
  async function magicLink() {
    setErr(null);
    setNotice(null);
    if (!email) {
      setErr("Enter your email address first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${target}` },
    });
    setBusy(false);
    if (error) setErr(explain(error.message));
    else
      setNotice(
        `Sign-in link sent to ${email}. It signs you in and confirms the address at the same time.`,
      );
  }

  async function resendConfirmation() {
    setErr(null);
    setNotice(null);
    if (!email) {
      setErr("Enter your email address first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) setErr(explain(error.message));
    else setNotice(`Confirmation email resent to ${email}.`);
  }

  /**
   * Google, through Supabase rather than through the Lovable broker.
   *
   * The generated shim routes OAuth via Lovable's own service, which only
   * accepts redirects back to a Lovable-hosted origin. On Vercel or on
   * localhost it fails, which is why the button did nothing outside Lovable.
   * Supabase's own OAuth works from any origin listed in the project's URL
   * configuration.
   */
  async function google() {
    setErr(null);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${target}` },
    });
    if (error) setErr(explain(error.message));
  }

  return (
    // Split screen: the form was previously an unbranded card floating at the
    // top of an empty white page, with no logo and no indication of what you
    // were signing in to.
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start">
          <Wordmark />
        </Link>
        <div className="w-full max-w-md">
          {/* A real <h1>: CardTitle renders a div, which left the sign-in page
              with no heading for a screen reader to land on. */}
          <h1 className="sr-only">Sign in to EAI Career Sim</h1>
          <Card className="w-full shadow-card">
            <CardHeader>
              <CardTitle>Sign in to EAI Career Sim</CardTitle>
              <CardDescription>
                Runs, evidence, decisions and audit events persist to your account. Practice only —
                do not enter real client data or production secrets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={google}>
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="space-y-3">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={signIn}
                    disabled={busy || !email || !password}
                  >
                    Sign in
                  </Button>
                  {/* Offered on equal footing rather than as a fallback: it is
                      the route that works when a confirmation email never
                      arrived, and it needs no password at all. */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={magicLink}
                    disabled={busy || !email}
                  >
                    Email me a one-time sign-in link
                  </Button>
                  <button
                    type="button"
                    onClick={resendConfirmation}
                    disabled={busy || !email}
                    className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Never got the confirmation email? Resend it
                  </button>
                </TabsContent>
                <TabsContent value="signup" className="space-y-3">
                  <div className="space-y-1">
                    <Label>Display name</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={signUp}
                    disabled={busy || !email || password.length < 8}
                  >
                    Create account
                  </Button>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Prefer not to set a password? Enter your email above and use the one-time link
                    on the Sign in tab — it creates the account and signs you in.
                  </p>
                </TabsContent>
              </Tabs>
              {notice && (
                <Alert className="border-brand/40 bg-brand/5">
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}
              {err && (
                <Alert variant="destructive">
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          {/* This used to offer "continue without signing in", pointing at /app.
              Once the portal was gated that link bounced straight back here,
              which reads exactly like a broken login. The public pages are the
              honest version of the same offer. */}
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            An account is free and it exists so your work is saved — every simulator run and
            decision becomes the record you export later. Want to look around first?{" "}
            <Link to="/paths" className="font-medium text-brand hover:underline">
              Browse the career paths
            </Link>{" "}
            or{" "}
            <Link to="/about" className="font-medium text-brand hover:underline">
              read what this is
            </Link>
            , no account needed.
          </p>
          <AuthDiagnostic />
        </div>
      </div>

      <aside className="surface-dark relative hidden overflow-hidden lg:block">
        <div className="surface-dark-grid absolute inset-0" aria-hidden />
        <div className="brand-radial absolute inset-0" aria-hidden />
        <div className="relative flex h-full flex-col justify-center px-12 py-16">
          <blockquote className="max-w-md">
            <p className="text-2xl leading-snug font-medium text-balance text-white">
              “Source trust is not content trust. Retrieved text is untrusted input.”
            </p>
            <footer className="mt-4 text-sm text-white/55">
              From the RAG and ticket-agent simulation — one of the lessons the engine will make you
              learn the hard way.
            </footer>
          </blockquote>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              ["16", "graded stages"],
              ["8", "rubric dimensions"],
              ["82", "competencies tracked"],
            ].map(([v, l]) => (
              // dt IS the label. It was previously duplicated — once sr-only and
              // once visibly — so a screen reader announced "graded stages, 16,
              // graded stages". Order is reversed with flex so the number still
              // reads first visually.
              <div key={l} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-white/50">{l}</dt>
                <dd className="text-2xl font-semibold tabular-nums text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
