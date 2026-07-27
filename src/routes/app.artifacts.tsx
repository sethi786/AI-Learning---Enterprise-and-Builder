import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { artifactTemplates, artifactsById } from "@/content/artifacts";
import { useProgress, progress } from "@/lib/progress";

export const Route = createFileRoute("/app/artifacts")({
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
  const [openId, setOpenId] = useState<string | null>(null);
  const inChild = matches.some((m) => m.routeId === "/app/artifacts/$artifactId");
  if (inChild) return <Outlet />;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Artifact Builder"
        subtitle="All drafts are labeled 'Practice artifact for learning only.'"
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {artifactTemplates.map((t) => (
          <Link key={t.id} to="/app/artifacts/$artifactId" params={{ artifactId: t.id }}>
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
            {p.artifacts.map((a) => {
              // Lab Engine saves under `lab:<blueprintId>`, which is not a
              // template id. Those drafts used to be listed with no way to open
              // them, so they were write-only. Show their markdown inline.
              const template = artifactsById[a.templateId];
              const origin = template ? template.name : "Lab Engine export";
              return (
                <Card key={a.id}>
                  <CardContent className="p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {origin} — {new Date(a.ts).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {template ? (
                          <Button asChild variant="outline" size="sm">
                            <Link
                              to="/app/artifacts/$artifactId"
                              params={{ artifactId: a.templateId }}
                            >
                              Open
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenId(openId === a.id ? null : a.id)}
                          >
                            {openId === a.id ? "Hide" : "View"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => progress.deleteArtifact(a.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {openId === a.id && (
                      <pre className="mt-3 max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                        {typeof a.values?.body === "string"
                          ? a.values.body
                          : JSON.stringify(a.values, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
