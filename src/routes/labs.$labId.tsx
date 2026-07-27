import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PageHeader, LessonShell, Quiz } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { labsById } from "@/content/labs";
import { scenariosById } from "@/content/scenarios";
import type { LabDef, LabModule } from "@/content/types";

export const Route = createFileRoute("/labs/$labId")({
  loader: ({ params }) => {
    const lab = labsById[params.labId];
    if (!lab) throw notFound();
    return { lab };
  },
  head: ({ loaderData }) =>
    loaderData
      ? { meta: [{ title: `${loaderData.lab.name} — Lab` }, { name: "description", content: loaderData.lab.tagline }] }
      : { meta: [{ title: "Lab" }] },
  component: LabPage,
  notFoundComponent: () => <div className="p-6">Lab not found.</div>,
});

function LabPage() {
  const { lab } = Route.useLoaderData() as { lab: LabDef };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={lab.name}
        subtitle={lab.tagline}
        right={<Badge variant={lab.depth === "deep" ? "default" : "secondary"}>{lab.depth === "deep" ? "Deep content" : "Scaffold"}</Badge>}
      />
      <Card>
        <CardHeader><CardTitle className="text-base">Mission</CardTitle><CardDescription>{lab.mission}</CardDescription></CardHeader>
      </Card>
      {lab.modules.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No modules seeded yet. Add modules in <code>src/content/labs.ts</code>.</CardContent></Card>
      ) : null}
      {lab.modules.map((m: LabModule, i: number) => {
        const scenario = m.scenarioId ? scenariosById[m.scenarioId] : undefined;
        return (
          <div key={m.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Module {i + 1}</Badge>
              <h2 className="text-lg font-semibold">{m.title}</h2>
            </div>
            <LessonShell id={`${lab.id}:${m.id}`} title={m.title} section={m.lesson} domain={lab.domain} />
            {m.quiz.length ? (
              <Quiz id={`${lab.id}:${m.id}:quiz`} questions={m.quiz} domain={lab.domain} />
            ) : null}
            {scenario ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Linked scenario</CardTitle>
                  <CardDescription>{scenario.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/scenarios/$scenarioId" params={{ scenarioId: scenario.id }} className="text-primary underline text-sm">Run scenario →</Link>
                </CardContent>
              </Card>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}