import type { Competency, CompetencyCategory } from "./types";

function c(
  id: string,
  category: CompetencyCategory,
  name: string,
  description: string,
  prerequisites: string[] = [],
): Competency {
  return { id, category, name, description, prerequisites };
}

export const competencies: Competency[] = [
  // ── Platform Administration ────────────────────────────────────────────
  c("plat.sso", "platform", "SSO", "Enterprise single sign-on integration for AI platforms."),
  c("plat.saml", "platform", "SAML", "SAML federation, assertions, and IdP-initiated flows."),
  c("plat.oidc", "platform", "OIDC", "OpenID Connect flows, ID tokens, and claims."),
  c("plat.scim", "platform", "SCIM", "Just-in-time and scheduled user/group provisioning."),
  c("plat.rbac", "platform", "RBAC", "Role model design for AI platform admin surfaces."),
  c("plat.security_groups", "platform", "Security groups", "Group-based entitlement scoping."),
  c("plat.admin_roles", "platform", "Admin roles", "Separation of duties across super, security, billing, audit."),
  c("plat.feature_controls", "platform", "Feature controls", "Progressive rollout, model pickers, connector toggles."),
  c("plat.audit_logs", "platform", "Audit logs", "Log completeness, retention, export, review."),
  c("plat.release_mgmt", "platform", "Release management", "Vendor release notes, breaking changes, comms."),
  c("plat.support", "platform", "Support", "Vendor support tiers, SLAs, escalation."),
  c("plat.offboarding", "platform", "Offboarding", "Access removal, ownership transfer, data return/deletion."),
  c("plat.usage_analytics", "platform", "Usage analytics", "Adoption, active users, cohort trends."),
  c("plat.finops", "platform", "FinOps", "Cost drivers, budgets, chargeback, guardrails."),

  // ── Governance ─────────────────────────────────────────────────────────
  c("gov.intake", "governance", "AI intake", "Structured request capture and triage."),
  c("gov.registry", "governance", "AI registry", "Portfolio inventory, ownership, lifecycle state."),
  c("gov.risk_classification", "governance", "Risk classification", "Inherent risk tiering criteria."),
  c("gov.review_applicability", "governance", "Review applicability", "Which reviews apply to which use cases."),
  c("gov.capability_governance", "governance", "Capability governance", "Governing model, RAG, agent capabilities."),
  c("gov.agent_governance", "governance", "Agent governance", "Agent lifecycle, tools, approvals, recert."),
  c("gov.evidence_management", "governance", "Evidence management", "Collecting, storing, and reviewing evidence."),
  c("gov.approval_workflow", "governance", "Approval workflow", "Reviewer routing and decisions."),
  c("gov.exceptions", "governance", "Exceptions", "Risk-accepted exceptions with expiry and owners."),
  c("gov.recertification", "governance", "Recertification", "Periodic re-review of active AI assets."),
  c("gov.retirement", "governance", "Retirement", "Decommissioning and data handling."),

  // ── Architecture ───────────────────────────────────────────────────────
  c("arch.bcbe", "architecture", "Buy / configure / extend / build", "Deciding the right build mode."),
  c("arch.saas", "architecture", "SaaS architecture", "Tenant, workspace, identity, connectors."),
  c("arch.inhouse", "architecture", "In-house architecture", "Frontend → gateway → app → orchestrator → model."),
  c("arch.rag", "architecture", "RAG", "Retrieval-augmented generation end-to-end."),
  c("arch.agents", "architecture", "Agents", "Planning loop, tools, memory."),
  c("arch.connectors", "architecture", "Connectors", "Standard, custom, API, MCP connectors."),
  c("arch.apis", "architecture", "APIs", "API contracts, versioning, gateway patterns."),
  c("arch.iam", "architecture", "IAM design", "Identity for users, services, agents."),
  c("arch.dataflow", "architecture", "Data flow", "Where data goes and who touches it."),
  c("arch.sequence", "architecture", "Sequence diagrams", "Request-level design communication."),
  c("arch.nfrs", "architecture", "NFRs", "Latency, throughput, availability targets."),
  c("arch.resilience", "architecture", "Resilience", "Failure isolation, retries, degraded modes."),
  c("arch.observability", "architecture", "Observability", "Logs, metrics, traces, evals."),
  c("arch.cost", "architecture", "Cost architecture", "Token, storage, compute cost shaping."),

  // ── Security ───────────────────────────────────────────────────────────
  c("sec.threat_modeling", "security", "Threat modeling", "STRIDE / attack trees for AI systems."),
  c("sec.zero_trust", "security", "Zero Trust", "Verify explicitly, least privilege, assume breach."),
  c("sec.owasp_llm", "security", "OWASP AI/LLM risks", "Top LLM risks and mitigations."),
  c("sec.mitre_thinking", "security", "MITRE-style threat thinking", "Adversary TTP reasoning for AI."),
  c("sec.prompt_injection", "security", "Prompt injection", "Direct injection detection & mitigation."),
  c("sec.indirect_injection", "security", "Indirect prompt injection", "Injection via retrieved or tool content."),
  c("sec.rag_poisoning", "security", "RAG poisoning", "Corpus and index poisoning."),
  c("sec.data_exfil", "security", "Data exfiltration", "Egress via outputs, tools, connectors."),
  c("sec.agent_tool_misuse", "security", "Agent tool misuse", "Overprivileged and abused tools."),
  c("sec.secrets", "security", "Secrets", "Secret storage, rotation, leakage prevention."),
  c("sec.network", "security", "Network", "Egress control, private endpoints."),
  c("sec.oauth", "security", "OAuth", "Delegated vs application scopes, token handling."),
  c("sec.ssdlc", "security", "Secure SDLC", "SAST, SCA, secret scanning, review gates."),
  c("sec.monitoring", "security", "Monitoring", "AI-specific detection signals."),
  c("sec.ir", "security", "Incident response", "Triage, contain, remediate, learn."),

  // ── Privacy / Legal / Risk ─────────────────────────────────────────────
  c("plr.pii", "privacy_legal_risk", "PII classification", "Identifying and tiering personal data."),
  c("plr.minimization", "privacy_legal_risk", "Data minimization", "Collect and expose the minimum needed."),
  c("plr.purpose", "privacy_legal_risk", "Purpose limitation", "Only using data for stated purposes."),
  c("plr.residency", "privacy_legal_risk", "Residency", "Geographic constraints on data & processing."),
  c("plr.retention", "privacy_legal_risk", "Retention", "Time-bound storage."),
  c("plr.deletion", "privacy_legal_risk", "Deletion", "Verified deletion across systems and indexes."),
  c("plr.dpa", "privacy_legal_risk", "DPA", "Data processing agreement expectations."),
  c("plr.subprocessors", "privacy_legal_risk", "Subprocessors", "Vendor chain review."),
  c("plr.client_restrictions", "privacy_legal_risk", "Client restrictions", "Contractual data-use limits."),
  c("plr.ip", "privacy_legal_risk", "IP", "Ownership of inputs, outputs, training data."),
  c("plr.risk_acceptance", "privacy_legal_risk", "Risk acceptance", "When and how to accept residual risk."),
  c("plr.hitl", "privacy_legal_risk", "Human oversight", "Meaningful human-in-the-loop design."),
  c("plr.responsible_ai", "privacy_legal_risk", "Responsible AI", "Fairness, transparency, contestability."),

  // ── Engineering ────────────────────────────────────────────────────────
  c("eng.model_selection", "engineering", "Model selection", "Fit-for-purpose model choice."),
  c("eng.prompt_versioning", "engineering", "Prompt versioning", "Prompt as code."),
  c("eng.eval_datasets", "engineering", "Evaluation datasets", "Golden sets and coverage."),
  c("eng.groundedness", "engineering", "Groundedness", "Answer supported by retrieved sources."),
  c("eng.retrieval_eval", "engineering", "Retrieval evaluation", "Recall / MRR / nDCG for RAG."),
  c("eng.tool_eval", "engineering", "Tool evaluation", "Correctness of tool calls."),
  c("eng.observability", "engineering", "Observability", "Traces, spans, evals in prod."),
  c("eng.cicd", "engineering", "CI/CD", "Pipelines for prompts, models, agents."),
  c("eng.testing", "engineering", "Testing", "Unit, integration, red-team, eval tests."),
  c("eng.model_lifecycle", "engineering", "Model lifecycle", "Version pinning, deprecation handling."),
  c("eng.cost_opt", "engineering", "Cost optimization", "Caching, routing, batch, distillation."),
];

export const competenciesById = Object.fromEntries(
  competencies.map((x) => [x.id, x]),
) as Record<string, Competency>;

export const competencyCategories: {
  id: CompetencyCategory;
  label: string;
}[] = [
  { id: "platform", label: "Platform Administration" },
  { id: "governance", label: "Governance" },
  { id: "architecture", label: "Architecture" },
  { id: "security", label: "Security" },
  { id: "privacy_legal_risk", label: "Privacy / Legal / Risk" },
  { id: "engineering", label: "Engineering" },
];