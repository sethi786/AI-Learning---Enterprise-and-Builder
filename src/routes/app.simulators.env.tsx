import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/simulators/env")({
  head: () => ({
    meta: [
      { title: "AI Lab → Prod Simulator" },
      { name: "description", content: "Pick the right environment for each scenario." },
    ],
  }),
  component: Env,
});

const cases = [
  { id: "c1", text: "A team wants to compare 3 models on synthetic data.", ideal: "ai-lab" },
  { id: "c2", text: "Feature build with unit tests, no real users.", ideal: "dev" },
  {
    id: "c3",
    text: "Integration + security + connector tests with sanitized data.",
    ideal: "test",
  },
  { id: "c4", text: "Business users validate accuracy on real docs.", ideal: "uat" },
  { id: "c5", text: "Controlled 500-user rollout with support model.", ideal: "pilot" },
  {
    id: "c6",
    text: "Full rollout with monitoring, incident response, and recertification.",
    ideal: "prod",
  },
];

const stages = ["ai-lab", "dev", "test", "uat", "pilot", "prod"] as const;
const stageLabel: Record<(typeof stages)[number], string> = {
  "ai-lab": "AI Lab",
  dev: "Dev",
  test: "Test",
  uat: "UAT",
  pilot: "Pilot",
  prod: "Production",
};

function Env() {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const answered = cases.filter((c) => picks[c.id]).length;
  const correct = cases.filter((c) => picks[c.id] === c.ideal).length;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="AI Lab → Prod Simulator"
        subtitle="Which environment does each scenario belong in today?"
      />
      <div className="space-y-3">
        {cases.map((c, i) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">Case {i + 1}</CardTitle>
              <CardDescription>{c.text}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stages.map((s) => {
                  const active = picks[c.id] === s;
                  const isIdeal = checked && s === c.ideal;
                  const isWrong = checked && active && s !== c.ideal;
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className={`${isIdeal ? "border-emerald-500/60" : ""} ${isWrong ? "border-rose-500/60" : ""}`}
                      onClick={() => setPicks((p) => ({ ...p, [c.id]: s }))}
                    >
                      {stageLabel[s]}
                    </Button>
                  );
                })}
              </div>
              {checked ? (
                // A <div>, not a <p>: Badge renders a div, and a div inside a p
                // is invalid HTML that React reports as a hydration error.
                <div className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
                  Ideal:{" "}
                  <Badge variant="outline">{stageLabel[c.ideal as (typeof stages)[number]]}</Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {checked && (
          <Card
            className={
              correct === cases.length
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-amber-500/50 bg-amber-500/5"
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    {correct === cases.length
                      ? "All correct"
                      : `${cases.length - correct} to revisit`}
                  </CardTitle>
                  <CardDescription>
                    Environment choice is a risk decision: the control set has to match the data and
                    the blast radius, not the deadline.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold tabular-nums">
                    {correct}/{cases.length}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
        <div className="flex gap-2">
          <Button onClick={() => setChecked(true)} disabled={answered < cases.length}>
            {answered < cases.length
              ? `Answer all ${cases.length} cases (${answered}/${cases.length})`
              : "Check answers"}
          </Button>
          {/* Reset used to only flip `checked`, leaving every previous pick
              selected — so "Reset" visibly did nothing. */}
          {(checked || answered > 0) && (
            <Button
              variant="outline"
              onClick={() => {
                setPicks({});
                setChecked(false);
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
