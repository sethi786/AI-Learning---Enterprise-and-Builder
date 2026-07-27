import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { LabEngineRunner } from "@/components/learning/LabEngine";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getLabBlueprint } from "@/content/labEngine";
import type { LabBlueprint } from "@/content/labEngine";

export const Route = createFileRoute("/app/lab-engine/$labId")({
  // Return plain, serializable data only. A LabBlueprint carries closures
  // (`rubric[].check`, `artifact.build`), and loader results are dehydrated
  // through the SSR serializer — passing the object through would strip the
  // functions and blow up on first use. The component re-resolves it by id.
  loader: ({ params }) => {
    const blueprint = getLabBlueprint(params.labId);
    if (!blueprint) throw notFound();
    return { labId: params.labId, name: blueprint.name, tagline: blueprint.tagline };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.name} — Lab Engine` },
            { name: "description", content: loaderData.tagline },
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
  const { labId } = Route.useLoaderData();
  // Resolve the live object (with its closures intact) on the client.
  const blueprint = getLabBlueprint(labId) as LabBlueprint;
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
