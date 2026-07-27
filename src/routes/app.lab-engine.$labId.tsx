import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { LabEngineRunner } from "@/components/learning/LabEngine";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getLabBlueprint } from "@/content/labEngine";
import type { LabBlueprint } from "@/content/labEngine";

export const Route = createFileRoute("/app/lab-engine/$labId")({
  loader: ({ params }) => {
    const blueprint = getLabBlueprint(params.labId);
    if (!blueprint) throw notFound();
    return { blueprint };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.blueprint.name} — Lab Engine` },
            { name: "description", content: loaderData.blueprint.tagline },
          ],
        }
      : { meta: [{ title: "Lab Engine" }] },
  component: LabEnginePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-6 text-sm">
      Lab blueprint not found.{" "}
      <Link to="/app/lab-engine" className="underline">
        Back to Lab Engine
      </Link>
      .
    </div>
  ),
});

function LabEnginePage() {
  const { blueprint } = Route.useLoaderData() as { blueprint: LabBlueprint };
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
          <Link to="/app/lab-engine">
            <ChevronLeft className="h-4 w-4" /> All labs
          </Link>
        </Button>
      </div>
      <PageHeader title={blueprint.name} subtitle={blueprint.tagline} />
      <LabEngineRunner blueprint={blueprint} />
    </div>
  );
}
