import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { LabEngineRunner } from "@/components/learning/LabEngine";
import { Button } from "@/components/ui/button";
import { getLabBlueprint } from "@/content/labEngine";
import type { LabBlueprint } from "@/content/labEngine";

export const Route = createFileRoute("/app/simulators/saas-onboarding")({
  head: () => ({
    meta: [
      { title: "SaaS AI Onboarding Simulator" },
      {
        name: "description",
        content:
          "Configure a SaaS AI tenant before 2,000 licences activate: connectors, retention, audit export, sharing and licence model — then handle an unreviewed connector and a 3× cost overrun.",
      },
    ],
  }),
  component: SaasOnboardingSimulator,
});

function SaasOnboardingSimulator() {
  // Resolved on the client rather than in a loader: a blueprint carries
  // closures (rubric checks, artifact builder) that the SSR serializer strips.
  const blueprint = getLabBlueprint("saas-tenant-onboarding") as LabBlueprint;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="SaaS AI Onboarding Simulator"
        subtitle={blueprint.tagline}
        right={
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/app/labs/$labId" params={{ labId: "saas-onboarding" }}>
              <BookOpen className="h-4 w-4" /> Read the lab first
            </Link>
          </Button>
        }
      />
      <LabEngineRunner blueprint={blueprint} />
    </div>
  );
}
