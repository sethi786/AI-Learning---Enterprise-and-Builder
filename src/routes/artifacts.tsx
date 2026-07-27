import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { artifactTemplates } from "@/content/artifacts";
import { useProgress, progress } from "@/lib/progress";

export const Route = createFileRoute("/artifacts")({
  head: () => ({
    meta: [
      { title: "Artifact Builder" },
      {
        name: "description",
        content:
          "Draft SAR, PIA, TAD, Threat Model, Go/No-Go and more — labeled 'Practice artifact for learning only.'",
      },
    ],
  }),
  component: ArtifactsPage,
});

function ArtifactsPage() {
  const matches = useMatches();
  const p = useProgress();
  const inChild = matches.some((m) => m.routeId === "/artifacts/$artifactId");
  if (inChild) return <Outlet />;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Artifact Builder"
        subtitle="All drafts are labeled 'Practice artifact for learning only.'"
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {artifactTemplates.map((t) => (
          <Link key={t.id} to="/artifacts/$artifactId" params={{ artifactId: t.id }}>
            <Card className="h-full hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <Badge variant="outline">{t.category}</Badge>
                </div>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      {p.artifacts.length ? (
        <div className="pt-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Saved drafts
          </h2>
          <div className="space-y-2">
            {p.artifacts.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.templateId} — {new Date(a.ts).toLocaleString()}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => progress.deleteArtifact(a.id)}>
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
