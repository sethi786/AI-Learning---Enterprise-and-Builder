import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scenarios } from "@/content/scenarios";

export const Route = createFileRoute("/learn/scenario")({
  head: () => ({ meta: [{ title: "Learn by Scenario" }, { name: "description", content: "Full scenario library across roles and domains." }] }),
  component: () => (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Learn by Scenario" subtitle="Every scenario runs through the 14-step review flow." />
      <div className="grid gap-3 md:grid-cols-2">
        {scenarios.map((s) => (
          <Link key={s.id} to="/scenarios/$scenarioId" params={{ scenarioId: s.id }}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <Badge variant="outline" className="capitalize">{s.difficulty}</Badge>
                </div>
                <CardDescription>{s.summary}</CardDescription>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground line-clamp-3">{s.context}</p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  ),
});