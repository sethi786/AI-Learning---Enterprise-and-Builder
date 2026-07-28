import type { ProgressState } from "./progress";
import type { CompetencyStatus } from "@/content/types";
import { competencies } from "@/content/competencies";
import { goNoGoCasesById } from "@/content/goNoGo";
import { labBlueprints } from "@/content/labEngine";
import { labsById } from "@/content/labs";
import { scenariosById } from "@/content/scenarios";
import { exams } from "@/content/exams";

/**
 * The evidence record.
 *
 * A learner can finish thirteen simulators, three board cases and five exams
 * and walk away with a number in localStorage. For someone trying to get hired
 * that is worth nothing — they need something to put in front of a person.
 *
 * The honesty constraint matters more here than anywhere else on the platform.
 * This is a record of *practice*, like a flight simulator logbook: it shows what
 * you worked through and how you scored, not that you have done the job. Framed
 * that way it is credible and useful. Framed as experience it is a lie that
 * collapses in the first interview, which would leave the learner worse off
 * than having nothing.
 */

export interface EvidenceLine {
  kind: "simulator" | "board" | "scenario" | "exam" | "lab";
  title: string;
  detail: string;
  /** 0..1 where a score exists. */
  score?: number;
  ts?: number;
}

export interface CompetencyLine {
  id: string;
  name: string;
  category: string;
  status: CompetencyStatus;
  demonstrations: number;
}

export interface PortfolioData {
  generatedAt: number;
  evidence: EvidenceLine[];
  competencies: CompetencyLine[];
  artifacts: { name: string; templateId: string; ts: number }[];
  counts: {
    simulators: number;
    boards: number;
    scenarios: number;
    exams: number;
    labModules: number;
    demonstrated: number;
    practised: number;
  };
}

const STRONG: CompetencyStatus[] = ["demonstrated", "mastered"];

export function buildPortfolio(p: ProgressState, now = Date.now()): PortfolioData {
  const evidence: EvidenceLine[] = [];

  // Lab Engine runs. These record competency evidence tagged `lab:<blueprintId>`
  // — the run itself is not stored, so the score comes from the evidence event.
  for (const b of labBlueprints) {
    const ref = `lab:${b.id}`;
    let best: number | undefined;
    let ts: number | undefined;
    for (const rec of Object.values(p.competencies ?? {})) {
      for (const e of rec.evidence ?? []) {
        if (e.ref !== ref) continue;
        if (e.score !== undefined) best = Math.max(best ?? 0, e.score);
        ts = Math.max(ts ?? 0, e.ts);
      }
    }
    if (ts === undefined) continue;
    evidence.push({
      kind: "simulator",
      title: b.name,
      detail: `Configured against ${b.rubric.length} scored controls and responded to ${b.injections.length} injected ${b.injections.length === 1 ? "incident" : "incidents"}. Produced a ${b.artifact.name}.`,
      score: best,
      ts,
    });
  }

  for (const [id, board] of Object.entries(goNoGoCasesById)) {
    const r = p.quizResults[`go-no-go:${id}`];
    if (!r) continue;
    evidence.push({
      kind: "board",
      title: board.title,
      detail: `Chaired the approval board: requested evidence against a ${board.requestBudget}-item budget, made the call, attached conditions, and defended it against ${board.challenges.length} challenges.`,
      score: r.total > 0 ? r.correct / r.total : undefined,
      ts: r.ts,
    });
  }

  for (const [id, attempt] of Object.entries(p.scenarioAttempts ?? {})) {
    const sc = scenariosById[id];
    const title =
      sc?.title ?? (id === "rag-ticket-agent" ? "RAG + Ticket Agent vertical slice" : id);
    evidence.push({
      kind: "scenario",
      title,
      detail: `Worked a multi-stage decision scenario end to end, with each choice constraining the next.`,
      score:
        typeof attempt.score === "number"
          ? Math.min(1, Math.max(0, attempt.score / 100))
          : undefined,
      ts: attempt.ts,
    });
  }

  for (const e of exams) {
    const r = p.quizResults[`exam:${e.id}`];
    if (!r) continue;
    evidence.push({
      kind: "exam",
      title: e.name,
      detail: `${r.correct} of ${r.total} correct.`,
      score: r.total > 0 ? r.correct / r.total : undefined,
      ts: r.ts,
    });
  }

  // Labs are summarised rather than listed per module — a page of "read module 3"
  // lines buries the work that actually demonstrates something.
  const labModuleCount = Object.keys(p.completedLessons ?? {}).length;
  const labsTouched = new Set(Object.keys(p.completedLessons ?? {}).map((k) => k.split(":")[0]));
  for (const labId of labsTouched) {
    const lab = labsById[labId];
    if (!lab) continue;
    const done = lab.modules.filter((m) => p.completedLessons[`${labId}:${m.id}`]).length;
    if (done === 0) continue;
    evidence.push({
      kind: "lab",
      title: lab.name,
      detail: `${done} of ${lab.modules.length} modules worked through, with the quiz on each.`,
      ts: Math.max(...lab.modules.map((m) => p.completedLessons[`${labId}:${m.id}`] ?? 0)),
    });
  }

  evidence.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));

  const competencyLines: CompetencyLine[] = competencies
    .map((c) => {
      const rec = p.competencies?.[c.id];
      return {
        id: c.id,
        name: c.name,
        category: c.category,
        status: rec?.status ?? "not_introduced",
        demonstrations: rec?.demonstrations ?? 0,
      };
    })
    .filter((c) => c.status !== "not_introduced")
    .sort((a, b) => b.demonstrations - a.demonstrations || a.name.localeCompare(b.name));

  return {
    generatedAt: now,
    evidence,
    competencies: competencyLines,
    artifacts: (p.artifacts ?? []).map((a) => ({
      name: a.name,
      templateId: a.templateId,
      ts: a.ts,
    })),
    counts: {
      simulators: evidence.filter((e) => e.kind === "simulator").length,
      boards: evidence.filter((e) => e.kind === "board").length,
      scenarios: evidence.filter((e) => e.kind === "scenario").length,
      exams: evidence.filter((e) => e.kind === "exam").length,
      labModules: labModuleCount,
      demonstrated: competencyLines.filter((c) => STRONG.includes(c.status)).length,
      practised: competencyLines.filter((c) => c.status === "practiced").length,
    },
  };
}

const pct = (n?: number) => (n === undefined ? "—" : `${Math.round(n * 100)}%`);
const day = (ts?: number) => (ts ? new Date(ts).toISOString().slice(0, 10) : "");

/**
 * Markdown, because it pastes into everything — an email, a CV, a LinkedIn
 * summary, a GitHub profile — without needing this site to be reachable.
 */
export function portfolioMarkdown(d: PortfolioData, name?: string): string {
  const lines: string[] = [];
  lines.push(`# AI practice record${name ? ` — ${name}` : ""}`);
  lines.push("");
  lines.push(
    `_Generated ${day(d.generatedAt)} from simulator work on EAI Career Sim. This is a record of practice, not of employment. Every exercise below is a simulation with a scored rubric; none of it is real client work._`,
  );
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(
    `- ${d.counts.simulators} lab simulators run to a scored rubric and an exported artifact`,
  );
  lines.push(`- ${d.counts.boards} approval-board cases chaired end to end`);
  lines.push(`- ${d.counts.scenarios} multi-stage decision scenarios completed`);
  lines.push(`- ${d.counts.exams} role exams sat`);
  lines.push(`- ${d.counts.labModules} lab modules worked through`);
  lines.push(
    `- ${d.counts.demonstrated} competencies demonstrated across more than one exercise, ${d.counts.practised} practised`,
  );
  lines.push("");

  if (d.evidence.length) {
    lines.push("## What I worked through");
    lines.push("");
    for (const e of d.evidence) {
      const score = e.score !== undefined ? ` — scored ${pct(e.score)}` : "";
      lines.push(`### ${e.title}${score}`);
      lines.push(e.detail);
      lines.push("");
    }
  }

  const strong = d.competencies.filter((c) => STRONG.includes(c.status));
  if (strong.length) {
    lines.push("## Competencies demonstrated");
    lines.push("");
    lines.push(
      "_Demonstrated means shown in more than one distinct exercise, not simply read about._",
    );
    lines.push("");
    for (const c of strong) {
      lines.push(`- **${c.name}** — ${c.demonstrations} distinct demonstrations`);
    }
    lines.push("");
  }

  if (d.artifacts.length) {
    lines.push("## Practice artifacts produced");
    lines.push("");
    lines.push(
      "_Documents written during the exercises above. Practice output — not real approvals, risk acceptances or production evidence._",
    );
    lines.push("");
    for (const a of d.artifacts) lines.push(`- ${a.name} (${day(a.ts)})`);
    lines.push("");
  }

  lines.push("## How to read this");
  lines.push("");
  lines.push(
    "Simulator work is not job experience and this record does not claim it is. What it does show is that the scenarios below are familiar, that the trade-offs have been reasoned about under a scored rubric, and that the resulting decisions can be discussed rather than recited.",
  );
  lines.push("");

  return lines.join("\n");
}
