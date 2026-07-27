import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, ArrowRight } from "lucide-react";
import { labBlueprints } from "@/content/labEngine";

export const Route = createFileRoute("/app/lab-engine")({
  head: () => ({
    meta: [
      { title: "Lab Engine — Interactive AI Labs" },
      {
        name: "description",
        content:
          "Interactive AI labs with configuration panels, streamed logs, injected failures and attacks, rubric scoring, debrief, and artifact export.",
      },
    ],
  }),
  component: LabEngineIndex,
});

function LabEngineIndex() {
  // This route is a parent of a $param child. Without handing off to the
  // Outlet, the detail page silently renders this index instead.
  const matches = useMatches();
  if (matches.some((m) => m.routeId === "/app/lab-engine/$labId")) return <Outlet />;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Lab Engine"
        subtitle="Configure → run → respond to injected failures and attacks → score → debrief → export a practice artifact."
        right={
          <Badge variant="outline" className="gap-1">
            <FlaskConical className="h-3.5 w-3.5" /> Simulator only
          </Badge>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {labBlueprints.map((b) => (
          <Card key={b.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{b.name}</CardTitle>
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {b.domain.replace(/_/g, " ")}
                </Badge>
              </div>
              <CardDescription>{b.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{b.summary}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-[11px] text-muted-foreground">
                  <span>{b.config.length} config knobs</span>
                  <span>·</span>
                  <span>{b.injections.length} injections</span>
                  <span>·</span>
                  <span>{b.rubric.length} rubric items</span>
                </div>
                <Button asChild size="sm" className="gap-1">
                  <Link to="/app/lab-engine/$labId" params={{ labId: b.id }}>
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        This is a learning simulator. No real client data. Artifacts produced here are for practice
        only and must not be used as real approvals, real risk acceptance, or production evidence.
      </p>
    </div>
  );
}
