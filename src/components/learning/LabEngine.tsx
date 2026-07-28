import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  ShieldAlert,
  Terminal,
  XCircle,
  ArrowRight,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CfgMap, CfgValue, LabBlueprint, LabInjection } from "@/content/labEngine";
import { progress as progressStore } from "@/lib/progress";

type LogEntry = {
  ts: number;
  text: string;
  kind?: "info" | "warn" | "error" | "attack" | "policy";
};

function kindTone(k: LabInjection["kind"]) {
  switch (k) {
    case "attack":
      return {
        icon: ShieldAlert,
        cls: "border-rose-500/60 bg-rose-500/5 text-rose-700 dark:text-rose-300",
      };
    case "failure":
      return {
        icon: Bug,
        cls: "border-amber-500/60 bg-amber-500/5 text-amber-700 dark:text-amber-300",
      };
    case "drift":
      return {
        icon: AlertTriangle,
        cls: "border-orange-500/60 bg-orange-500/5 text-orange-700 dark:text-orange-300",
      };
    case "policy":
    default:
      return {
        icon: AlertTriangle,
        cls: "border-sky-500/60 bg-sky-500/5 text-sky-700 dark:text-sky-300",
      };
  }
}

function ConfigPanel({
  blueprint,
  cfg,
  setCfg,
  locked,
}: {
  blueprint: LabBlueprint;
  cfg: CfgMap;
  setCfg: (v: CfgMap) => void;
  locked: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuration panel</CardTitle>
        <CardDescription>
          These choices are scored against the rubric during and after the run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {blueprint.config.map((f) => {
          const v = cfg[f.id];
          return (
            <div key={f.id} className="space-y-1.5">
              <Label className="text-sm font-medium">{f.label}</Label>
              {f.help ? <p className="text-xs text-muted-foreground">{f.help}</p> : null}
              {f.type === "select" ? (
                <Select
                  value={String(v)}
                  onValueChange={(nv) => setCfg({ ...cfg, [f.id]: nv })}
                  disabled={locked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "toggle" ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(v)}
                    onCheckedChange={(nv) => setCfg({ ...cfg, [f.id]: nv })}
                    disabled={locked}
                  />
                  <span className="text-sm text-muted-foreground">
                    {v ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ) : (
                <Input
                  type="number"
                  value={Number(v)}
                  onChange={(e) => setCfg({ ...cfg, [f.id]: Number(e.target.value) })}
                  disabled={locked}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function LogStream({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [logs.length]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Terminal className="h-4 w-4" />
        <CardTitle className="text-base">Simulated system log</CardTitle>
        <Badge variant="outline" className="ml-auto text-xs">
          {logs.length} lines
        </Badge>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="h-72 overflow-auto rounded-md border bg-zinc-950 text-zinc-100 p-3 font-mono text-xs leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="text-zinc-500">Waiting to start…</div>
          ) : (
            logs.map((l, i) => {
              const color =
                l.kind === "attack"
                  ? "text-rose-300"
                  : l.kind === "warn"
                    ? "text-amber-300"
                    : l.kind === "error"
                      ? "text-rose-400"
                      : l.kind === "policy"
                        ? "text-sky-300"
                        : "text-zinc-100";
              return (
                <div key={i} className={color}>
                  <span className="text-zinc-500">
                    {new Date(l.ts).toLocaleTimeString([], { hour12: false })}{" "}
                  </span>
                  {l.text}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InjectionCard({
  injection,
  choiceId,
  onChoose,
  locked,
}: {
  injection: LabInjection;
  choiceId?: string;
  onChoose: (id: string) => void;
  locked: boolean;
}) {
  const tone = kindTone(injection.kind);
  const Icon = tone.icon;
  const chosen = injection.choices.find((c) => c.id === choiceId);
  return (
    <Card className={`border ${tone.cls}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <Badge variant="outline" className="capitalize">
            {injection.kind}
          </Badge>
          <CardTitle className="text-base">{injection.title}</CardTitle>
        </div>
        <CardDescription className="pt-1 text-foreground/80">{injection.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <RadioGroup value={choiceId ?? ""} onValueChange={onChoose} disabled={locked}>
          {injection.choices.map((c) => {
            const revealed = !!choiceId;
            const isChosen = choiceId === c.id;
            const good = revealed && c.correct;
            const bad = revealed && isChosen && !c.correct;
            return (
              <div
                key={c.id}
                className={`rounded-md border p-3 text-sm ${
                  good ? "border-emerald-500/60 bg-emerald-500/5" : ""
                } ${bad ? "border-rose-500/60 bg-rose-500/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem
                    id={`${injection.id}-${c.id}`}
                    value={c.id}
                    disabled={locked || !!choiceId}
                  />
                  <Label
                    htmlFor={`${injection.id}-${c.id}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {c.label}
                  </Label>
                  {revealed && isChosen ? (
                    <Badge variant="outline" className="text-xs">
                      {c.scoreDelta >= 0 ? `+${c.scoreDelta}` : c.scoreDelta}
                    </Badge>
                  ) : null}
                </div>
                {revealed && isChosen ? (
                  <p className="pl-6 pt-2 text-xs text-muted-foreground">{c.explain}</p>
                ) : null}
              </div>
            );
          })}
        </RadioGroup>
        {chosen ? (
          <p className="text-xs text-muted-foreground pt-1">
            {chosen.correct ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Correct containment.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-600">
                <XCircle className="h-3.5 w-3.5" /> Suboptimal — review the debrief.
              </span>
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function initialCfg(blueprint: LabBlueprint): CfgMap {
  const m: CfgMap = {};
  for (const f of blueprint.config) m[f.id] = f.default;
  return m;
}

export function LabEngineRunner({ blueprint }: { blueprint: LabBlueprint }) {
  const [cfg, setCfg] = useState<CfgMap>(() => initialCfg(blueprint));
  const [stepIdx, setStepIdx] = useState(-1); // -1 = not started
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [artifactSaved, setArtifactSaved] = useState(false);

  const running = stepIdx >= 0 && !finished;
  const locked = finished;

  const started = stepIdx >= 0;

  function appendLogs(lines: string[], kind: LogEntry["kind"] = "info") {
    const now = Date.now();
    setLogs((prev) => [...prev, ...lines.map((text, i) => ({ ts: now + i, text, kind }))]);
  }

  function start() {
    setStepIdx(0);
    setLogs([{ ts: Date.now(), text: `[lab] start blueprint=${blueprint.id}`, kind: "policy" }]);
    appendLogs(blueprint.steps[0].logs);
  }

  function reset() {
    setCfg(initialCfg(blueprint));
    setStepIdx(-1);
    setLogs([]);
    setChoices({});
    setFinished(false);
    setArtifactSaved(false);
  }

  // `atStep` is authored 1-based — "fires during step 3" — while `stepIdx` is a
  // 0-based array index. Comparing them directly meant no injection authored at
  // the final step ever fired: connector-oauth had one injection and showed
  // none, and every other blueprint silently dropped its second incident.
  const dueInjections = useMemo(
    () => blueprint.injections.filter((inj) => inj.atStep === stepIdx + 1),
    [blueprint.injections, stepIdx],
  );
  const allDueAnswered = dueInjections.every((inj) => choices[inj.id]);

  function chooseFor(inj: LabInjection, choiceId: string) {
    if (choices[inj.id]) return;
    setChoices((prev) => ({ ...prev, [inj.id]: choiceId }));
    const c = inj.choices.find((x) => x.id === choiceId);
    appendLogs([`[incident] ${inj.title} — response: ${c?.label ?? choiceId}`], "warn");
    if (c?.followupLogs) appendLogs(c.followupLogs, c.correct ? "policy" : "warn");
  }

  // When entering a new step, emit its baseline logs + any injection logs.
  useEffect(() => {
    if (!started || finished) return;
    // stepIdx 0 already logged in start(); handle subsequent transitions below.
  }, [started, finished]);

  function advance() {
    // Fire injection logs for current step if we haven't yet
    const nextIdx = stepIdx + 1;
    if (nextIdx >= blueprint.steps.length) {
      // finish
      // final rubric evaluation happens in computed values
      appendLogs(["[lab] run complete"], "policy");
      setFinished(true);
      return;
    }
    const step = blueprint.steps[nextIdx];
    appendLogs(step.logs);
    setStepIdx(nextIdx);
  }

  // Whenever we enter a step, if it has injections, stream their trigger logs once.
  const injectionLoggedRef = useRef<Record<number, boolean>>({});
  useEffect(() => {
    if (stepIdx < 0) return;
    if (injectionLoggedRef.current[stepIdx]) return;
    const injs = blueprint.injections.filter((i) => i.atStep === stepIdx);
    if (injs.length) {
      for (const inj of injs) {
        appendLogs(
          [`[incident] ${inj.title}`, ...inj.logs],
          inj.kind === "attack" ? "attack" : "warn",
        );
      }
    }
    injectionLoggedRef.current[stepIdx] = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // Scoring
  const rubricResults = useMemo(
    () =>
      blueprint.rubric.map((r) => ({
        ...r,
        passed: r.check(cfg),
      })),
    [blueprint.rubric, cfg],
  );
  const rubricScore = rubricResults.reduce((n, r) => n + (r.passed ? r.weight : 0), 0);
  const rubricMax = blueprint.rubric.reduce((n, r) => n + r.weight, 0);

  const injectionScore = blueprint.injections.reduce((n, inj) => {
    const cid = choices[inj.id];
    if (!cid) return n;
    const c = inj.choices.find((x) => x.id === cid);
    return n + (c?.scoreDelta ?? 0);
  }, 0);
  const injectionMax = blueprint.injections.reduce(
    (n, inj) => n + Math.max(...inj.choices.map((c) => c.scoreDelta), 0),
    0,
  );

  const totalScore = rubricScore + injectionScore;
  const totalMax = rubricMax + injectionMax;

  const passedRubric = rubricResults.filter((r) => r.passed).map((r) => r.label);
  const failedRubric = rubricResults
    .filter((r) => !r.passed)
    .map((r) => `${r.label} — ${r.remedy}`);

  const [artifactText, setArtifactText] = useState<string>("");
  useEffect(() => {
    if (finished) {
      setArtifactText(
        blueprint.artifact.build({
          cfg,
          choices,
          score: totalScore,
          max: totalMax,
          passedRubric,
          failedRubric,
        }),
      );
      // record evidence
      const ratio = totalMax > 0 ? totalScore / totalMax : 0;
      const kind =
        ratio >= 0.8 ? "scenario_ideal" : ratio >= 0.5 ? "scenario_partial" : "scenario_failed";
      progressStore.recordEvidence(blueprint.competencyIds, kind, `lab:${blueprint.id}`, ratio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  function saveArtifact() {
    progressStore.saveArtifact(`lab:${blueprint.id}`, blueprint.artifact.name, {
      body: artifactText,
      score: String(totalScore),
      max: String(totalMax),
    });
    setArtifactSaved(true);
    toast.success("Artifact saved to /artifacts");
  }

  function downloadArtifact() {
    const blob = new Blob([artifactText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blueprint.id}-artifact.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentStep = stepIdx >= 0 ? blueprint.steps[stepIdx] : null;
  const canAdvance = !finished && (dueInjections.length === 0 || allDueAnswered);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6 min-w-0">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{blueprint.name}</CardTitle>
                <CardDescription className="pt-1">{blueprint.tagline}</CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">
                {blueprint.domain.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{blueprint.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!started ? (
                <Button onClick={start} className="gap-2">
                  <Play className="h-4 w-4" /> Start lab
                </Button>
              ) : (
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              )}
              {started && !finished ? (
                <Button
                  onClick={advance}
                  disabled={!canAdvance}
                  className="gap-2"
                  variant={canAdvance ? "default" : "secondary"}
                >
                  {stepIdx + 1 >= blueprint.steps.length ? "Finish run" : "Advance"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
              {started ? (
                <Badge variant="secondary">
                  Step {Math.min(stepIdx + 1, blueprint.steps.length)} / {blueprint.steps.length}
                </Badge>
              ) : null}
              {started ? (
                <Badge>
                  Score {totalScore} / {totalMax}
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {currentStep ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.narrative}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <LogStream logs={logs} />

        {dueInjections.length ? (
          <div className="space-y-4">
            {dueInjections.map((inj) => (
              <InjectionCard
                key={inj.id}
                injection={inj}
                choiceId={choices[inj.id]}
                onChoose={(cid) => chooseFor(inj, cid)}
                locked={locked}
              />
            ))}
            {!allDueAnswered ? (
              <p className="text-xs text-muted-foreground">
                Resolve the incident above before you can advance.
              </p>
            ) : null}
          </div>
        ) : null}

        {finished ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scoring rubric</CardTitle>
                <CardDescription>
                  Configuration score: {rubricScore} / {rubricMax} · Incident score:{" "}
                  {injectionScore} / {injectionMax}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {rubricResults.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                    {r.passed ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 mt-0.5 text-rose-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {r.weight} pt{r.weight === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      {!r.passed ? (
                        <p className="text-xs text-muted-foreground pt-1">{r.remedy}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Debrief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {blueprint.debrief.map((d) => (
                  <div key={d.section}>
                    <div className="font-semibold">{d.section}</div>
                    <p className="text-muted-foreground leading-relaxed">{d.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Artifact output</CardTitle>
                    <CardDescription>
                      Generated from your run. Edit before saving or downloading.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadArtifact}
                      className="gap-1"
                    >
                      <FileDown className="h-4 w-4" /> Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveArtifact}
                      disabled={artifactSaved}
                      className="gap-1"
                    >
                      <Save className="h-4 w-4" /> {artifactSaved ? "Saved" : "Save to /artifacts"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={artifactText}
                  onChange={(e) => setArtifactText(e.target.value)}
                  className="min-h-72 font-mono text-xs"
                />
                <p className="pt-2 text-[11px] text-muted-foreground">
                  Practice artifact only. Do not use for real approvals, real risk acceptance, or
                  production evidence.
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="space-y-6">
        <ConfigPanel blueprint={blueprint} cfg={cfg} setCfg={setCfg} locked={locked} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live rubric preview</CardTitle>
            <CardDescription>
              Config score: {rubricScore} / {rubricMax}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rubricResults.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                {r.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={r.passed ? "" : "text-muted-foreground"}>{r.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground px-1">
          Simulator only. No real client data, no real approvals. See{" "}
          <Link to="/app/artifacts" className="underline">
            /artifacts
          </Link>{" "}
          for saved practice outputs.
        </p>
      </div>
    </div>
  );
}

// Silence unused imports lint if any environment complains
void ({} as CfgValue);
