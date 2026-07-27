import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { roles } from "@/content/roles";
import { DepthBadge } from "@/components/learning/DepthBadge";

export const Route = createFileRoute("/app/learn/role")({
  head: () => ({
    meta: [
      { title: "Learn by Role" },
      {
        name: "description",
        content: "Pick a role and learn its mindset, artifacts, and technical skills.",
      },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Learn by Role"
        subtitle="Five paths, from Platform Admin to Enterprise GRC Lead."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((r) => (
          <Link key={r.id} to="/app/roles/$roleId" params={{ roleId: r.id }}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{r.name}</CardTitle>
                  <DepthBadge depth={r.depth} />
                </div>
                <CardDescription>{r.short}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-3">{r.mission}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  ),
});
