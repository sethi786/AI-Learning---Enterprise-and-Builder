import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import {
  appendScenarioEvent,
  finishScenarioRun,
  startScenarioRun,
  updateScenarioRun,
} from "@/lib/scenarioRuns.functions";

type EventKind =
  | "stage_enter"
  | "config_change"
  | "architecture_change"
  | "command"
  | "injection_fired"
  | "diagnosis"
  | "containment"
  | "remediation"
  | "evaluation"
  | "artifact"
  | "sar_answer"
  | "decision"
  | "note";

type Severity = "info" | "warn" | "error" | "critical";

type LogArgs = {
  kind: EventKind;
  stage?: string;
  severity?: Severity;
  payload?: Record<string, unknown>;
};

/**
 * Persists a scenario run to Lovable Cloud when the user is signed in.
 * No-ops for signed-out users so anonymous practice still works.
 */
export function useCloudRun(scenarioId: string, scenarioVersion = "v1") {
  const { user, loading } = useSession();
  const [runId, setRunId] = useState<string | null>(null);
  const starting = useRef(false);

  useEffect(() => {
    if (loading || !user || runId || starting.current) return;
    starting.current = true;
    startScenarioRun({ data: { scenarioId, scenarioVersion, state: {} } })
      .then((row) => setRunId((row as { id: string }).id))
      .catch(() => {
        starting.current = false;
      });
  }, [user, loading, runId, scenarioId, scenarioVersion]);

  function log(args: LogArgs) {
    if (!runId) return;
    void appendScenarioEvent({
      data: {
        runId,
        kind: args.kind,
        stage: args.stage,
        severity: args.severity ?? "info",
        payload: args.payload ?? {},
      },
    }).catch(() => {});
  }

  function updateStage(stage: string) {
    if (!runId) return;
    void updateScenarioRun({ data: { runId, currentStage: stage } }).catch(() => {});
  }

  function finish(status: "passed" | "failed" | "abandoned", score?: number, maxScore?: number) {
    if (!runId) return;
    void finishScenarioRun({ data: { runId, status, score, maxScore } }).catch(() => {});
  }

  return { runId, signedIn: !!user, log, updateStage, finish };
}
