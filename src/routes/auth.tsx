import { Link, createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session";
import { Wordmark } from "@/components/site/Logo";
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
  const [busy, setBusy] = useState(false);
  const target = safePath(next);

  useEffect(() => {
    if (!loading && user) navigate({ to: target, replace: true });
  }, [loading, user, navigate, target]);

  async function signIn() {
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
  }

  async function signUp() {
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${target}`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setErr("Check your email to confirm the account, then sign in.");
  }

  async function google() {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) setErr(String((result.error as Error).message ?? result.error));
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
                </TabsContent>
              </Tabs>
              {err && (
                <Alert>
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          <p className="mt-6 text-sm text-muted-foreground">
            You do not need an account to learn.{" "}
            <Link to="/app" className="font-medium text-brand hover:underline">
              Continue without signing in
            </Link>
            .
          </p>
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
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <div className="text-2xl font-semibold tabular-nums text-white">{v}</div>
                  <div className="mt-1 text-xs text-white/50">{l}</div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
