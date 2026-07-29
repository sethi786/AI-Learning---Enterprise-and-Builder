import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { pathsById } from "@/content/paths";
import { rolesById } from "@/content/roles";
import { labsById } from "@/content/labs";
import { scenariosById } from "@/content/scenarios";

export const Route = createFileRoute("/_site/paths/$pathId")({
  loader: ({ params }) => {
    const path = pathsById[params.pathId];
    if (!path) throw notFound();
    return { path };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.path.name} — EAI Career Sim` },
            { name: "description", content: loaderData.path.summary },
          ],
        }
      : { meta: [{ title: "Career path" }] },
  component: PathDetailPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Path not found</h1>
      <Button asChild className="mt-6">
        <Link to="/paths">Back to career paths</Link>
      </Button>
    </div>
  ),
});

function PathDetailPage() {
  const { path } = Route.useLoaderData();
  const roles = path.roleIds.map((id) => rolesById[id]).filter(Boolean);
  const labs = path.labIds.map((id) => labsById[id]).filter(Boolean);
  const scenarios = path.scenarioIds.map((id) => scenariosById[id]).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Link to="/paths" className="text-sm text-muted-foreground hover:text-foreground">
        ← All career paths
      </Link>

      <header className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-balance">{path.name}</h1>
        <p className="mt-3 text-lg text-brand">{path.tagline}</p>
        <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">{path.summary}</p>
      </header>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">What you will be able to do</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {path.outcomes.map((o) => (
            <li key={o} className="flex gap-3 text-sm leading-relaxed">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </section>

      {roles.length > 0 && (
        <Section title="Roles on this path">
          {roles.map((r) => (
            <ItemCard
              key={r.id}
              title={r.name}
              body={r.short}
              to="/app/roles/$roleId"
              params={{ roleId: r.id }}
            />
          ))}
        </Section>
      )}

      {labs.length > 0 && (
        <Section title="Labs">
          {labs.map((l) => (
            <ItemCard
              key={l.id}
              title={l.name}
              body={l.tagline}
              to="/app/labs/$labId"
              params={{ labId: l.id }}
            />
          ))}
        </Section>
      )}

      {scenarios.length > 0 && (
        <Section title="Scenarios">
          {scenarios.map((s) => (
            <ItemCard
              key={s.id}
              title={s.title}
              body={s.summary}
              to="/app/scenarios/$scenarioId"
              params={{ scenarioId: s.id }}
            />
          ))}
        </Section>
      )}

      <div className="mt-14 rounded-xl border bg-muted/30 px-6 py-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-balance">Ready to start?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground text-pretty">
          Create a free account and every simulator run, decision and competency you demonstrate is
          saved to it — that record is what you export as evidence later.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/app">
            Open the portal <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ItemCard({
  title,
  body,
  to,
  params,
}: {
  title: string;
  body: string;
  to: string;
  params: Record<string, string>;
}) {
  return (
    <Link to={to} params={params} className="group">
      <Card className="h-full transition-colors group-hover:border-brand/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
          </div>
          <CardDescription className="pt-1.5">{body}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}
