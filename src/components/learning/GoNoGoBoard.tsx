import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  FileWarning,
  Gavel,
  RotateCcw,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { progress } from "@/lib/progress";
import type { GoNoGoCase } from "@/content/goNoGo";

/**
 * The Go/No-Go board.
 *
 * Four scored phases, because these decisions fail in four distinct ways:
 * asking for the wrong evidence, making an indefensible call, attaching
 * conditions that cannot be enforced, and folding under pressure in the room.
 *
 * Requests are budgeted on purpose. Unlimited requests turn the evidence phase
 * into "click everything", which is exactly the behaviour a real board has no
 * patience for and which teaches nothing about prioritisation.
 */

type Phase = "brief" | "evidence" | "decision" | "conditions" | "challenge" | "result";

const MAX_EVIDENCE_SCORE = 6;
const MAX_CONDITION_SCORE = 5;

export function GoNoGoBoard({ board }: { board: GoNoGoCase }) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [requested, setRequested] = useState<string[]>([]);
  const [decision, setDecision] = useState<string | undefined>();
  const [conditions, setConditions] = useState<string[]>([]);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, string>>({});
  const [challengeIndex, setChallengeIndex] = useState(0);

  const criticalIds = useMemo(
    () => board.evidence.filter((e) => e.critical).map((e) => e.id),
    [board],
  );

  const scoring = useMemo(() => {
    // Evidence: credit for each critical gap surfaced, penalty for burning a
    // request on something already in the pack.
    const foundCritical = requested.filter((id) => criticalIds.includes(id)).length;
    const wasted = requested.filter(
      (id) => board.evidence.find((e) => e.id === id)?.status === "provided",
    ).length;
    const evidenceRaw = foundCritical * 2 - wasted;
    const evidence = Math.max(0, Math.min(MAX_EVIDENCE_SCORE, evidenceRaw));

    const chosen = board.decisions.find((d) => d.id === decision);
    const decisionScore = chosen?.scoreDelta ?? 0;

    // Conditions are only scored when the learner actually attached some.
    const conditionScore = conditions.length
      ? Math.max(
          0,
          Math.min(
            MAX_CONDITION_SCORE,
            conditions.filter((id) => board.conditions.find((c) => c.id === id)?.correct).length -
              conditions.filter((id) => !board.conditions.find((c) => c.id === id)?.correct).length,
          ),
        )
      : 0;

    const challengeScore = board.challenges.reduce((n, ch) => {
      const picked = ch.options.find((o) => o.id === challengeAnswers[ch.id]);
      return n + Math.max(0, picked?.scoreDelta ?? 0);
    }, 0);
    const challengeMax = board.challenges.reduce(
      (n, ch) => n + Math.max(...ch.options.map((o) => o.scoreDelta)),
      0,
    );

    const decisionMax = Math.max(...board.decisions.map((d) => d.scoreDelta));
    const total = evidence + Math.max(0, decisionScore) + conditionScore + challengeScore;
    const max = MAX_EVIDENCE_SCORE + decisionMax + MAX_CONDITION_SCORE + challengeMax;

    return {
      evidence,
      evidenceMax: MAX_EVIDENCE_SCORE,
      foundCritical,
      wasted,
      decisionScore,
      decisionMax,
      conditionScore,
      conditionMax: MAX_CONDITION_SCORE,
      challengeScore,
      challengeMax,
      total,
      max,
      pct: max > 0 ? Math.round((total / max) * 100) : 0,
    };
  }, [board, requested, decision, conditions, challengeAnswers, criticalIds]);

  const chosenDecision = board.decisions.find((d) => d.id === decision);
  // A conditional approval is the only path where conditions are meaningful.
  const wantsConditions = chosenDecision?.id === "conditions" || conditions.length > 0;

  const reset = () => {
    setPhase("brief");
    setRequested([]);
    setDecision(undefined);
    setConditions([]);
    setChallengeAnswers({});
    setChallengeIndex(0);
  };

  const finish = () => {
    // Recorded like any other assessment so the competency heatmap moves.
    progress.recordQuiz(
      `go-no-go:${board.id}`,
      scoring.total,
      scoring.max,
      board.domain,
      board.competencyIds,
    );
    setPhase("result");
  };

  return (
    <div className="space-y-6">
      <PhaseRail phase={phase} />

      {phase === "brief" ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Submission</CardTitle>
                <CardDescription>{board.summary}</CardDescription>
              </div>
              <Badge variant="outline">{board.tier}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {board.brief.map((b) => (
                <li key={b} className="flex gap-2">
                  <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => setPhase("evidence")}>Review the evidence pack</Button>
          </CardContent>
        </Card>
      ) : null}

      {phase === "evidence" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidence pack</CardTitle>
            <CardDescription>
              You may request {board.requestBudget} items before the board decides. You cannot see
              what a document contains until you request it — choose based on what this decision
              actually turns on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Requests used: {requested.length} / {board.requestBudget}
            </div>
            {board.evidence.map((e) => {
              const isOpen = requested.includes(e.id);
              const budgetLeft = requested.length < board.requestBudget;
              return (
                <div
                  key={e.id}
                  className={`rounded-md border p-3 text-sm ${isOpen ? "bg-muted/40" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{e.label}</span>
                    {isOpen ? (
                      <Badge
                        variant={e.status === "provided" ? "secondary" : "destructive"}
                        className="capitalize"
                      >
                        {e.status}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!budgetLeft}
                        onClick={() => setRequested((r) => [...r, e.id])}
                      >
                        Request
                      </Button>
                    )}
                  </div>
                  {isOpen ? (
                    <p className="mt-2 leading-relaxed text-muted-foreground">{e.detail}</p>
                  ) : null}
                </div>
              );
            })}
            <Button onClick={() => setPhase("decision")}>
              {requested.length === 0 ? "Decide without requesting anything" : "Take the decision"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {phase === "decision" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4" /> The call
            </CardTitle>
            <CardDescription>{board.decisionPrompt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {board.decisions.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDecision(d.id);
                  setPhase(d.id === "conditions" ? "conditions" : "challenge");
                }}
                className="block w-full rounded-md border px-3 py-3 text-left text-sm transition-colors hover:border-brand/60 hover:bg-muted/50"
              >
                {d.label}
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {phase === "conditions" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attach your conditions</CardTitle>
            <CardDescription>
              Only conditions that can be enforced and verified count. Padding the list with good
              practice dilutes the ones that carry the risk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {board.conditions.map((c) => {
              const on = conditions.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setConditions((prev) =>
                      prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                    )
                  }
                  className={`flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                    on ? "border-brand/60 bg-brand/10" : "hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                      on ? "border-brand bg-brand text-white" : ""
                    }`}
                  >
                    {on ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span>{c.label}</span>
                </button>
              );
            })}
            <Button className="mt-2" onClick={() => setPhase("challenge")}>
              Put it to the board ({conditions.length} condition
              {conditions.length === 1 ? "" : "s"})
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {phase === "challenge" ? (
        <ChallengePhase
          board={board}
          index={challengeIndex}
          answers={challengeAnswers}
          onAnswer={(chId, optId) => {
            setChallengeAnswers((a) => ({ ...a, [chId]: optId }));
          }}
          onNext={() => {
            if (challengeIndex + 1 < board.challenges.length) setChallengeIndex((i) => i + 1);
            else finish();
          }}
        />
      ) : null}

      {phase === "result" ? (
        <ResultPanel
          board={board}
          scoring={scoring}
          requested={requested}
          decision={chosenDecision}
          conditions={conditions}
          challengeAnswers={challengeAnswers}
          wantsConditions={wantsConditions}
          onReset={reset}
        />
      ) : null}
    </div>
  );
}

function PhaseRail({ phase }: { phase: Phase }) {
  const order: { id: Phase; label: string }[] = [
    { id: "brief", label: "Brief" },
    { id: "evidence", label: "Evidence" },
    { id: "decision", label: "Decision" },
    { id: "conditions", label: "Conditions" },
    { id: "challenge", label: "Challenge" },
    { id: "result", label: "Debrief" },
  ];
  const activeIdx = order.findIndex((o) => o.id === phase);
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {order.map((o, i) => (
        <span
          key={o.id}
          className={`rounded-full px-2.5 py-1 ${
            i === activeIdx
              ? "bg-brand text-white"
              : i < activeIdx
                ? "bg-muted text-muted-foreground"
                : "border text-muted-foreground/60"
          }`}
        >
          {o.label}
        </span>
      ))}
    </div>
  );
}

function ChallengePhase({
  board,
  index,
  answers,
  onAnswer,
  onNext,
}: {
  board: GoNoGoCase;
  index: number;
  answers: Record<string, string>;
  onAnswer: (challengeId: string, optionId: string) => void;
  onNext: () => void;
}) {
  const ch = board.challenges[index];
  const picked = answers[ch.id];
  const pickedOption = ch.options.find((o) => o.id === picked);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Challenge {index + 1} of {board.challenges.length}
        </CardTitle>
        <CardDescription>
          {ch.from} — {ch.role}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <blockquote className="border-l-2 border-brand/50 pl-4 text-sm italic leading-relaxed">
          “{ch.text}”
        </blockquote>
        <div className="space-y-2">
          {ch.options.map((o) => {
            const isPicked = picked === o.id;
            return (
              <button
                key={o.id}
                type="button"
                disabled={!!picked}
                onClick={() => onAnswer(ch.id, o.id)}
                className={`block w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                  isPicked
                    ? o.correct
                      ? "border-emerald-500/60 bg-emerald-500/5"
                      : "border-amber-500/60 bg-amber-500/5"
                    : picked
                      ? "opacity-50"
                      : "hover:border-brand/60 hover:bg-muted/50"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {pickedOption ? (
          <>
            <p className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
              {pickedOption.explain}
            </p>
            <Button onClick={onNext}>
              {index + 1 < board.challenges.length ? "Next challenge" : "See the debrief"}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ResultPanel({
  board,
  scoring,
  requested,
  decision,
  conditions,
  challengeAnswers,
  wantsConditions,
  onReset,
}: {
  board: GoNoGoCase;
  scoring: {
    evidence: number;
    evidenceMax: number;
    foundCritical: number;
    wasted: number;
    decisionScore: number;
    decisionMax: number;
    conditionScore: number;
    conditionMax: number;
    challengeScore: number;
    challengeMax: number;
    total: number;
    max: number;
    pct: number;
  };
  requested: string[];
  decision?: { id: string; label: string; why: string; correct?: boolean };
  conditions: string[];
  challengeAnswers: Record<string, string>;
  wantsConditions: boolean;
  onReset: () => void;
}) {
  const missedCritical = board.evidence.filter((e) => e.critical && !requested.includes(e.id));
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Board outcome</CardTitle>
            <Badge variant={scoring.pct >= 70 ? "default" : "secondary"}>
              {scoring.total} / {scoring.max} ({scoring.pct}%)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={scoring.pct} />
          <div className="grid gap-3 sm:grid-cols-4">
            <Dim
              label="Evidence"
              value={scoring.evidence}
              max={scoring.evidenceMax}
              note={`${scoring.foundCritical} critical gap${scoring.foundCritical === 1 ? "" : "s"} found${scoring.wasted ? `, ${scoring.wasted} request${scoring.wasted === 1 ? "" : "s"} wasted` : ""}`}
            />
            <Dim
              label="Decision"
              value={Math.max(0, scoring.decisionScore)}
              max={scoring.decisionMax}
              note={decision?.correct ? "defensible" : "questionable"}
            />
            <Dim
              label="Conditions"
              value={scoring.conditionScore}
              max={scoring.conditionMax}
              note={wantsConditions ? `${conditions.length} attached` : "not applicable"}
            />
            <Dim
              label="Challenge"
              value={scoring.challengeScore}
              max={scoring.challengeMax}
              note="held under pressure"
            />
          </div>
        </CardContent>
      </Card>

      {decision ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {decision.correct ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              Your call: {decision.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{decision.why}</p>
          </CardContent>
        </Card>
      ) : null}

      {missedCritical.length ? (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="h-4 w-4 text-amber-600" /> Evidence you decided without
            </CardTitle>
            <CardDescription>
              These were missing from the pack and you did not ask for them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {missedCritical.map((e) => (
              <div key={e.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{e.label}</div>
                <p className="mt-1 leading-relaxed text-muted-foreground">{e.detail}</p>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Why it mattered: </span>
                  {e.significance}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {wantsConditions ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conditions review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {board.conditions.map((c) => {
              const attached = conditions.includes(c.id);
              if (!attached && !c.correct) return null;
              return (
                <div key={c.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                  {attached && c.correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : attached && !c.correct ? (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">
                      {c.label}
                      {!attached ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (not attached)
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{c.why}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debrief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {board.debrief.map((d) => (
            <div key={d.section}>
              <div className="text-sm font-semibold">{d.section}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
            </div>
          ))}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold">How the room went</div>
            <div className="mt-2 space-y-2">
              {board.challenges.map((ch) => {
                const picked = ch.options.find((o) => o.id === challengeAnswers[ch.id]);
                return (
                  <div key={ch.id} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{ch.from}: </span>
                    {picked ? picked.label : "no answer"}
                    {picked?.correct ? (
                      <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-emerald-600" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <Button variant="outline" onClick={onReset} className="gap-1">
            <RotateCcw className="h-4 w-4" /> Run this case again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Dim({
  label,
  value,
  max,
  note,
}: {
  label: string;
  value: number;
  max: number;
  note: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">
        {value}
        <span className="text-sm font-normal text-muted-foreground">/{max}</span>
      </div>
      <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{note}</div>
    </div>
  );
}
