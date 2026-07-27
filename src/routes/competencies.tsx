import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { competencies, competencyCategories } from "@/content/competencies";
import { useProgress } from "@/lib/progress";
import { STATUS_COLOR, STATUS_LABEL, emptyRecord } from "@/lib/competency";
import type { CompetencyStatus } from "@/content/types";

export const Route = createFileRoute("/competencies")({
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
            <div className={`inline-block rounded border px-2 py-0.5 text-[11px] ${STATUS_COLOR[s]}`}>
              {STATUS_LABEL[s]}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {counts[s]}
              <span className="text-xs font-normal text-muted-foreground"> / {total}</span>
            </div>
          </Card>
        ))}
      </div>

      {competencyCategories.map((cat) => {
        const items = competencies.filter((c) => c.category === cat.id);
        return (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle className="text-base">{cat.label}</CardTitle>
              <CardDescription>{items.length} competencies</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((comp) => {
                  const rec = p.competencies[comp.id] ?? emptyRecord();
                  return (
                    <li
                      key={comp.id}
                      className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">{comp.name}</div>
                        <div className="text-xs text-muted-foreground leading-snug">
                          {comp.description}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_COLOR[rec.status]}`}
                        title={
                          rec.lastPracticedTs
                            ? `Last practiced ${new Date(rec.lastPracticedTs).toLocaleDateString()}`
                            : "Not yet practiced"
                        }
                      >
                        {STATUS_LABEL[rec.status]}
                      </span>
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
          <p><span className="font-medium">Introduced</span> — you opened a lesson tagged with this competency.</p>
          <p><span className="font-medium">Practiced</span> — you passed a quiz (≥60%) or completed a lab module.</p>
          <p><span className="font-medium">Demonstrated</span> — you chose the ideal option on a scenario step.</p>
          <p><span className="font-medium">Mastered</span> — you demonstrated the competency across two or more distinct scenarios.</p>
          <p><span className="font-medium">Needs reinforcement</span> — a recent failure, or {"\u2265"} 30 days without practice on a mastered skill.</p>
        </CardContent>
      </Card>
    </div>
  );
}