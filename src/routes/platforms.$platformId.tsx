import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PageHeader, Quiz, RiskBadge } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { platformsById } from "@/content/platforms";
import { scenariosById } from "@/content/scenarios";

export const Route = createFileRoute("/platforms/$platformId")({
  loader: ({ params }) => {
    const platform = platformsById[params.platformId];
    if (!platform) throw notFound();
    return { platform };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.platform.name} — Platform` },
            { name: "description", content: loaderData.platform.what },
          ],
        }
      : { meta: [{ title: "Platform" }] },
  component: PlatformPage,
  notFoundComponent: () => <div className="p-6">Platform not found.</div>,
});

function List({
  title,
  items,
  badge,
}: {
  title: string;
  items: string[];
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {title}
          {badge}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PlatformPage() {
  const { platform: p } = Route.useLoaderData();
  const sc = p.scenarioId ? scenariosById[p.scenarioId] : undefined;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={p.name}
        subtitle={p.what}
        right={
          <Badge variant={p.depth === "deep" ? "default" : "secondary"}>
            {p.depth === "deep" ? "Deep content" : "Scaffold"}
          </Badge>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reference architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{p.architecture}</p>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <List title="Enterprise use cases" items={p.useCases} />
        <List title="Admin responsibilities" items={p.adminResponsibilities} />
        <List title="Security model" items={p.securityModel} />
        <List title="IAM model" items={p.iamModel} />
        <List title="Data model" items={p.dataModel} />
        <List title="Privacy considerations" items={p.privacy} />
        <List title="Legal considerations" items={p.legal} />
        <List title="Data governance" items={p.dataGovernance} />
        <List title="Agent / connector risks" items={p.agentConnectorRisks} />
        <List title="Environments" items={p.environments} />
        <List title="Common risks" items={p.commonRisks} badge={<RiskBadge level="high" />} />
        <List title="Fixes" items={p.fixes} badge={<RiskBadge level="low" />} />
        <List title="Evidence required" items={p.evidence} />
      </div>
      {sc ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Practice scenario</CardTitle>
            <CardDescription>{sc.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/scenarios/$scenarioId"
              params={{ scenarioId: sc.id }}
              className="text-primary underline text-sm"
            >
              Run this scenario →
            </Link>
          </CardContent>
        </Card>
      ) : null}
      {p.quiz.length ? (
        <Quiz id={`platform:${p.id}:quiz`} questions={p.quiz} domain="platform" />
      ) : null}
    </div>
  );
}
