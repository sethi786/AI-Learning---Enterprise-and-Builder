import type { PathDef } from "./types";

/**
 * The career map.
 *
 * Paths are pure data so adding a track is an edit here, not a code change.
 *
 * `status` is deliberately honest: only tracks whose underlying roles, labs,
 * and scenarios are actually authored are marked `live`. Everything else is
 * `roadmap` and renders as such, so no learner walks into an empty room.
 */
export const paths: PathDef[] = [
  {
    id: "ai-platform-operations",
    name: "AI Platform Operations",
    tagline: "Run enterprise AI platforms without losing control of them.",
    audiences: ["professional", "career-changer"],
    status: "live",
    summary:
      "Administer Copilot, ChatGPT Enterprise, and Azure AI Foundry the way a real platform team does: identity first, then features, connectors, logging, cost, and offboarding.",
    outcomes: [
      "Configure SSO, SCIM, and RBAC as the identity baseline",
      "Decide which connectors and features to enable, and justify it",
      "Read audit logs and spot anomalies before they become incidents",
      "Offboard a user without orphaning the AI assets they owned",
    ],
    roleIds: ["platform-admin"],
    labIds: ["saas-onboarding", "connector"],
    scenarioIds: ["sc-chatgpt-onboarding", "sc-offboarding-agent-owner"],
  },
  {
    id: "ai-security-architecture",
    name: "AI Security Architecture",
    tagline: "Break a RAG system, then design the fix.",
    audiences: ["professional", "student"],
    status: "live",
    summary:
      "The deepest track. Work a full indirect prompt-injection incident end to end — diagnose it, contain it, redesign the architecture, and defend the decision under review.",
    outcomes: [
      "Explain how indirect prompt injection actually reaches a tool call",
      "Apply permission trimming and query-time ACLs to a retrieval pipeline",
      "Scope agent tools and design a kill switch that works",
      "Survive a security architecture review with evidence, not opinion",
    ],
    roleIds: ["security-architect"],
    labIds: ["rag", "agent", "zero-trust"],
    scenarioIds: ["sc-prompt-injection-rag", "sc-agent-overprivilege", "sc-rag-sharepoint"],
  },
  {
    id: "ai-solution-architecture",
    name: "AI Solution Architecture",
    tagline: "Design the system, not just the prompt.",
    audiences: ["professional", "student", "career-changer"],
    status: "live",
    summary:
      "Move from 'it works in a notebook' to a design that survives contact with an enterprise: trust boundaries, data flow, environment promotion, and a defensible go/no-go.",
    outcomes: [
      "Draw identity, data, and trust boundaries for an AI system",
      "Choose between SaaS, in-house, and hybrid, and say why",
      "Promote a build from lab to production without skipping controls",
      "Write a technical architecture document someone can review",
    ],
    roleIds: ["solution-architect"],
    labIds: ["in-house-app", "rag"],
    scenarioIds: ["sc-bedrock-case-assistant", "sc-copilot-studio-hr"],
  },
  {
    id: "ai-governance-grc",
    name: "AI Governance & GRC",
    tagline: "Turn 'is this allowed?' into a repeatable decision.",
    audiences: ["professional", "career-changer"],
    status: "live",
    summary:
      "Move AI requests through intake, review, and approval with evidence attached — the operating model behind every enterprise that adopted AI without an incident.",
    outcomes: [
      "Run an AI request from intake to a recorded decision",
      "Assemble the evidence pack a regulator or auditor would ask for",
      "Identify which reviewers a given request actually needs",
      "Draft SAR, PIA, and go/no-go artifacts that hold up",
    ],
    roleIds: ["governance-operator", "grc-lead"],
    labIds: ["saas-onboarding"],
    scenarioIds: ["sc-exec-three-tools", "sc-chatgpt-onboarding"],
  },

  // Roadmap — structure is real, content is not yet authored. Marked so the
  // map shows direction without implying readiness.
  {
    id: "ai-engineering",
    name: "AI Engineering",
    tagline: "Build the retrieval and agent systems others govern.",
    audiences: ["student", "career-changer"],
    status: "roadmap",
    summary:
      "Hands-on construction of RAG pipelines, tool-using agents, and evaluation harnesses, from first principles rather than from a vendor console.",
    outcomes: [
      "Build a retrieval pipeline end to end",
      "Design and evaluate a tool-using agent",
      "Set up evals that catch regressions before users do",
    ],
    roleIds: [],
    labIds: ["ai-engineering"],
    scenarioIds: [],
  },
  {
    id: "ai-privacy-legal",
    name: "AI Privacy & Legal",
    tagline: "Where AI meets data protection and contracts.",
    audiences: ["professional"],
    status: "roadmap",
    summary:
      "Privacy impact assessments, lawful basis, cross-border transfer, retention, and the contract terms that decide what you may build.",
    outcomes: [
      "Complete a privacy impact assessment for an AI use case",
      "Spot the contract terms that constrain a deployment",
      "Design retention and minimization into a system",
    ],
    roleIds: [],
    labIds: ["privacy", "legal"],
    scenarioIds: [],
  },
];

export const pathsById: Record<string, PathDef> = Object.fromEntries(paths.map((p) => [p.id, p]));

export const livePaths = paths.filter((p) => p.status === "live");

export function pathsForAudience(audience: PathDef["audiences"][number]): PathDef[] {
  return paths.filter((p) => p.audiences.includes(audience));
}
