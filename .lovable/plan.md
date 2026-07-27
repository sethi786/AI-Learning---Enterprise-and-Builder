# Vertical Slice: Enterprise RAG + Ticket Agent (end-to-end)

Per your depth gate, I will NOT add more lessons/screens. Instead I will build ONE complete scenario that exercises all five engines, and refactor the existing engine code to support it. Everything else (labs list, extra sims) stays as-is until this slice passes its own tests.

## Scope of this build

Deliverable: `/scenarios/rag-ticket-agent` — a single route with 16 sequential stages matching your required flow (design → configure → evaluate → attack → diagnose → contain → remediate → retest → artifact → SAR defence). All state lives in one mutable `ScenarioState` object; every stage reads and writes it; outcomes are computed, not scripted.

## The five engines (shared, reusable)

Under `src/engines/`:

1. `state/` — `ScenarioState` type + `useScenarioState` reducer store (in-memory + localStorage snapshot per scenario id). Holds architecture graph, identities, RBAC, data classifications, RAG config, agent config, network rules, logs[], alerts[], evalResults, costs, incidents.

2. `config/` — pure `recompute(state)` function that derives: `securityPosture`, `privacyExposure`, `retrievalQuality`, `latencyMs`, `costPerQuery`, `opsReadiness`, `governanceGaps[]`, `missingControls[]`. Deterministic scoring from config values — no hidden "correct answer" table.

3. `injection/` — `Injection` type + registry. Each injection has `precondition(state)`, `apply(state) -> events[]` that appends synthetic logs/alerts/user-complaints, and `isResolvedBy(state)` that checks whether the learner's current config actually mitigates it. For this slice: `indirect-prompt-injection-via-sharepoint-doc`.

4. `diagnosis/` — structured diagnosis form (symptom → component → root cause → blast radius → containment → remediation). Grader compares learner's picks against the injection's `truth` object AND re-runs `recompute` on the post-remediation state to verify the fix actually works. Score dimensions: diagnosis, containment, remediation, risk reasoning, evidence selection, architecture, communication, residual risk.

5. `competency/` — extends existing `recordEvidence` to require N successful applications across DIFFERENT scenarios before promoting past `Demonstrated`. Adds the 7-level ladder you specified. Heatmap route already exists — will be extended with the new categories.

## The scenario's 16 stages (all use engine state)

```text
1  Architecture canvas    → place nodes+edges; recompute flags missing controls
2  SSO/RBAC config        → identity panel; wrong choice = audit gaps in logs
3  Data classification    → tag SharePoint sources; drives permission trimming
4  RAG config             → chunk/overlap/embeddings/rerank/permission-filter
5  Permission trimming    → query-time vs ingest-time; ACL source
6  Agent identity+tools   → delegated vs app; tool allowlist; approval gates
7  Network controls       → public/private endpoint; egress allowlist
8  Logging/monitoring     → what to capture; retention; alert rules
9  Baseline evaluation    → runs synthetic query set against current config;
                            produces retrieval@k, groundedness, ACL-leak count
10 INJECTION fires        → poisoned SharePoint doc arrives; logs+alert appear
11 Diagnosis form         → learner picks symptom/component/root cause/blast
12 Containment            → pick actions (disable connector, revoke token,
                            quarantine doc, stop agent); state mutates
13 Remediation            → return to config panels; must actually change
                            settings that recompute closes the gap
14 Re-evaluation          → re-run eval; injection.isResolvedBy checked
15 Artifact               → learner writes threat model + review summary in
                            structured fields; graded on required elements
16 SAR defence            → engine generates 4-6 follow-up questions derived
                            from the learner's ACTUAL config choices (e.g.
                            "you chose app permissions — justify tenant scope");
                            free-text answers scored against rubric keywords
                            + config cross-check
```

Every stage gates on the previous stage's outputs. You cannot advance stage 14 until `recompute` shows the injection resolved AND baseline eval regressions are within tolerance.

## Log/terminal experience (this slice)

A `LogConsole` component reads `state.logs[]` (auth, API, agent trace, retrieval trace, tool-call, OAuth grant, alerts, eval results, cost). Filterable by source. Supports simulated commands: `inspect identity <id>`, `query logs <filter>`, `view agent trace <runId>`, `test retrieval <query>`, `run injection-test`, `disable connector <id>`, `rotate secret <id>`, `stop agent`, `rollback deploy`. Commands mutate state through the reducer; no fake output.

## Architecture canvas (this slice)

Lightweight SVG canvas (no new dep) — draggable nodes from a fixed palette (user, IdP, frontend, gateway, backend, orchestrator, model, agent, tool, connector, data source, vector store, secret vault, monitoring, SIEM, human approval, firewall, private endpoint). Edges auto-classify as data / identity / control. Overlays: public exposure, sensitive-data path, missing controls, unmonitored components, SPOFs. Overlays are computed from graph + config; NOT auto-fixed.

## Tests (required by your depth gate)

`src/engines/**/*.test.ts` using vitest:
- `recompute` monotonicity: better config never lowers securityPosture
- Injection `isResolvedBy` returns false on default config, true only after specific remediation
- Diagnosis grader: correct picks + working remediation = full score; correct picks + non-working remediation = partial
- SAR question generator: given a config with app permissions, generates the tenant-scope question; given delegated, does not
- Scenario reducer: stage advance blocked when preconditions unmet

Plus one Playwright smoke test that drives the whole 16-stage flow headlessly and asserts the final artifact + scores exist.

## What I will NOT do in this pass

- No new lessons, quizzes, flashcards, or exam content
- No additional labs beyond this one scenario (Labs 1/3/4/5 from your list come in follow-up passes once the engines are proven here)
- No visual redesign of existing routes
- Existing `/lab-engine` stays as-is; the new scenario lives at `/scenarios/rag-ticket-agent` and is the featured entry on the dashboard

## File plan (high level)

- `src/engines/state/scenarioState.ts` (+ test)
- `src/engines/config/recompute.ts` (+ test)
- `src/engines/injection/registry.ts`, `injections/indirect-prompt-injection.ts` (+ test)
- `src/engines/diagnosis/grader.ts` (+ test)
- `src/engines/competency/ladder.ts` (extends existing)
- `src/components/canvas/ArchitectureCanvas.tsx`
- `src/components/console/LogConsole.tsx`
- `src/components/scenario/StageShell.tsx` + one component per stage
- `src/routes/scenarios.rag-ticket-agent.tsx` (single route, stage router inside)
- `src/scenarios/rag-ticket-agent/definition.ts` (initial state, truth, rubric, SAR question templates)

## Acceptance for this slice

- All engine unit tests pass
- Playwright run: happy path scores >= 80%; sabotaged path (skip remediation) fails re-evaluation and blocks stage 14
- Changing any single config value observably changes at least one recompute output in the UI
- SAR questions differ between two runs with different config choices

Approve and I'll build it. If you want a different first scenario (e.g. Lab 3 agent instead), say so before I start.