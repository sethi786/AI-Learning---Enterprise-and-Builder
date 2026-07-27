import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About — EAI Career Sim" },
      {
        name: "description",
        content:
          "Why this exists: enterprise AI roles are defined by judgement under pressure, and judgement is not something you can absorb from a lecture.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-balance">Why this exists</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          Enterprises adopted AI faster than they built the roles to govern it. The people now
          responsible — platform admins, solution architects, security architects, governance leads
          — largely learned on the job, during incidents, without a map.
        </p>
        <p>
          The hard part of those jobs is not knowing what a vector database is. It is judgement
          under pressure: deciding whether a connector should be enabled, spotting that a retrieval
          pipeline has no permission filter, and defending that call to a review board with evidence
          rather than opinion.
        </p>
        <p>
          Judgement does not transfer through lectures. It comes from making decisions, seeing the
          consequences, and being asked to justify them. So this is built as a simulator: you
          configure real system shapes, they get attacked in ways real systems get attacked, and you
          are scored on how you respond.
        </p>

        <h2 className="pt-4 text-2xl font-bold tracking-tight text-foreground">How it is built</h2>
        <p>
          Every lesson is written in three tiers — a plain explanation, the enterprise context, and
          a technical deep dive — so a student and a practising architect can use the same material
          at different depths. Scenarios and labs are deterministic: the same decisions always
          produce the same outcome, so you can retry and understand exactly what changed.
        </p>

        <h2 className="pt-4 text-2xl font-bold tracking-tight text-foreground">
          What we are honest about
        </h2>
        <p>
          This is a growing product and not every path is finished. Content still being written is
          labelled as such throughout the site rather than presented as complete. The security
          architecture and platform operations tracks are the deepest today; others are outlines we
          are actively filling in.
        </p>
        <p>
          Everything is simulated. No real credentials, client data, or approvals are involved, and
          artifacts you generate are marked as practice material.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/app">Open the portal</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/paths">Browse career paths</Link>
        </Button>
      </div>
    </div>
  );
}
