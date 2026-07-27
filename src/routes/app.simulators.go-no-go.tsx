import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { scenarios } from "@/content/scenarios";

export const Route = createFileRoute("/app/simulators/go-no-go")({
  head: () => ({
    meta: [
      { title: "Go / No-Go Simulator" },
      { name: "description", content: "Make the final go/no-go call on real scenarios." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Go / No-Go Simulator"
        subtitle="Every scenario ends with a decision. Practice defending yours."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {scenarios.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{s.title}</CardTitle>
                <Badge variant="outline" className="capitalize">
                  {s.difficulty}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">{s.finalDecision.prompt}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link to="/app/scenarios/$scenarioId" params={{ scenarioId: s.id }}>
                  Decide
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ),
});
