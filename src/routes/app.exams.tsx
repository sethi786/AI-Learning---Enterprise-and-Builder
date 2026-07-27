import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exams } from "@/content/exams";

export const Route = createFileRoute("/app/exams")({
  head: () => ({
    meta: [
      { title: "Practice Exams" },
      { name: "description", content: "Scenario-based practice exams for each role." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const matches = useMatches();
  const inChild = matches.some((m) => m.routeId === "/app/exams/$examId");
  if (inChild) return <Outlet />;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Practice Exams"
        subtitle="One deep exam (Security Architect) plus samples for other roles."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {exams.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{e.name}</CardTitle>
                <Badge variant={e.depth === "deep" ? "default" : "secondary"}>
                  {e.depth === "deep" ? "Deep" : "Sample"}
                </Badge>
              </div>
              <CardDescription>{e.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link to="/app/exams/$examId" params={{ examId: e.id }}>
                  Start exam ({e.questions.length} q)
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
