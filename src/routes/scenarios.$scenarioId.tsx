import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader, ScenarioRunner } from "@/components/learning/Primitives";
import { scenariosById } from "@/content/scenarios";

export const Route = createFileRoute("/scenarios/$scenarioId")({
  loader: ({ params }) => {
    const scenario = scenariosById[params.scenarioId];
    if (!scenario) throw notFound();
    return { scenario };
  },
  head: ({ loaderData }) =>
    loaderData
      ? { meta: [{ title: `${loaderData.scenario.title} — Scenario` }, { name: "description", content: loaderData.scenario.summary }] }
      : { meta: [{ title: "Scenario" }] },
  component: () => {
    const { scenario } = Route.useLoaderData();
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Scenario" subtitle="Work the 14-step review, then commit to a decision." />
        <ScenarioRunner scenario={scenario} />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Scenario not found.</div>,
});