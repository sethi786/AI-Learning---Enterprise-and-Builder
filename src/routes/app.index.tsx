import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MasteryBar, PageHeader, ProgressRing } from "@/components/learning/Primitives";
import { useProgress, domainScore, roleProgress } from "@/lib/progress";
import { findResume } from "@/lib/resume";
import { usePrefs } from "@/lib/prefs";
import { GOALS, STEP_KIND_LABEL, nextStep, planFor, stepHref } from "@/content/plans";
import { roles } from "@/content/roles";
import { labs } from "@/content/labs";
import { scenarios } from "@/content/scenarios";
import type { MasteryDomain } from "@/content/types";
import {
  Boxes,
  Shield,
  Lock,
  Compass,
  Bot,
  Scale,
  Wrench,
  ArrowRight,
  FlaskConical,
  FileCog,
  GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

/**
 * The one thing to do next.
 *
 * A dashboard of eleven cards is a menu, and a learner who does not yet know
 * the vocabulary cannot order from a menu. This answers the only question they
 * actually have — what now — with a single link and the reason for it, and it
 * is the first thing on the page.
 */
function NextStepCard() {
  const p = useProgress();
  const { level, goal, oriented } = usePrefs();

  if (!oriented || !goal) {
    return (
      <Card className="mb-6 border-brand/40 bg-brand/5">
        <CardHeader>
          <CardTitle className="text-base">Not sure where to start?</CardTitle>
          <CardDescription>
            Two questions — how much you already know, and what is actually in front of you — and
            this becomes an ordered plan instead of a catalogue. Nothing here can be failed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" className="gap-1">
            <Link to="/app/start">
              Start here <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const evidenceRefs = new Set<string>();
  for (const rec of Object.values(p.competencies ?? {})) {
    for (const e of rec.evidence ?? []) if (e.ref) evidenceRefs.add(e.ref);
  }
  const signals = {
    completedLessons: p.completedLessons,
    quizResults: p.quizResults,
    scenarioAttempts: p.scenarioAttempts,
    evidenceRefs,
  };
  const step = nextStep(goal, level, signals);
  const all = planFor(goal, level);
  const doneCount =
    all.length - all.filter((s) => !s.target || nextStepIncludes(all, step, s)).length;

  if (!step) {
    return (
      <Card className="mb-6 border-emerald-500/40 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-base">You have finished your plan</CardTitle>
          <CardDescription>
            {GOALS.find((g) => g.id === goal)?.label}. Pick a different situation to get a new
            ordered path, or work the weakest areas below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" variant="outline">
            <Link to="/app/start">Choose a new focus</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const href = stepHref(step.target);
  return (
    <Card className="mb-6 border-brand/40 bg-brand/5">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            Next — step {doneCount + 1} of {all.length}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {STEP_KIND_LABEL[step.target.kind]} · {step.minutes} min
          </Badge>
        </div>
        <CardTitle className="mt-2 text-base">{step.title}</CardTitle>
        <CardDescription className="leading-relaxed">{step.because}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="gap-1">
          <Link to={href.to} params={href.params as never}>
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/app/start">See the whole plan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** True while `s` sits at or after the current next step — i.e. not yet done. */
function nextStepIncludes(
  all: { id: string }[],
  next: { id: string } | undefined,
  s: { id: string },
) {
  if (!next) return false;
  return all.findIndex((x) => x.id === s.id) >= all.findIndex((x) => x.id === next.id);
}

const masteryMeta: {
  id: MasteryDomain;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "platform", label: "AI Platform", icon: Boxes },
  { id: "security", label: "Security Risk", icon: Shield },
  { id: "privacy_legal_risk", label: "Privacy / Legal / Risk", icon: Lock },
  { id: "architecture", label: "Architecture", icon: Compass },
  { id: "agent_rag_connector", label: "Agent / RAG / Connector", icon: Bot },
  { id: "governance_grc", label: "Governance / GRC", icon: Scale },
  { id: "ops", label: "Operations", icon: Wrench },
];

function scenarioOfDay() {
  const idx = new Date().getDate() % scenarios.length;
  return scenarios[idx];
}

function Dashboard() {
  const p = useProgress();
  const sod = scenarioOfDay();
  const weakest = [...masteryMeta]
    .sort((a, b) => (p.masteryPoints[a.id] ?? 0) - (p.masteryPoints[b.id] ?? 0))
    .slice(0, 3);

  const nextLesson = (() => {
    for (const lab of labs) {
      for (const m of lab.modules) {
        const id = `${lab.id}:${m.id}`;
        if (!p.completedLessons[id]) return { lab, module: m };
      }
    }
    return null;
  })();

  const resume = findResume(p.lastVisited);

  return (
    <div className="mx-auto max-w-7xl">
      <NextStepCard />
      <PageHeader
        title="Home Dashboard"
        subtitle="Learn to think like an AI Platform Admin, Governance Operator, Solution Architect, Security Architect, and Enterprise AI GRC Lead."
        right={
          <Button asChild>
            <Link to="/app/career-path">
              Open career path <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {resume && (
        <Card className="mb-4 border-brand/30 bg-brand/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs tracking-wide text-muted-foreground uppercase">
                Continue where you left off
              </div>
              <div className="mt-1 truncate font-semibold">{resume.place.title}</div>
              <div className="text-xs text-muted-foreground">{resume.place.kind}</div>
            </div>
            <Button asChild className="shrink-0">
              <Link to={resume.path}>
                Resume <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {roles.map((r) => {
          const lessonIds = r.labIds.flatMap((lid) =>
            (labs.find((l) => l.id === lid)?.modules ?? []).map((m) => `${lid}:${m.id}`),
          );
          const quizIds = r.labIds.flatMap((lid) =>
            (labs.find((l) => l.id === lid)?.modules ?? []).map((m) => `${lid}:${m.id}:quiz`),
          );
          const pct = roleProgress(p, lessonIds, quizIds, r.scenarioIds);
          return (
            <Card key={r.id} className="flex flex-col items-center p-4 text-center">
              <ProgressRing
                value={pct}
                label={`Stage ${Math.min(4, Math.floor(pct / 25) + 1)}/4`}
              />
              <div className="mt-3 text-sm font-semibold leading-tight">{r.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{r.short}</div>
              <Button asChild variant="ghost" size="sm" className="mt-2">
                <Link to="/app/roles/$roleId" params={{ roleId: r.id }}>
                  Open
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Scenario of the day</Badge>
              <span className="text-xs text-muted-foreground">Rotates daily</span>
            </div>
            <CardTitle className="pt-2">{sod.title}</CardTitle>
            <CardDescription>{sod.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">{sod.context}</p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link to="/app/scenarios/$scenarioId" params={{ scenarioId: sod.id }}>
                  Run scenario
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/learn/scenario">All scenarios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mastery</CardTitle>
            <CardDescription>Grows with lessons, quizzes, and scenarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {masteryMeta.map((m) => (
              <MasteryBar key={m.id} label={m.label} value={domainScore(p, m.id)} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4" /> Recommended next lesson
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextLesson ? (
              <>
                <div className="text-sm font-medium">{nextLesson.module.title}</div>
                <div className="text-xs text-muted-foreground">{nextLesson.lab.name}</div>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/app/labs/$labId" params={{ labId: nextLesson.lab.id }}>
                    Open lab
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You've completed the seeded lessons. Try a scenario or exam next.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Practice exam
            </CardTitle>
            <CardDescription>Timed mock questions across role paths.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/app/exams">Open exams</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCog className="h-4 w-4" /> Artifact builder
            </CardTitle>
            <CardDescription>Draft SAR, PIA, TAD, Threat Model, Go/No-Go and more.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/app/artifacts">Open builder</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weak areas</CardTitle>
            <CardDescription>Domains with least mastery. Target these next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakest.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <w.icon className="h-4 w-4 text-muted-foreground" />
                  {w.label}
                </span>
                <Badge variant="outline">{domainScore(p, w.id)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lab progress</CardTitle>
            <CardDescription>Modules completed in each lab.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {labs.slice(0, 6).map((l) => {
              const total = l.modules.length || 1;
              const done = l.modules.filter((m) => p.completedLessons[`${l.id}:${m.id}`]).length;
              return (
                <MasteryBar key={l.id} label={l.name} value={Math.round((done / total) * 100)} />
              );
            })}
            <Button asChild size="sm" variant="ghost" className="w-full">
              <Link to="/app/learn/role">Browse all labs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
