import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/learning/Primitives";
import { roles } from "@/content/roles";

export const Route = createFileRoute("/career-path")({
  head: () => ({
    meta: [
      { title: "Career Path Map — EAI Career Sim" },
      { name: "description", content: "Visual career path from AI Platform Admin to Enterprise AI GRC Lead." },
    ],
  }),
  component: CareerPathPage,
});

function CareerPathPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Career Path Map"
        subtitle="Five roles, four stages each. Follow the arrows or jump to any role."
      />
      <div className="space-y-4">
        {roles.map((r, i) => (
          <div key={r.id}>
            <Link to="/roles/$roleId" params={{ roleId: r.id }} className="block">
              <Card className="transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">Role {r.order}</Badge>
                      <CardTitle>{r.name}</CardTitle>
                      <CardDescription>{r.short}</CardDescription>
                    </div>
                    <Badge variant={r.depth === "deep" ? "default" : "secondary"}>
                      {r.depth === "deep" ? "Deep content" : "Scaffold"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {(["beginner", "intermediate", "advanced", "expert"] as const).map((s) => (
                      <div key={s} className="rounded-md border bg-muted/30 p-2">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s}</div>
                        <div className="text-xs">{r.stages[s][0]}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
            {i < roles.length - 1 ? (
              <div className="my-2 flex justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}