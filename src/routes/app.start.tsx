import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Clock, RotateCcw } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GOALS, STEP_KIND_LABEL, planFor, stepHref, type Goal } from "@/content/plans";
import { LEVELS, prefs, usePrefs, type Level } from "@/lib/prefs";

export const Route = createFileRoute("/app/start")({
  head: () => ({
    meta: [
      { title: "Start here" },
      {
        name: "description",
        content:
          "Two questions, then an ordered plan with a reason attached to every step. No prior knowledge assumed.",
      },
    ],
  }),
  component: StartPage,
});

function StartPage() {
  const p = usePrefs();
  // Local until confirmed, so a half-answered form does not rewrite the
  // learner's saved preferences on every click.
  const [level, setLevel] = useState<Level | undefined>(p.oriented ? p.level : undefined);
  const [goal, setGoal] = useState<Goal | undefined>(p.oriented ? p.goal : undefined);
  const [done, setDone] = useState(p.oriented && !!p.goal);

  if (done && goal) {
    return <PlanView goal={goal} level={level ?? p.level} onRedo={() => setDone(false)} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Start here"
        subtitle="Two questions. No prior knowledge assumed, and nothing here can be failed — this only decides what you are shown first."
      />

      <section>
        <h2 className="text-sm font-semibold">1. Where are you starting from?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This sets how much is explained. You can change it at any time, and nothing is ever hidden
          — the deeper layers stay one click away.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <Choice
              key={l.id}
              selected={level === l.id}
              title={l.label}
              body={l.blurb}
              onClick={() => setLevel(l.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">2. What is actually in front of you?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the closest. This decides the order of what you do, not what you are allowed to
          reach.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {GOALS.map((g) => (
            <Choice
              key={g.id}
              selected={goal === g.id}
              title={g.label}
              body={g.blurb}
              onClick={() => setGoal(g.id)}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button
          disabled={!level || !goal}
          onClick={() => {
            prefs.set({ level: level!, goal, oriented: true });
            setDone(true);
          }}
        >
          Build my plan <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button asChild variant="ghost">
          <Link to="/app">Skip — I will find my own way around</Link>
        </Button>
      </div>
    </div>
  );
}

function Choice({
  selected,
  title,
  body,
  onClick,
}: {
  selected: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected ? "border-brand bg-brand/5" : "hover:border-brand/40 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        {selected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> : null}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </button>
  );
}

function PlanView({ goal, level, onRedo }: { goal: Goal; level: Level; onRedo: () => void }) {
  const steps = planFor(goal, level);
  const total = steps.reduce((n, s) => n + s.minutes, 0);
  const g = GOALS.find((x) => x.id === goal)!;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Your plan"
        subtitle={g.blurb}
        right={
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3.5 w-3.5" /> about {Math.round(total / 30) / 2} hours
          </Badge>
        }
      />

      <p className="text-sm leading-relaxed text-muted-foreground">
        Work down the list. Each step says why it comes where it does — if a reason does not apply
        to you, skip that step, the order is a recommendation and not a lock.
      </p>

      <ol className="space-y-3">
        {steps.map((s, i) => {
          const href = stepHref(s.target);
          return (
            <li key={s.id}>
              <Card className="transition-colors hover:border-brand/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-sm font-semibold text-brand">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{s.title}</CardTitle>
                        <Badge variant="secondary" className="text-[10px]">
                          {STEP_KIND_LABEL[s.target.kind]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{s.minutes} min</span>
                      </div>
                      <CardDescription className="mt-2 leading-relaxed">
                        {s.because}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm" className="gap-1">
                    {/* Plan targets are resolved at runtime from content ids, so
                        the router cannot type-check them at this call site. */}
                    <Link to={href.to} params={href.params as never}>
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-3 border-t pt-6">
        <Button asChild variant="outline">
          <Link to="/app">Go to the dashboard</Link>
        </Button>
        <Button variant="ghost" onClick={onRedo} className="gap-1">
          <RotateCcw className="h-4 w-4" /> Answer the questions again
        </Button>
      </div>
    </div>
  );
}
