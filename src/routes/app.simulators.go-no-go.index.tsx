import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gavel } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { goNoGoCases } from "@/content/goNoGo";

export const Route = createFileRoute("/app/simulators/go-no-go/")({
  head: () => ({
    meta: [
      { title: "Go / No-Go Board" },
      {
        name: "description",
        content:
          "Chair the approval board: request the evidence that is actually missing, make the call, attach enforceable conditions, and defend it under challenge.",
      },
    ],
  }),
  component: GoNoGoIndex,
});

function GoNoGoIndex() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Go / No-Go Board"
        subtitle="You are in the chair. The pack is incomplete, the room wants an answer today, and whatever you sign has your name on it."
        right={
          <Badge variant="outline" className="gap-1">
            <Gavel className="h-3.5 w-3.5" /> Scored on 4 dimensions
          </Badge>
        }
      />

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">How a case runs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <Step
            n={1}
            title="Evidence"
            body="Request what is missing. Requests are budgeted, so asking for a document already in the pack costs you."
          />
          <Step
            n={2}
            title="Decision"
            body="Go, go with conditions, or no-go — scored on whether it is defensible given what you knew."
          />
          <Step
            n={3}
            title="Conditions"
            body="Only enforceable conditions count. Padding the list with good practice dilutes the ones that matter."
          />
          <Step
            n={4}
            title="Challenge"
            body="Stakeholders push back. Folding scores nothing; so does refusing to engage with a fair point."
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {goNoGoCases.map((c) => (
          <Card key={c.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{c.title}</CardTitle>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {c.tier}
                </Badge>
              </div>
              <CardDescription>{c.summary}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">
                {c.evidence.filter((e) => e.critical).length} critical gaps · {c.requestBudget}{" "}
                requests · {c.challenges.length} challenges
              </span>
              <Button asChild size="sm" className="gap-1">
                <Link to="/app/simulators/go-no-go/$caseId" params={{ caseId: c.id }}>
                  Take the chair <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        This is a learning simulator. Decisions recorded here are practice only and must not be used
        as real approvals or real risk acceptance.
      </p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
          {n}
        </span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <p className="mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
