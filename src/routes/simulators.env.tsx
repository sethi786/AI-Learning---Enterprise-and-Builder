import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/simulators/env")({
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
                <p className="pt-2 text-xs text-muted-foreground">
                  Ideal:{" "}
                  <Badge variant="outline">{stageLabel[c.ideal as (typeof stages)[number]]}</Badge>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
        <Button onClick={() => setChecked((v) => !v)}>{checked ? "Reset" : "Check answers"}</Button>
      </div>
    </div>
  );
}
