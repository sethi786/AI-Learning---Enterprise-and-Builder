import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CoachPanel, PageHeader } from "@/components/learning/Primitives";
import { rolesById } from "@/content/roles";
import { labsById } from "@/content/labs";
import { scenariosById } from "@/content/scenarios";
import { platformsById } from "@/content/platforms";
import type { RoleDef } from "@/content/types";

export const Route = createFileRoute("/roles/$roleId")({
  loader: ({ params }) => {
    const role = rolesById[params.roleId];
    if (!role) throw notFound();
    return { role };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.role.name} — Role Path` },
            { name: "description", content: loaderData.role.short },
          ],
        }
      : { meta: [{ title: "Role" }] },
  component: RolePage,
  notFoundComponent: () => <div className="p-6">Role not found.</div>,
});

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
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

function RolePage() {
  const { role } = Route.useLoaderData() as { role: RoleDef };
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={role.name}
        subtitle={role.short}
        right={
          <Badge variant={role.depth === "deep" ? "default" : "secondary"}>
            {role.depth === "deep" ? "Deep content" : "Scaffold"}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{role.mission}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <List title="Owns" items={role.owns} />
        <List title="Daily" items={role.daily} />
        <List title="Meetings" items={role.meetings} />
        <List title="Documents" items={role.documents} />
        <List title="Questions this role asks" items={role.questions} />
        <List title="Risks this role cares about" items={role.risks} />
        <List title="Tools / platforms" items={role.tools} />
        <List title="Technical skills" items={role.technicalSkills} />
        <List title="Governance skills" items={role.governanceSkills} />
        <List title="Security skills" items={role.securitySkills} />
        <List title="Artifacts produced" items={role.artifacts} />
      </div>

      <CoachPanel tips={role.coach} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Labs for this role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {role.labIds.map((lid: string) => {
              const lab = labsById[lid];
              if (!lab) return null;
              return (
                <Link
                  key={lid}
                  to="/labs/$labId"
                  params={{ labId: lid }}
                  className="block rounded-md border p-3 text-sm hover:border-primary/50"
                >
                  <div className="font-medium">{lab.name}</div>
                  <div className="text-xs text-muted-foreground">{lab.tagline}</div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Practice scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {role.scenarioIds.map((sid: string) => {
              const sc = scenariosById[sid];
              if (!sc) return null;
              return (
                <Link
                  key={sid}
                  to="/scenarios/$scenarioId"
                  params={{ scenarioId: sid }}
                  className="block rounded-md border p-3 text-sm hover:border-primary/50"
                >
                  <div className="font-medium">{sc.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{sc.summary}</div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Platforms this role uses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {role.platformIds.map((pid: string) => {
              const pl = platformsById[pid];
              if (!pl) return null;
              return (
                <Link
                  key={pid}
                  to="/platforms/$platformId"
                  params={{ platformId: pid }}
                  className="block rounded-md border p-3 text-sm hover:border-primary/50"
                >
                  <div className="font-medium">{pl.name}</div>
                  <div className="text-xs text-muted-foreground">{pl.what}</div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stages</CardTitle>
          <CardDescription>Beginner → Expert progression for this role.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          {(["beginner", "intermediate", "advanced", "expert"] as const).map((s) => (
            <div key={s} className="rounded-md border p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s}</div>
              <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                {role.stages[s].map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
