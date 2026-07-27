import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useCloudRun } from "@/lib/useCloudRun";
import {
  applyInjection,
  generateSarQuestions,
  gradeDiagnosis,
  gradeSarAnswer,
  indirectPromptInjection,
  initialState,
  recompute,
  runEvaluation,
  runSelfTests,
  COMPETENCIES_TOUCHED,
  type DiagnosisAnswer,
  type ScenarioState,
  type LogEntry,
} from "@/engines/ragTicketAgent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { progress } from "@/lib/progress";

export const Route = createFileRoute("/app/scenarios/rag-ticket-agent")({
  head: () => ({
    meta: [
      { title: "RAG + Ticket Agent Scenario — AI Career Simulator" },
      {
        name: "description",
        content:
          "End-to-end simulation: design, configure, attack, diagnose, remediate, defend an enterprise RAG + agent system.",
      },
    ],
  }),
  component: ScenarioPage,
});

const LS_KEY = "eaicls:v1:scenario:rag-ticket-agent";

type Action =
  | { type: "SET"; state: ScenarioState }
  | { type: "PATCH"; patch: Partial<ScenarioState> }
  | { type: "STAGE"; stage: number }
  | { type: "LOG"; entry: LogEntry }
  | { type: "RESET" };

function reducer(s: ScenarioState, a: Action): ScenarioState {
  switch (a.type) {
    case "SET":
      return a.state;
    case "PATCH":
      return { ...s, ...a.patch };
    case "STAGE":
      return { ...s, stage: a.stage };
    case "LOG":
      return { ...s, logs: [...s.logs, a.entry] };
    case "RESET":
      return initialState();
  }
}

function loadState(): ScenarioState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    /* */
  }
  return initialState();
}

const STAGE_TITLES = [
  "Architecture Canvas",
  "SSO / RBAC",
  "Data Classification",
  "RAG Config",
  "Permission Trimming",
  "Agent Identity & Tools",
  "Network Controls",
  "Logging & Monitoring",
  "Baseline Evaluation",
  "Attack Injected",
  "Diagnosis",
  "Containment",
  "Remediation",
  "Re-evaluation",
  "Artifact",
  "SAR Defence",
];

function ScenarioPage() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const derived = useMemo(() => recompute(state), [state]);
  const cloud = useCloudRun("rag-ticket-agent", "v1");
  const prevRef = useRef<ScenarioState | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Persist stage transitions to the cloud audit trail.
  useEffect(() => {
    if (!cloud.runId) return;
    const stageLabel = STAGE_TITLES[state.stage - 1] ?? String(state.stage);
    cloud.updateStage(stageLabel);
    cloud.log({
      kind: "stage_enter",
      stage: stageLabel,
      payload: {
        stage: state.stage,
        securityPosture: derived.securityPosture,
        privacyExposure: derived.privacyExposure,
        retrievalQuality: derived.retrievalQuality,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stage, cloud.runId]);

  // Diff-based event emission so every meaningful state mutation lands in the
  // append-only audit log without touching each stage component.
  useEffect(() => {
    if (!cloud.runId) {
      prevRef.current = state;
      return;
    }
    const prev = prevRef.current;
    prevRef.current = state;
    if (!prev) return;
    const stageLabel = STAGE_TITLES[state.stage - 1] ?? String(state.stage);
    const emit = (
      kind: Parameters<typeof cloud.log>[0]["kind"],
      severity: "info" | "warn" | "error" | "critical",
      payload: Record<string, unknown>,
    ) => cloud.log({ kind, stage: stageLabel, severity, payload });

    // Injection fired
    if (!prev.injectionFired && state.injectionFired) {
      emit("injection_fired", "critical", {
        injection: indirectPromptInjection.id ?? "indirect_prompt_injection",
      });
    }
    // Architecture / canvas
    if (prev.nodes !== state.nodes || prev.edges !== state.edges) {
      emit("architecture_change", "info", { nodes: state.nodes.length, edges: state.edges.length });
    }
    // Config domains
    const configDiff: Record<string, unknown> = {};
    if (prev.identity !== state.identity) configDiff.identity = state.identity;
    if (prev.rag !== state.rag) configDiff.rag = state.rag;
    if (prev.agent !== state.agent) configDiff.agent = state.agent;
    if (prev.network !== state.network) configDiff.network = state.network;
    if (prev.ops !== state.ops) configDiff.ops = state.ops;
    if (prev.dataSources !== state.dataSources) configDiff.dataSources = state.dataSources;
    if (Object.keys(configDiff).length > 0) {
      emit("config_change", "info", {
        changed: Object.keys(configDiff),
        posture: derived.securityPosture,
        privacy: derived.privacyExposure,
      });
    }
    // Diagnosis
    if (prev.diagnosis !== state.diagnosis && state.diagnosis) {
      emit("diagnosis", "info", state.diagnosis as unknown as Record<string, unknown>);
    }
    // Containment
    if (prev.containmentApplied !== state.containmentApplied) {
      const added = state.containmentApplied.filter((c) => !prev.containmentApplied.includes(c));
      if (added.length) emit("containment", "warn", { added, all: state.containmentApplied });
    }
    // Remediation: detect when the injection first becomes resolved
    const prevResolved = indirectPromptInjection.isResolvedBy(prev);
    const nowResolved = indirectPromptInjection.isResolvedBy(state);
    if (!prevResolved && nowResolved) {
      emit("remediation", "info", {
        resolved: true,
        note: "indirect_prompt_injection resolved by current config",
      });
    }
    // Evaluation runs
    if (prev.evalHistory.length !== state.evalHistory.length) {
      const last = state.evalHistory[state.evalHistory.length - 1];
      emit(
        "evaluation",
        last && (last.aclLeaks > 0 || last.unsafeOutputs > 0) ? "error" : "info",
        last as unknown as Record<string, unknown>,
      );
    }
    // Artifact edits
    if (prev.artifact !== state.artifact && state.artifact) {
      emit("artifact", "info", {
        threatModelChars: state.artifact.threatModel.length,
        reviewSummaryChars: state.artifact.reviewSummary.length,
        residualRiskChars: state.artifact.residualRisk.length,
      });
    }
    // SAR answers
    if (prev.sarAnswers !== state.sarAnswers && state.sarAnswers) {
      emit("sar_answer", "info", { answered: Object.keys(state.sarAnswers).length });
    }
    // Command entries via LOG action (source=api)
    if (prev.logs.length < state.logs.length) {
      const added = state.logs.slice(prev.logs.length);
      for (const entry of added) {
        if (entry.source === "api") emit("command", "info", { message: entry.message });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cloud.runId]);

  const canAdvance = stageGate(state, derived);
  const stage = state.stage;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <header className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Enterprise RAG + Ticket Agent</h1>
            <p className="text-sm text-muted-foreground">
              Vertical slice — every decision mutates real state and is re-evaluated. No hidden
              answers.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">Practice only — not for real approvals</Badge>
            {cloud.signedIn ? (
              <Badge variant="outline">Cloud audit: on</Badge>
            ) : (
              <Badge variant="outline">Local only — sign in to persist</Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: "RESET" })}>
              Reset scenario
            </Button>
          </div>
        </div>
        <StageBar stage={stage} onJump={(n) => dispatch({ type: "STAGE", stage: n })} />
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Stage {stage}: {STAGE_TITLES[stage - 1]}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={stage <= 1}
                  onClick={() => dispatch({ type: "STAGE", stage: stage - 1 })}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={stage >= 16 || !canAdvance.ok}
                  onClick={() => dispatch({ type: "STAGE", stage: stage + 1 })}
                >
                  {stage >= 16 ? "Done" : "Advance"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <StageBody state={state} dispatch={dispatch} cloud={cloud} />
              {!canAdvance.ok && (
                <Alert className="mt-4">
                  <AlertTitle>Cannot advance yet</AlertTitle>
                  <AlertDescription>{canAdvance.reason}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <LogConsole state={state} dispatch={dispatch} />
        </div>

        <aside className="space-y-4">
          <DerivedPanel state={state} />
          <SelfTestPanel />
        </aside>
      </div>
    </div>
  );
}

function StageBar({ stage, onJump }: { stage: number; onJump: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {STAGE_TITLES.map((t, i) => {
        const n = i + 1;
        const active = n === stage;
        const done = n < stage;
        return (
          <button
            key={n}
            onClick={() => onJump(n)}
            className={`text-xs px-2 py-1 rounded border ${active ? "bg-primary text-primary-foreground border-primary" : done ? "bg-muted" : "bg-background"}`}
          >
            {n}. {t}
          </button>
        );
      })}
    </div>
  );
}

function DerivedPanel({ state }: { state: ScenarioState }) {
  const d = recompute(state);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Live system posture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Meter label="Security posture" value={d.securityPosture} />
        <Meter label="Privacy exposure (lower=better)" value={d.privacyExposure} invert />
        <Meter label="Retrieval quality" value={d.retrievalQuality} />
        <Meter label="Ops readiness" value={d.opsReadiness} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Latency ~{d.latencyMs}ms</span>
          <span>Cost ${d.costPerQuery.toFixed(4)}/q</span>
        </div>
        {d.missingControls.length > 0 && (
          <div>
            <div className="font-medium text-xs mb-1">Missing controls</div>
            <ul className="text-xs list-disc pl-4 text-destructive">
              {d.missingControls.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {d.governanceGaps.length > 0 && (
          <div>
            <div className="font-medium text-xs mb-1">Governance gaps</div>
            <ul className="text-xs list-disc pl-4">
              {d.governanceGaps.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {d.architectureFlags.length > 0 && (
          <div>
            <div className="font-medium text-xs mb-1">Architecture flags</div>
            <ul className="text-xs list-disc pl-4">
              {d.architectureFlags.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Meter({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value < 40 : value > 60;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className={good ? "text-green-600" : "text-orange-500"}>{value}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function SelfTestPanel() {
  const [results, setResults] = useState(() => runSelfTests());
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Engine invariants</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setResults(runSelfTests())}>
          Re-run
        </Button>
      </CardHeader>
      <CardContent className="space-y-1 text-xs">
        {results.map((r) => (
          <div key={r.name} className="flex items-start gap-2">
            <span className={r.ok ? "text-green-600" : "text-destructive"}>{r.ok ? "✔" : "✘"}</span>
            <span>
              {r.name}
              {r.detail ? ` — ${r.detail}` : ""}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- Stage router ----------

type CloudHandle = ReturnType<typeof useCloudRun>;

function StageBody({
  state,
  dispatch,
  cloud,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
  cloud: CloudHandle;
}) {
  switch (state.stage) {
    case 1:
      return <StageCanvas state={state} dispatch={dispatch} />;
    case 2:
      return <StageIdentity state={state} dispatch={dispatch} />;
    case 3:
      return <StageDataClass state={state} dispatch={dispatch} />;
    case 4:
      return <StageRag state={state} dispatch={dispatch} />;
    case 5:
      return <StagePermTrim state={state} dispatch={dispatch} />;
    case 6:
      return <StageAgent state={state} dispatch={dispatch} />;
    case 7:
      return <StageNetwork state={state} dispatch={dispatch} />;
    case 8:
      return <StageOps state={state} dispatch={dispatch} />;
    case 9:
      return <StageEval state={state} dispatch={dispatch} label="Baseline" />;
    case 10:
      return <StageInjection state={state} dispatch={dispatch} />;
    case 11:
      return <StageDiagnosis state={state} dispatch={dispatch} />;
    case 12:
      return <StageContainment state={state} dispatch={dispatch} />;
    case 13:
      return <StageRemediation state={state} dispatch={dispatch} />;
    case 14:
      return <StageEval state={state} dispatch={dispatch} label="Post-remediation" />;
    case 15:
      return <StageArtifact state={state} dispatch={dispatch} />;
    case 16:
      return <StageSar state={state} dispatch={dispatch} cloud={cloud} />;
    default:
      return null;
  }
}

function stageGate(
  s: ScenarioState,
  d: ReturnType<typeof recompute>,
): { ok: boolean; reason?: string } {
  switch (s.stage) {
    case 1: {
      const needed = ["idp", "monitoring", "approval"];
      const missing = needed.filter((k) => !s.nodes.some((n) => n.kind === k));
      if (missing.length)
        return {
          ok: false,
          reason: `Canvas is missing: ${missing.join(", ")}. Add nodes before advancing.`,
        };
      return { ok: true };
    }
    case 2:
      return s.identity.sso !== "none" && s.identity.mfa !== "off"
        ? { ok: true }
        : { ok: false, reason: "Configure SSO and MFA to advance." };
    case 3:
      return s.dataSources.every((ds) => ds.classification)
        ? { ok: true }
        : { ok: false, reason: "Classify all data sources." };
    case 5:
      return s.rag.permissionFilter !== "none"
        ? { ok: true }
        : { ok: false, reason: "Choose a permission trimming strategy." };
    case 6:
      return s.agent.toolAllowlist.length > 0
        ? { ok: true }
        : { ok: false, reason: "Agent must have at least one tool." };
    case 8:
      return s.ops.logging ? { ok: true } : { ok: false, reason: "Enable logging at minimum." };
    case 9:
      return s.evalHistory.length >= 1
        ? { ok: true }
        : { ok: false, reason: "Run at least one baseline evaluation." };
    case 10:
      return s.injectionFired
        ? { ok: true }
        : { ok: false, reason: "Trigger the injection to advance." };
    case 11:
      return s.diagnosis ? { ok: true } : { ok: false, reason: "Submit your diagnosis." };
    case 12:
      return s.containmentApplied.length > 0
        ? { ok: true }
        : { ok: false, reason: "Apply at least one containment action." };
    case 13: {
      return indirectPromptInjection.isResolvedBy(s)
        ? { ok: true }
        : {
            ok: false,
            reason:
              "Current configuration still lets the injection succeed. Change controls until the injection resolves.",
          };
    }
    case 14: {
      const last = s.evalHistory[s.evalHistory.length - 1];
      return last && s.evalHistory.length >= 2 && last.unsafeOutputs === 0 && last.aclLeaks === 0
        ? { ok: true }
        : { ok: false, reason: "Re-run evaluation and reach 0 unsafe outputs / 0 ACL leaks." };
    }
    case 15:
      return s.artifact &&
        s.artifact.threatModel.length > 80 &&
        s.artifact.reviewSummary.length > 80
        ? { ok: true }
        : {
            ok: false,
            reason: "Threat model and review summary must be substantive (>80 chars each).",
          };
    default:
      return { ok: true };
  }
}

// ---------- Stage components ----------

const NODE_PALETTE = [
  "user",
  "idp",
  "frontend",
  "gateway",
  "backend",
  "orchestrator",
  "model",
  "agent",
  "tool",
  "connector",
  "datasource",
  "vectorstore",
  "secretvault",
  "monitoring",
  "siem",
  "approval",
  "firewall",
  "private_endpoint",
] as const;

function StageCanvas({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const addNode = (kind: (typeof NODE_PALETTE)[number]) => {
    const id = crypto.randomUUID().slice(0, 6);
    dispatch({
      type: "PATCH",
      patch: {
        nodes: [
          ...state.nodes,
          { id, kind, label: kind, x: 100 + Math.random() * 700, y: 60 + Math.random() * 400 },
        ],
      },
    });
  };
  const removeNode = (id: string) =>
    dispatch({
      type: "PATCH",
      patch: {
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.from !== id && e.to !== id),
      },
    });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Place components. Missing IdP, monitoring, or approval nodes will surface as architecture
        flags and block advance.
      </p>
      <div className="flex flex-wrap gap-1">
        {NODE_PALETTE.map((k) => (
          <Button key={k} size="sm" variant="outline" onClick={() => addNode(k)}>
            + {k}
          </Button>
        ))}
      </div>
      <div className="border rounded bg-muted/30 relative" style={{ height: 460 }}>
        <svg width="100%" height="460" viewBox="0 0 1000 460">
          {state.edges.map((e) => {
            const a = state.nodes.find((n) => n.id === e.from);
            const b = state.nodes.find((n) => n.id === e.to);
            if (!a || !b) return null;
            const color =
              e.kind === "identity" ? "#3b82f6" : e.kind === "control" ? "#a855f7" : "#64748b";
            return (
              <line
                key={e.id}
                x1={a.x + 40}
                y1={a.y + 20}
                x2={b.x + 40}
                y2={b.y + 20}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={e.kind === "control" ? "4 3" : undefined}
              />
            );
          })}
          {state.nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect
                width={80}
                height={40}
                rx={6}
                fill="hsl(var(--card))"
                stroke="hsl(var(--border))"
              />
              <text x={40} y={18} textAnchor="middle" fontSize={9} fill="hsl(var(--foreground))">
                {n.kind}
              </text>
              <text
                x={40}
                y={30}
                textAnchor="middle"
                fontSize={8}
                fill="hsl(var(--muted-foreground))"
              >
                {n.label.slice(0, 14)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="text-xs text-muted-foreground">
        Nodes: {state.nodes.length} · Edges: {state.edges.length}
      </div>
      <div className="flex flex-wrap gap-1">
        {state.nodes.map((n) => (
          <Badge
            key={n.id}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => removeNode(n.id)}
          >
            {n.kind} ×
          </Badge>
        ))}
      </div>
    </div>
  );
}

function StageIdentity({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const patch = (p: Partial<ScenarioState["identity"]>) =>
    dispatch({ type: "PATCH", patch: { identity: { ...state.identity, ...p } } });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="SSO">
        <Select value={state.identity.sso} onValueChange={(v) => patch({ sso: v as never })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="saml">SAML</SelectItem>
            <SelectItem value="oidc">OIDC</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="MFA">
        <Select value={state.identity.mfa} onValueChange={(v) => patch({ mfa: v as never })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Off</SelectItem>
            <SelectItem value="conditional">Conditional</SelectItem>
            <SelectItem value="required">Required</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="RBAC">
        <Select value={state.identity.rbac} onValueChange={(v) => patch({ rbac: v as never })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="least_privilege">Least privilege</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Token scope">
        <Select
          value={state.identity.tokenScope}
          onValueChange={(v) => patch({ tokenScope: v as never })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wide">Wide (tenant)</SelectItem>
            <SelectItem value="narrow">Narrow (site-scoped)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function StageDataClass({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const setDs = (id: string, patch: Partial<ScenarioState["dataSources"][number]>) =>
    dispatch({
      type: "PATCH",
      patch: { dataSources: state.dataSources.map((d) => (d.id === id ? { ...d, ...patch } : d)) },
    });
  return (
    <div className="space-y-3">
      {state.dataSources.map((d) => (
        <div
          key={d.id}
          className="border rounded p-3 flex items-center justify-between flex-wrap gap-2"
        >
          <div>
            <div className="font-medium">{d.name}</div>
            <div className="text-xs text-muted-foreground">
              ACL: {d.hasAcl ? "yes" : "no"} · quarantined: {d.quarantined ? "yes" : "no"}
            </div>
          </div>
          <Select
            value={d.classification}
            onValueChange={(v) => setDs(d.id, { classification: v as never })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="confidential">Confidential</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

function StageRag({ state, dispatch }: { state: ScenarioState; dispatch: React.Dispatch<Action> }) {
  const patch = (p: Partial<ScenarioState["rag"]>) =>
    dispatch({ type: "PATCH", patch: { rag: { ...state.rag, ...p } } });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label={`Chunk size: ${state.rag.chunkSize}`}>
        <Input
          type="number"
          value={state.rag.chunkSize}
          onChange={(e) => patch({ chunkSize: +e.target.value })}
        />
      </Field>
      <Field label={`Overlap: ${state.rag.overlap}`}>
        <Input
          type="number"
          value={state.rag.overlap}
          onChange={(e) => patch({ overlap: +e.target.value })}
        />
      </Field>
      <Field label="Embeddings">
        <Select
          value={state.rag.embeddings}
          onValueChange={(v) => patch({ embeddings: v as never })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (cheap)</SelectItem>
            <SelectItem value="large">Large</SelectItem>
            <SelectItem value="multilingual">Multilingual</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Search">
        <Select value={state.rag.search} onValueChange={(v) => patch({ search: v as never })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vector">Vector</SelectItem>
            <SelectItem value="keyword">Keyword</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Toggle label="Reranking" v={state.rag.rerank} on={(x) => patch({ rerank: x })} />
      <Toggle label="Citations" v={state.rag.citations} on={(x) => patch({ citations: x })} />
      <Toggle
        label="Deletion propagation"
        v={state.rag.deletionPropagation}
        on={(x) => patch({ deletionPropagation: x })}
      />
      <Field label={`Index refresh (hours): ${state.rag.indexRefreshHours}`}>
        <Input
          type="number"
          value={state.rag.indexRefreshHours}
          onChange={(e) => patch({ indexRefreshHours: +e.target.value })}
        />
      </Field>
    </div>
  );
}

function StagePermTrim({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const patch = (p: Partial<ScenarioState["rag"]>) =>
    dispatch({ type: "PATCH", patch: { rag: { ...state.rag, ...p } } });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Permission trimming controls whether users can retrieve content they aren't entitled to see.
        Wrong choice → ACL leaks in evaluation.
      </p>
      <Field label="Permission filter">
        <Select
          value={state.rag.permissionFilter}
          onValueChange={(v) => patch({ permissionFilter: v as never })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="post_query">Post-query filter (leaky)</SelectItem>
            <SelectItem value="ingest_time_acl">Ingest-time ACL (stale risk)</SelectItem>
            <SelectItem value="query_time_acl">Query-time ACL (recommended)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Toggle
        label="Content sanitization (strip embedded instructions)"
        v={state.rag.contentSanitization}
        on={(x) => patch({ contentSanitization: x })}
      />
      <Toggle
        label="Tool-call guard on retrieval (block tool invocations that originate from retrieved text)"
        v={state.rag.toolCallGuardOnRetrieval}
        on={(x) => patch({ toolCallGuardOnRetrieval: x })}
      />
    </div>
  );
}

function StageAgent({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const patch = (p: Partial<ScenarioState["agent"]>) =>
    dispatch({ type: "PATCH", patch: { agent: { ...state.agent, ...p } } });
  const patchId = (p: Partial<ScenarioState["identity"]>) =>
    dispatch({ type: "PATCH", patch: { identity: { ...state.identity, ...p } } });
  const toggleTool = (t: string) =>
    patch({
      toolAllowlist: state.agent.toolAllowlist.includes(t)
        ? state.agent.toolAllowlist.filter((x) => x !== t)
        : [...state.agent.toolAllowlist, t],
    });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="Agent identity">
        <Select
          value={state.identity.agentIdentity}
          onValueChange={(v) => patchId({ agentIdentity: v as never })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shared">Shared service account</SelectItem>
            <SelectItem value="app_permissions">Application permissions</SelectItem>
            <SelectItem value="delegated">Delegated (on-behalf-of user)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Human approval">
        <Select
          value={state.agent.humanApproval}
          onValueChange={(v) => patch({ humanApproval: v as never })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="writes_only">Writes only</SelectItem>
            <SelectItem value="all">All actions</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Toggle
        label="Write actions enabled"
        v={state.agent.writeActions}
        on={(x) => patch({ writeActions: x })}
      />
      <Toggle label="Kill switch" v={state.agent.killSwitch} on={(x) => patch({ killSwitch: x })} />
      <Field label={`Rate limit / min: ${state.agent.rateLimitPerMin}`}>
        <Input
          type="number"
          value={state.agent.rateLimitPerMin}
          onChange={(e) => patch({ rateLimitPerMin: +e.target.value })}
        />
      </Field>
      <Field label="Logging level">
        <Select
          value={state.agent.loggingLevel}
          onValueChange={(v) => patch({ loggingLevel: v as never })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Off</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="full_trace">Full trace</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Label className="mb-1 block">Tool allowlist</Label>
        <div className="flex flex-wrap gap-1">
          {[
            "ticket.read",
            "ticket.create",
            "ticket.update",
            "email.send",
            "file.read",
            "file.write",
            "admin.impersonate",
          ].map((t) => (
            <Badge
              key={t}
              variant={state.agent.toolAllowlist.includes(t) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTool(t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function StageNetwork({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const patch = (p: Partial<ScenarioState["network"]>) =>
    dispatch({ type: "PATCH", patch: { network: { ...state.network, ...p } } });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="Endpoint">
        <Select
          value={state.network.endpoint}
          onValueChange={(v) => patch({ endpoint: v as never })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Toggle
        label="Egress allowlist"
        v={state.network.egressAllowlist}
        on={(x) => patch({ egressAllowlist: x })}
      />
      <Toggle label="Firewall" v={state.network.firewall} on={(x) => patch({ firewall: x })} />
    </div>
  );
}

function StageOps({ state, dispatch }: { state: ScenarioState; dispatch: React.Dispatch<Action> }) {
  const patch = (p: Partial<ScenarioState["ops"]>) =>
    dispatch({ type: "PATCH", patch: { ops: { ...state.ops, ...p } } });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Toggle label="Logging" v={state.ops.logging} on={(x) => patch({ logging: x })} />
      <Toggle label="Monitoring" v={state.ops.monitoring} on={(x) => patch({ monitoring: x })} />
      <Toggle label="Alerting" v={state.ops.alerting} on={(x) => patch({ alerting: x })} />
      <Toggle label="Rollback plan" v={state.ops.rollback} on={(x) => patch({ rollback: x })} />
      <Field label={`Retention (days): ${state.ops.retentionDays}`}>
        <Input
          type="number"
          value={state.ops.retentionDays}
          onChange={(e) => patch({ retentionDays: +e.target.value })}
        />
      </Field>
      <Field label={`Cost limit (USD/day): ${state.ops.costLimitUsd}`}>
        <Input
          type="number"
          value={state.ops.costLimitUsd}
          onChange={(e) => patch({ costLimitUsd: +e.target.value })}
        />
      </Field>
    </div>
  );
}

function StageEval({
  state,
  dispatch,
  label,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
  label: string;
}) {
  const run = () => {
    const result = runEvaluation(state);
    dispatch({ type: "PATCH", patch: { evalHistory: [...state.evalHistory, result] } });
    dispatch({
      type: "LOG",
      entry: {
        id: crypto.randomUUID(),
        ts: Date.now(),
        source: "eval",
        severity: "info",
        message: `${label} eval: retrieval@k=${result.retrievalAtK.toFixed(2)} grounded=${result.groundedness.toFixed(2)} aclLeaks=${result.aclLeaks} injResist=${result.promptInjectionResisted.toFixed(2)} unsafe=${result.unsafeOutputs}`,
      },
    });
  };
  const last = state.evalHistory[state.evalHistory.length - 1];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Runs a synthetic query set against current configuration. Result is computed from state —
        not a canned answer.
      </p>
      <Button onClick={run}>Run {label} evaluation</Button>
      {last && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <Stat label="Retrieval@k" v={last.retrievalAtK.toFixed(2)} />
          <Stat label="Groundedness" v={last.groundedness.toFixed(2)} />
          <Stat label="ACL leaks" v={last.aclLeaks} bad={last.aclLeaks > 0} />
          <Stat label="Injection resisted" v={last.promptInjectionResisted.toFixed(2)} />
          <Stat label="Unsafe outputs" v={last.unsafeOutputs} bad={last.unsafeOutputs > 0} />
        </div>
      )}
      <div className="text-xs text-muted-foreground">Runs so far: {state.evalHistory.length}</div>
    </div>
  );
}

function Stat({ label, v, bad }: { label: string; v: string | number; bad?: boolean }) {
  return (
    <div className="border rounded p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${bad ? "text-destructive" : ""}`}>{v}</div>
    </div>
  );
}

function StageInjection({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const fire = () =>
    dispatch({ type: "SET", state: applyInjection(state, indirectPromptInjection) });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        A synthetic event will fire against your current system. Your logs and alerts will show
        evidence. The system will NOT tell you what happened — you diagnose it next.
      </p>
      <Button variant="destructive" disabled={state.injectionFired} onClick={fire}>
        {state.injectionFired ? "Injection already fired" : "Fire injection event"}
      </Button>
      {state.injectionFired && (
        <Alert>
          <AlertTitle>Event fired</AlertTitle>
          <AlertDescription>
            Review the log console below. Then proceed to diagnosis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

const SYMPTOMS = [
  "agent_sent_unauthorized_email",
  "retrieval_returned_wrong_docs",
  "model_timeout",
  "cost_spike",
  "user_permission_denied",
];
const COMPONENTS = [
  "frontend",
  "orchestrator",
  "rag_retrieval",
  "agent",
  "connector",
  "identity",
  "network",
  "logging",
];
const ROOT_CAUSES = [
  "indirect_prompt_injection",
  "direct_prompt_injection",
  "acl_misconfig",
  "token_exposure",
  "stale_index",
  "model_bug",
  "excess_scope",
];
const BLAST = ["single_user", "any_user_query_touching_poisoned_source", "tenant_wide", "external"];
const CONTAIN = [
  "quarantine_document",
  "stop_agent",
  "revoke_connector_token",
  "rotate_secret",
  "disable_connector",
  "rollback_deploy",
];
const REMEDIATE = [
  "content_sanitization",
  "tool_call_guard",
  "delegated_identity",
  "query_time_acl",
  "human_approval_writes",
  "narrow_token_scope",
  "private_endpoint",
  "egress_allowlist",
];

function StageDiagnosis({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const [a, setA] = useState<DiagnosisAnswer>(
    state.diagnosis ?? {
      symptom: "",
      component: "",
      rootCause: "",
      blastRadius: "",
      containment: [],
      remediation: [],
      riskReasoning: "",
    },
  );
  const toggle = (key: "containment" | "remediation", v: string) =>
    setA({ ...a, [key]: a[key].includes(v) ? a[key].filter((x) => x !== v) : [...a[key], v] });
  const submit = () => dispatch({ type: "PATCH", patch: { diagnosis: a } });
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <PickField
          label="Symptom"
          value={a.symptom}
          options={SYMPTOMS}
          onChange={(v) => setA({ ...a, symptom: v })}
        />
        <PickField
          label="Affected component"
          value={a.component}
          options={COMPONENTS}
          onChange={(v) => setA({ ...a, component: v })}
        />
        <PickField
          label="Root cause"
          value={a.rootCause}
          options={ROOT_CAUSES}
          onChange={(v) => setA({ ...a, rootCause: v })}
        />
        <PickField
          label="Blast radius"
          value={a.blastRadius}
          options={BLAST}
          onChange={(v) => setA({ ...a, blastRadius: v })}
        />
      </div>
      <MultiField
        label="Immediate containment"
        values={a.containment}
        options={CONTAIN}
        onToggle={(v) => toggle("containment", v)}
      />
      <MultiField
        label="Long-term remediation"
        values={a.remediation}
        options={REMEDIATE}
        onToggle={(v) => toggle("remediation", v)}
      />
      <Field label="Risk reasoning (explain trade-offs & residual risk)">
        <Textarea
          rows={5}
          value={a.riskReasoning}
          onChange={(e) => setA({ ...a, riskReasoning: e.target.value })}
        />
      </Field>
      <Button onClick={submit}>Submit diagnosis</Button>
      {state.diagnosis && (
        <Badge variant="secondary">Diagnosis saved — you can still edit and resubmit</Badge>
      )}
    </div>
  );
}

function PickField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function MultiField({
  label,
  values,
  options,
  onToggle,
}: {
  label: string;
  values: string[];
  options: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <Badge
            key={o}
            variant={values.includes(o) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onToggle(o)}
          >
            {o}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function StageContainment({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const apply = (action: string) => {
    let next = {
      ...state,
      containmentApplied: Array.from(new Set([...state.containmentApplied, action])),
    };
    if (action === "quarantine_document") {
      next = {
        ...next,
        dataSources: state.dataSources.map((d) =>
          d.id === "sp1" ? { ...d, quarantined: true } : d,
        ),
      };
    }
    if (action === "stop_agent")
      next = { ...next, agent: { ...state.agent, killSwitch: true, writeActions: false } };
    if (action === "revoke_connector_token")
      next = { ...next, identity: { ...state.identity, tokenScope: "narrow" } };
    dispatch({ type: "SET", state: next });
    dispatch({
      type: "LOG",
      entry: {
        id: crypto.randomUUID(),
        ts: Date.now(),
        source: "alert",
        severity: "info",
        message: `Containment applied: ${action}`,
      },
    });
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Containment actions mutate real state. They stop the bleed but do not fix root cause —
        that's remediation.
      </p>
      <div className="flex flex-wrap gap-2">
        {CONTAIN.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={state.containmentApplied.includes(c) ? "default" : "outline"}
            onClick={() => apply(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Applied: {state.containmentApplied.join(", ") || "none"}
      </div>
    </div>
  );
}

function StageRemediation({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <Tabs defaultValue="identity">
      <TabsList>
        <TabsTrigger value="identity">Identity</TabsTrigger>
        <TabsTrigger value="rag">RAG</TabsTrigger>
        <TabsTrigger value="agent">Agent</TabsTrigger>
        <TabsTrigger value="net">Network</TabsTrigger>
      </TabsList>
      <TabsContent value="identity">
        <StageIdentity state={state} dispatch={dispatch} />
      </TabsContent>
      <TabsContent value="rag">
        <StagePermTrim state={state} dispatch={dispatch} />
      </TabsContent>
      <TabsContent value="agent">
        <StageAgent state={state} dispatch={dispatch} />
      </TabsContent>
      <TabsContent value="net">
        <StageNetwork state={state} dispatch={dispatch} />
      </TabsContent>
    </Tabs>
  );
}

function StageArtifact({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const a = state.artifact ?? { threatModel: "", reviewSummary: "", residualRisk: "" };
  const set = (p: Partial<typeof a>) =>
    dispatch({ type: "PATCH", patch: { artifact: { ...a, ...p } } });
  return (
    <div className="space-y-3">
      <Alert>
        <AlertTitle>Practice artifact</AlertTitle>
        <AlertDescription>Not for real approval or production evidence.</AlertDescription>
      </Alert>
      <Field label="Threat model (STRIDE-style — include the injection path and mitigations)">
        <Textarea
          rows={6}
          value={a.threatModel}
          onChange={(e) => set({ threatModel: e.target.value })}
        />
      </Field>
      <Field label="Review summary (architecture decisions, evidence, trade-offs)">
        <Textarea
          rows={6}
          value={a.reviewSummary}
          onChange={(e) => set({ reviewSummary: e.target.value })}
        />
      </Field>
      <Field label="Residual risk & compensating controls">
        <Textarea
          rows={3}
          value={a.residualRisk}
          onChange={(e) => set({ residualRisk: e.target.value })}
        />
      </Field>
    </div>
  );
}

function StageSar({
  state,
  dispatch,
  cloud,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
  cloud: CloudHandle;
}) {
  const questions = useMemo(() => generateSarQuestions(state), [state]);
  const answers = state.sarAnswers ?? {};
  const setAns = (id: string, v: string) =>
    dispatch({ type: "PATCH", patch: { sarAnswers: { ...answers, [id]: v } } });
  const submit = () => {
    const post = state;
    const dScore = state.diagnosis
      ? gradeDiagnosis(state, indirectPromptInjection, state.diagnosis, post)
      : null;
    const sarScore = questions.reduce((sum, q) => sum + gradeSarAnswer(answers[q.id] ?? "", q), 0);
    const sarMax = questions.length * 10;
    const total = (dScore?.total ?? 0) * 0.7 + (sarScore / sarMax) * 100 * 0.3;
    const resolved = indirectPromptInjection.isResolvedBy(state);
    const finalScore = Math.round(total);
    progress.saveScenario(
      "scenario:rag-ticket-agent",
      { stagesCompleted: "16" },
      dScore && resolved ? "ideal" : "partial",
      finalScore,
      "architecture",
      COMPETENCIES_TOUCHED,
      resolved && total >= 80 ? "ideal" : total >= 60 ? "partial" : "failed",
    );
    const status: "passed" | "failed" = resolved && total >= 60 ? "passed" : "failed";
    cloud.log({
      kind: "decision",
      stage: "SAR Defence",
      severity: status === "passed" ? "info" : "warn",
      payload: {
        diagnosis: dScore?.total ?? 0,
        sarScore,
        sarMax,
        total: finalScore,
        injectionResolved: resolved,
        status,
      },
    });
    cloud.finish(status, finalScore, 100);
    alert(
      `Scenario complete.\nDiagnosis: ${dScore?.total ?? 0}/100\nSAR: ${sarScore}/${sarMax}\nWeighted total: ${finalScore}/100\nInjection resolved: ${resolved}\n${dScore?.notes.join("\n") ?? ""}`,
    );
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        The panel asks follow-ups derived from YOUR actual configuration. Different designs get
        different questions.
      </p>
      {questions.map((q) => (
        <div key={q.id} className="border rounded p-3 space-y-2">
          <div className="text-sm font-medium">{q.prompt}</div>
          <Textarea
            rows={3}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAns(q.id, e.target.value)}
            placeholder="Type your defence..."
          />
          <div className="text-xs text-muted-foreground">
            Rubric keywords: {q.rubricKeywords.join(", ")}
          </div>
        </div>
      ))}
      <Button onClick={submit}>Submit & score</Button>
    </div>
  );
}

// ---------- Log console ----------

function LogConsole({
  state,
  dispatch,
}: {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [cmd, setCmd] = useState("");
  const filtered = filter === "all" ? state.logs : state.logs.filter((l) => l.source === filter);
  const run = () => {
    const parts = cmd.trim().split(/\s+/);
    const c = parts[0];
    const arg = parts.slice(1).join(" ");
    let msg = "";
    let mutated = state;
    switch (c) {
      case "inspect":
        if (parts[1] === "identity") msg = `identity=${JSON.stringify(state.identity)}`;
        else if (parts[1] === "permissions")
          msg = `rag.permissionFilter=${state.rag.permissionFilter}, agent.humanApproval=${state.agent.humanApproval}`;
        else msg = "usage: inspect identity|permissions";
        break;
      case "query":
        if (parts[1] === "logs") {
          msg = `${state.logs.length} log entries`;
        }
        break;
      case "test":
        if (parts[1] === "retrieval") {
          const r = runEvaluation(state);
          msg = `retrieval@k=${r.retrievalAtK.toFixed(2)} aclLeaks=${r.aclLeaks}`;
        }
        break;
      case "run":
        if (parts[1] === "injection-test") {
          const resolved = indirectPromptInjection.isResolvedBy(state);
          msg = `injection resolved by current config: ${resolved}`;
        }
        break;
      case "disable":
        if (parts[1] === "connector") {
          mutated = {
            ...state,
            containmentApplied: [...state.containmentApplied, "disable_connector"],
          };
          msg = "connector disabled";
        }
        break;
      case "rotate":
        if (parts[1] === "secret") {
          mutated = { ...state, identity: { ...state.identity, tokenScope: "narrow" } };
          msg = "secret rotated, token scope narrowed";
        }
        break;
      case "stop":
        if (parts[1] === "agent") {
          mutated = { ...state, agent: { ...state.agent, killSwitch: true, writeActions: false } };
          msg = "agent stopped, writes disabled";
        }
        break;
      case "rollback":
        mutated = { ...state, ops: { ...state.ops, rollback: true } };
        msg = "rollback applied";
        break;
      default:
        msg = `unknown command: ${c}. Try: inspect identity | query logs | test retrieval | run injection-test | disable connector | rotate secret | stop agent | rollback`;
    }
    dispatch({ type: "SET", state: mutated });
    dispatch({
      type: "LOG",
      entry: {
        id: crypto.randomUUID(),
        ts: Date.now(),
        source: "api",
        severity: "info",
        message: `> ${cmd}\n${msg}`,
      },
    });
    setCmd("");
    void arg;
  };
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Log console & simulated terminal</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "all",
              "auth",
              "api",
              "agent_trace",
              "retrieval_trace",
              "tool_call",
              "oauth",
              "alert",
              "eval",
              "cost",
              "user_complaint",
            ].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="bg-black text-green-300 font-mono text-xs rounded p-2 h-56 overflow-auto">
          {filtered.length === 0 && (
            <div className="text-green-700">
              // no entries — actions and injections populate this stream
            </div>
          )}
          {filtered.map((l) => (
            <div
              key={l.id}
              className={
                l.severity === "critical" || l.severity === "error"
                  ? "text-red-400"
                  : l.severity === "warn"
                    ? "text-yellow-300"
                    : "text-green-300"
              }
            >
              [{new Date(l.ts).toISOString().slice(11, 23)}] {l.source} ·{" "}
              {l.message.replace(/\n/g, "\n    ")}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder='> e.g. "inspect identity" or "run injection-test"'
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            className="font-mono text-xs"
          />
          <Button size="sm" onClick={run}>
            Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- small helpers ----------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, v, on }: { label: string; v: boolean; on: (x: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border rounded p-2">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={on} />
    </div>
  );
}

void Separator;
