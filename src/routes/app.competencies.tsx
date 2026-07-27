import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { competencies, competencyCategories } from "@/content/competencies";
import { useProgress } from "@/lib/progress";
import { STATUS_COLOR, STATUS_LABEL, emptyRecord } from "@/lib/competency";
import type { CompetencyStatus } from "@/content/types";

/**
 * Cell colours for the heat grid — a single ramp from "untouched" to
 * "mastered", with reinforcement deliberately breaking the ramp in amber so a
 * decayed skill stands out rather than reading as mid-progress.
 */
const HEAT: Record<CompetencyStatus, string> = {
  not_introduced: "border-border bg-muted",
  introduced: "border-sky-500/30 bg-sky-500/25",
  practiced: "border-sky-500/50 bg-sky-500/55",
  demonstrated: "border-emerald-500/50 bg-emerald-500/60",
  mastered: "border-emerald-600/60 bg-emerald-600",
  needs_reinforcement: "border-amber-500/60 bg-amber-500/70",
};

export const Route = createFileRoute("/app/competencies")({
  head: () => ({
    meta: [
      { title: "Competency Heatmap — EAI Career Sim" },
      {
        name: "description",
        content:
          "Track competency progression across Platform, Governance, Architecture, Security, Privacy/Legal/Risk, and Engineering. Mastery is earned through scenario performance, not page views.",
      },
    ],
  }),
  component: CompetenciesPage,
});

function CompetenciesPage() {
  const p = useProgress();
  const total = competencies.length;
  const counts: Record<CompetencyStatus, number> = {
    not_introduced: 0,
    introduced: 0,
    practiced: 0,
    demonstrated: 0,
    mastered: 0,
    needs_reinforcement: 0,
  };
  for (const comp of competencies) {
    const rec = p.competencies[comp.id] ?? emptyRecord();
    counts[rec.status] += 1;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Competency Heatmap"
        subtitle="Mastery is earned by demonstrating skill in scenarios and labs — not by opening pages. Practice artifact for learning only."
      />

      <div className="grid gap-2 md:grid-cols-6">
        {(Object.keys(counts) as CompetencyStatus[]).map((s) => (
          <Card key={s} className="p-3">
            <div
              className={`inline-block rounded border px-2 py-0.5 text-[11px] ${STATUS_COLOR[s]}`}
            >
              {STATUS_LABEL[s]}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {counts[s]}
              <span className="text-xs font-normal text-muted-foreground"> / {total}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* An actual heat grid. This page is called a heatmap but rendered 82
          identical white cards with a grey pill — no colour encoding at all,
          and 9,000px tall on mobile. Dense cells make the whole picture
          readable at a glance, which is the entire point. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Legend</span>
        {(Object.keys(counts) as CompetencyStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`size-3 rounded-sm border ${HEAT[s]}`} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {competencyCategories.map((cat) => {
        const items = competencies.filter((c) => c.category === cat.id);
        const reached = items.filter(
          (c) => (p.competencies[c.id]?.status ?? "not_introduced") !== "not_introduced",
        ).length;
        return (
          <Card key={cat.id}>
            <CardHeader className="pb-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{cat.label}</CardTitle>
                  <CardDescription>
                    {reached} of {items.length} started
                  </CardDescription>
                </div>
                <div className="text-sm font-medium tabular-nums text-muted-foreground">
                  {Math.round((reached / items.length) * 100)}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-[repeat(auto-fill,1.75rem)] gap-1.5">
                {items.map((comp) => {
                  const rec = p.competencies[comp.id] ?? emptyRecord();
                  return (
                    <li key={comp.id}>
                      <span
                        tabIndex={0}
                        role="img"
                        aria-label={`${comp.name}: ${STATUS_LABEL[rec.status]}`}
                        className={`block size-7 rounded-[3px] border transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${HEAT[rec.status]}`}
                        title={`${comp.name} — ${STATUS_LABEL[rec.status]}\n${comp.description}${
                          rec.lastPracticedTs
                            ? `\nLast practised ${new Date(rec.lastPracticedTs).toLocaleDateString()}`
                            : ""
                        }`}
                      />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">How competency status changes</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Introduced</span> — you opened a lesson tagged with this
            competency.
          </p>
          <p>
            <span className="font-medium">Practiced</span> — you passed a quiz (≥60%) or completed a
            lab module.
          </p>
          <p>
            <span className="font-medium">Demonstrated</span> — you chose the ideal option on a
            scenario step.
          </p>
          <p>
            <span className="font-medium">Mastered</span> — you demonstrated the competency across
            two or more distinct scenarios.
          </p>
          <p>
            <span className="font-medium">Needs reinforcement</span> — a recent failure, or{" "}
            {"\u2265"} 30 days without practice on a mastered skill.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
