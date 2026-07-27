import { describe, expect, it } from "vitest";
import {
  applyInjection,
  gradeDiagnosis,
  indirectPromptInjection,
  initialState,
  recompute,
  runEvaluation,
  runSelfTests,
  type DiagnosisAnswer,
  type ScenarioState,
} from "./ragTicketAgent";

// Reality Gate #9: automated tests for the vertical slice engine.
// These lock the invariants the UI relies on for consequences and validation.

function insecureState(): ScenarioState {
  const s = initialState();
  // Deliberately leave: no query-time ACL, no sanitization, no tool guard,
  // service-principal agent identity, writes on, no human approval.
  return s;
}

function securedState(): ScenarioState {
  const s = initialState();
  s.rag.permissionFilter = "query_time_acl";
  s.rag.contentSanitization = true;
  s.rag.toolCallGuardOnRetrieval = true;
  s.identity.agentIdentity = "delegated";
  s.agent.humanApproval = "writes_only";
  return s;
}

describe("ragTicketAgent engine", () => {
  it("self-tests all pass", () => {
    const results = runSelfTests();
    expect(results.every((r) => r.ok), results.filter((r) => !r.ok).map((r) => r.name).join(",")).toBe(true);
  });

  it("insecure baseline evaluation exposes ACL leaks and low injection resistance", () => {
    const s = insecureState();
    const r = runEvaluation(s);
    expect(r.aclLeaks).toBeGreaterThan(0);
    expect(r.promptInjectionResisted).toBeLessThan(0.5);
  });

  it("secured design resolves the indirect prompt injection", () => {
    expect(indirectPromptInjection.isResolvedBy(insecureState())).toBe(false);
    expect(indirectPromptInjection.isResolvedBy(securedState())).toBe(true);
  });

  it("firing the injection mutates state (logs, incidents, injectionFired)", () => {
    const before = insecureState();
    const after = applyInjection(before, indirectPromptInjection);
    expect(after.injectionFired).toBe(true);
    expect(after.logs.length).toBeGreaterThan(before.logs.length);
    expect(after.incidents.length).toBe(before.incidents.length + 1);
  });

  it("post-remediation evaluation reaches 0 ACL leaks and 0 unsafe outputs", () => {
    const attacked = applyInjection(insecureState(), indirectPromptInjection);
    const preEval = runEvaluation(attacked);
    expect(preEval.unsafeOutputs).toBe(1);

    // Apply remediation to the same run
    const remediated: ScenarioState = {
      ...attacked,
      rag: { ...attacked.rag, permissionFilter: "query_time_acl", contentSanitization: true, toolCallGuardOnRetrieval: true },
      identity: { ...attacked.identity, agentIdentity: "delegated" },
      agent: { ...attacked.agent, humanApproval: "writes_only" },
    };
    expect(indirectPromptInjection.isResolvedBy(remediated)).toBe(true);
    const postEval = runEvaluation(remediated);
    expect(postEval.aclLeaks).toBe(0);
    expect(postEval.unsafeOutputs).toBe(0);
    expect(postEval.promptInjectionResisted).toBeGreaterThanOrEqual(0.9);
  });

  it("gradeDiagnosis rewards correct root-cause + remediation + resolved config", () => {
    const attacked = applyInjection(insecureState(), indirectPromptInjection);
    const remediated: ScenarioState = {
      ...attacked,
      rag: { ...attacked.rag, permissionFilter: "query_time_acl", contentSanitization: true, toolCallGuardOnRetrieval: true },
      identity: { ...attacked.identity, agentIdentity: "delegated" },
      agent: { ...attacked.agent, humanApproval: "writes_only" },
    };
    const good: DiagnosisAnswer = {
      symptom: indirectPromptInjection.truth.symptom,
      component: indirectPromptInjection.truth.component,
      rootCause: indirectPromptInjection.truth.rootCause,
      blastRadius: indirectPromptInjection.truth.blastRadius,
      containment: indirectPromptInjection.truth.containment,
      remediation: indirectPromptInjection.truth.remediation,
      riskReasoning: "Indirect prompt injection via retrieved SharePoint content; least-privilege delegated identity, query-time ACL, sanitization and tool-call guard close the exploit; residual risk is stale ACL cache.",
    };
    const bad: DiagnosisAnswer = {
      symptom: "model_timeout",
      component: "frontend",
      rootCause: "model_bug",
      blastRadius: "single_user",
      containment: [],
      remediation: [],
      riskReasoning: "n/a",
    };
    const goodScore = gradeDiagnosis(remediated, indirectPromptInjection, good, remediated);
    const badScore = gradeDiagnosis(attacked, indirectPromptInjection, bad, attacked);
    expect(goodScore.total).toBeGreaterThan(badScore.total);
    expect(goodScore.total).toBeGreaterThanOrEqual(60);
  });

  it("recompute surfaces missing controls when logging is off", () => {
    const s = initialState();
    s.ops.logging = false;
    const d = recompute(s);
    expect(d.missingControls.length).toBeGreaterThan(0);
  });
});