import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { platforms } from "@/content/platforms";
import type { PlatformDef } from "@/content/types";

export const Route = createFileRoute("/app/learn/platform")({
  head: () => ({
    meta: [
      { title: "Learn by Platform" },
      { name: "description", content: "Deep-dive lessons on enterprise AI platforms." },
    ],
  }),
  component: () => {
    const cats: Record<string, PlatformDef[]> = {};
    for (const p of platforms) (cats[p.category] ||= []).push(p);
    const order = [
      "saas-productivity",
      "saas-chat",
      "coding-assistant",
      "cloud-ai",
      "internal",
      "pattern",
    ] as const;
    const labels: Record<string, string> = {
      "saas-productivity": "SaaS Productivity",
      "saas-chat": "SaaS Chat",
      "coding-assistant": "Coding Assistants",
      "cloud-ai": "Cloud AI Platforms",
      internal: "Internal",
      pattern: "Cross-cutting Patterns",
    };
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Learn by Platform"
          subtitle="Each platform's admin, security, privacy, and governance model."
        />
        <div className="space-y-6">
          {order
            .filter((c) => cats[c])
            .map((c) => (
              <section key={c}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {labels[c]}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {cats[c].map((p) => (
                    <Link key={p.id} to="/app/platforms/$platformId" params={{ platformId: p.id }}>
                      <Card className="h-full transition-colors hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{p.name}</CardTitle>
                            <Badge variant={p.depth === "deep" ? "default" : "secondary"}>
                              {p.depth === "deep" ? "Deep" : "Scaffold"}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">{p.what}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">{p.useCases[0]}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
        </div>
      </div>
    );
  },
});
