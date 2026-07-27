import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyScenarioRuns } from "@/lib/scenarioRuns.functions";
import { useSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Run = Awaited<ReturnType<typeof listMyScenarioRuns>>[number];

export const Route = createFileRoute("/my-runs")({
  head: () => ({
    meta: [
      { title: "My Runs — Assurance Platform" },
      {
        name: "description",
        content:
          "Immutable audit trail of every scenario run: stage transitions, config changes, injections, diagnoses, decisions.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyRunsPage,
});

function MyRunsPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    listMyScenarioRuns()
      .then((r) => setRuns(r as Run[]))
      .catch((e: Error) => setErr(e.message));
  }, [user, loading]);

  if (loading)
    return <div className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to view your runs</CardTitle>
            <CardDescription>
              Scenario runs, events, and decisions are stored to your account so an auditor could
              replay every step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: "/auth", search: { next: "/my-runs" } })}>
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My scenario runs</h1>
        <p className="text-sm text-muted-foreground">
          Append-only audit trail. Nothing here is a real approval or production evidence.
        </p>
      </div>
      {err && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{err}</CardContent>
        </Card>
      )}
      {runs && runs.length === 0 && (
        <Card>
          <CardContent className="p-4 text-sm">
            No runs yet.{" "}
            <Link to="/scenarios/rag-ticket-agent" className="underline">
              Start the RAG + Ticket Agent scenario
            </Link>
            .
          </CardContent>
        </Card>
      )}
      {runs?.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-medium">
                {r.scenario_id}{" "}
                <span className="text-xs text-muted-foreground">({r.scenario_version})</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Started {new Date(r.started_at).toLocaleString()}
                {r.finished_at ? ` · Finished ${new Date(r.finished_at).toLocaleString()}` : ""}
                {r.current_stage ? ` · Stage: ${r.current_stage}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  r.status === "passed"
                    ? "default"
                    : r.status === "failed"
                      ? "destructive"
                      : "outline"
                }
              >
                {r.status}
              </Badge>
              {r.score != null && r.max_score != null && (
                <Badge variant="outline">{Math.round((r.score / r.max_score) * 100)}%</Badge>
              )}
              <Button asChild size="sm" variant="outline">
                <Link to="/my-runs/$runId" params={{ runId: r.id }}>
                  Open trace
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
