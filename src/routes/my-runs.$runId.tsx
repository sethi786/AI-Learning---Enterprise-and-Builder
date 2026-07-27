import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getScenarioRunWithEvents } from "@/lib/scenarioRuns.functions";
import { useSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Data = Awaited<ReturnType<typeof getScenarioRunWithEvents>>;

export const Route = createFileRoute("/my-runs/$runId")({
  head: () => ({ meta: [{ title: "Run trace" }, { name: "robots", content: "noindex" }] }),
  component: RunTracePage,
});

const sevColor: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  error: "bg-destructive/15 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

function RunTracePage() {
  const { runId } = useParams({ from: "/my-runs/$runId" });
  const { user, loading } = useSession();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    getScenarioRunWithEvents({ data: { runId } })
      .then((d) => setData(d as Data))
      .catch((e: Error) => setErr(e.message));
  }, [runId, user, loading]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <div className="p-6 text-sm">Please <Link to="/auth" className="underline">sign in</Link>.</div>;
  if (err) return <div className="p-6 text-sm text-destructive">{err}</div>;
  if (!data?.run) return <div className="p-6 text-sm">Run not found.</div>;

  const r = data.run;
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{r.scenario_id} <span className="text-xs text-muted-foreground">({r.scenario_version})</span></h1>
          <div className="text-xs text-muted-foreground">Run {r.id}</div>
        </div>
        <Button asChild variant="ghost" size="sm"><Link to="/my-runs">← All runs</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-xs sm:grid-cols-4">
          <div><span className="text-muted-foreground">Status</span><div>{r.status}</div></div>
          <div><span className="text-muted-foreground">Stage</span><div>{r.current_stage ?? "—"}</div></div>
          <div><span className="text-muted-foreground">Score</span><div>{r.score ?? "—"} / {r.max_score ?? "—"}</div></div>
          <div><span className="text-muted-foreground">Started</span><div>{new Date(r.started_at).toLocaleString()}</div></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Append-only event log ({data.events.length})</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {data.events.map((e) => (
            <div key={e.id} className="flex flex-col gap-1 border-b py-2 text-xs last:border-b-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</span>
                <Badge variant="outline" className="font-mono">{e.kind}</Badge>
                {e.stage && <Badge variant="outline">{e.stage}</Badge>}
                <span className={`ml-auto rounded px-2 py-0.5 text-[10px] uppercase ${sevColor[e.severity] ?? sevColor.info}`}>
                  {e.severity}
                </span>
              </div>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <pre className="overflow-x-auto rounded bg-muted p-2 text-[11px]">{JSON.stringify(e.payload, null, 2)}</pre>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}