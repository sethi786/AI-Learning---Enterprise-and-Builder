import type { PlatformDef } from "./types";

const deepPlatform = (p: Omit<PlatformDef, "depth">): PlatformDef => ({
  ...p,
  depth: "deep",
});

const scaffoldPlatform = (
  id: string,
  name: string,
  category: PlatformDef["category"],
  what: string,
): PlatformDef => ({
  id,
  name,
  category,
  what,
  useCases: [`Enterprise use cases for ${name} (add real cases as you learn)`],
  adminResponsibilities: ["Identity, RBAC, feature enablement, audit logs, cost"],
  architecture:
    "Fill in identity → app → orchestrator → model → data flow for this platform.",
  securityModel: ["SSO/MFA", "Admin RBAC", "Audit logs"],
  iamModel: ["SAML/OIDC", "SCIM provisioning where supported"],
  dataModel: ["Prompt/response retention", "Enterprise data boundary"],
  privacy: ["Confirm subprocessors and residency"],
  legal: ["Vendor contract, DPA, output ownership"],
  dataGovernance: ["Data source approvals, classification"],
  agentConnectorRisks: ["Scope creep, credential storage"],
  environments: ["Sandbox → pilot → production"],
  commonRisks: ["Default-on features", "Overbroad connectors", "Weak logging"],
  fixes: ["Turn off risky defaults", "Scope connectors tightly", "Ship logs to SIEM"],
  evidence: ["Admin runbook", "Access review", "Audit log sample"],
  quiz: [],
  depth: "scaffold",
});

export const platforms: PlatformDef[] = [
  deepPlatform({
    id: "m365-copilot",
    name: "Microsoft 365 Copilot",
    category: "saas-productivity",
    what: "Enterprise productivity assistant grounded in Microsoft Graph (mail, files, chats, meetings) with tenant isolation.",
    useCases: [
      "Summarize meetings and threads",
      "Draft docs grounded in SharePoint/OneDrive",
      "Search across Graph with permission-aware retrieval",
    ],
    adminResponsibilities: [
      "Assign licenses via Entra groups",
      "Configure semantic index and Graph connectors",
      "Manage Copilot Studio / plugin approvals",
      "Configure sensitivity label enforcement",
      "Review audit logs in Purview",
    ],
    architecture:
      "User → M365 client → Copilot orchestrator → Graph (permission-trimmed retrieval) → Azure OpenAI (Microsoft-hosted, tenant-isolated) → response with citations.",
    securityModel: [
      "Enterprise Data Boundary (data does not train foundation models)",
      "Sensitivity labels + DLP enforced at retrieval",
      "Conditional Access + MFA",
      "Customer Key / DKE for high-sensitivity",
    ],
    iamModel: [
      "Entra ID SSO (SAML/OIDC)",
      "Group-based licensing",
      "PIM for admin roles",
    ],
    dataModel: [
      "Retrieval respects existing Graph ACLs (garbage-in-permissions = garbage-out)",
      "Prompts/responses retained per tenant policy",
      "No training on tenant data",
    ],
    privacy: [
      "EU Data Boundary available",
      "Purview retention + eDiscovery apply",
      "DSR handled via existing M365 tooling",
    ],
    legal: [
      "Copilot Copyright Commitment",
      "Standard Microsoft OST + DPA apply",
    ],
    dataGovernance: [
      "Oversharing in SharePoint is Copilot's #1 pre-req problem",
      "Run SharePoint Advanced Management + Restrict Access Control before rollout",
    ],
    agentConnectorRisks: [
      "Graph connectors ingesting third-party sources widen the blast radius",
      "Copilot Studio agents with actions can act as the user — treat as delegated identity",
    ],
    environments: ["Targeted release ring", "Pilot license pool", "General rollout"],
    commonRisks: [
      "Rollout without SharePoint permission remediation",
      "Sensitivity labels not deployed → DLP not enforced at retrieval",
      "Copilot Studio agents exposed org-wide",
    ],
    fixes: [
      "Run oversharing report + Restrict Access Control before licensing",
      "Deploy sensitivity labels with default policy",
      "Scope Copilot Studio agents to specific groups",
    ],
    evidence: [
      "Oversharing remediation report",
      "Label rollout status",
      "Purview audit log sample",
      "Rollout ring plan",
    ],
    scenarioId: "sc-copilot-studio-hr",
    quiz: [
      {
        id: "q-m365-1",
        type: "mc",
        prompt: "Copilot returns a document the requester should not see. What is the most likely root cause?",
        options: [
          { id: "a", label: "Copilot ignores Graph ACLs" },
          { id: "b", label: "SharePoint oversharing — the ACL already allowed it", correct: true },
          { id: "c", label: "Model was trained on the document" },
          { id: "d", label: "Prompt injection" },
        ],
        explanation:
          "Copilot retrieval is permission-aware. If a user can see content in Copilot, they could see it in SharePoint search too — the fix is remediating oversharing.",
        domain: "platform",
      },
    ],
  }),
  deepPlatform({
    id: "chatgpt-enterprise",
    name: "ChatGPT Enterprise",
    category: "saas-chat",
    what: "OpenAI's enterprise workspace with SSO, SCIM, admin controls, no training on your data, and workspace agents/GPTs.",
    useCases: [
      "General-purpose assistant",
      "Custom GPTs for teams",
      "Workspace agents with connectors",
      "Data analysis on uploaded files",
    ],
    adminResponsibilities: [
      "SSO (SAML) + SCIM provisioning",
      "Workspace roles (owner, admin, member)",
      "Feature toggles: GPTs, connectors, memory, code interpreter",
      "Compliance API for audit logs",
      "Usage / seat management",
    ],
    architecture:
      "User → ChatGPT client → OpenAI workspace tenant (isolated) → optional GPT/agent with tools/connectors → model. Files, prompts, and outputs stored in workspace; not used for training.",
    securityModel: [
      "SAML SSO + optional MFA at IdP",
      "SCIM for provisioning/deprovisioning",
      "Data encrypted in transit and at rest",
      "No training on business data by default",
    ],
    iamModel: [
      "Enforce SSO domain",
      "Restrict workspace creation",
      "Owner ≠ admin — use PIM-style rotation",
    ],
    dataModel: [
      "Prompts / files retained per workspace policy",
      "Memory can be disabled",
      "Custom retention available for enterprise",
    ],
    privacy: [
      "SOC 2 Type II, ISO 27001",
      "DPA available",
      "Region controls (US/EU) with data residency add-on",
    ],
    legal: [
      "IP indemnification for outputs (per terms)",
      "Do not use for regulated data without added controls",
    ],
    dataGovernance: [
      "Uploaded files inherit workspace scope, not source ACLs",
      "Custom GPTs can expose sensitive files if shared broadly",
    ],
    agentConnectorRisks: [
      "Workspace agents can call external tools — evaluate each connector's scope",
      "GPTs shared with everyone act as data-leak surfaces",
    ],
    environments: [
      "Team workspace (pilot) → Enterprise workspace (prod)",
      "Separate workspace for regulated business unit",
    ],
    commonRisks: [
      "Users signing up with personal ChatGPT accounts (shadow AI)",
      "Memory left enabled by default",
      "GPTs shared org-wide with confidential files",
    ],
    fixes: [
      "Domain capture / verified domains",
      "Disable memory at workspace level",
      "Restrict GPT sharing scope",
      "Ingest Compliance API logs into SIEM",
    ],
    evidence: [
      "SSO/SCIM configuration screenshot",
      "Feature toggle export",
      "Compliance API log sample",
      "Access review report",
    ],
    scenarioId: "sc-chatgpt-onboarding",
    quiz: [
      {
        id: "q-cgpte-1",
        type: "choose-control",
        prompt: "Legal is worried about employees pasting client data into personal ChatGPT accounts. Which control most directly reduces this?",
        options: [
          { id: "a", label: "Turn off memory in the workspace" },
          { id: "b", label: "Domain capture / verified domain claim", correct: true },
          { id: "c", label: "Rotate the SSO signing certificate" },
          { id: "d", label: "Block ChatGPT at the proxy" },
        ],
        explanation:
          "Domain capture forces users with corporate email to join the managed enterprise workspace, eliminating personal-account usage without an outright block.",
        domain: "platform",
      },
      {
        id: "q-cgpte-2",
        type: "find-risk",
        prompt: "A team shares a custom GPT built on confidential contract templates with the whole workspace. Biggest risk?",
        options: [
          { id: "a", label: "Model may hallucinate template names" },
          { id: "b", label: "Users outside the contracts team can retrieve contract content via the GPT", correct: true },
          { id: "c", label: "Rate limits will be exceeded" },
          { id: "d", label: "Memory will retain the templates" },
        ],
        explanation:
          "GPT sharing scope is a data-access boundary. If confidential content is embedded, sharing widens who can retrieve it. Restrict scope or move to a dedicated workspace.",
        domain: "security",
      },
    ],
  }),
  deepPlatform({
    id: "azure-ai-foundry",
    name: "Azure AI Foundry",
    category: "cloud-ai",
    what: "Azure's platform for building, evaluating, and deploying AI apps and agents on top of Azure OpenAI + Azure AI Search.",
    useCases: [
      "In-house RAG apps",
      "Agents with tools",
      "Model evaluations",
      "Managed prompt flows",
    ],
    adminResponsibilities: [
      "Subscription + resource-group hygiene",
      "Private endpoints, VNET integration",
      "Managed identities for services",
      "Key Vault for secrets",
      "Content Safety configuration",
      "Diagnostic logs to Log Analytics",
    ],
    architecture:
      "User → App (Entra ID token) → API (managed identity) → AI Search (permission-aware index) + Azure OpenAI (private endpoint) → response. Logs to Log Analytics + Purview.",
    securityModel: [
      "Private endpoints; no public model endpoints",
      "Managed identity everywhere (no keys)",
      "Content Safety filters",
      "Customer-managed keys",
    ],
    iamModel: [
      "Entra ID for user and workload identity",
      "RBAC on Foundry, Search, OpenAI resources",
      "On-behalf-of flow for user-scoped retrieval",
    ],
    dataModel: [
      "AI Search indexes with security trimming",
      "Vector store lifecycle (reindex, delete)",
      "Prompt/response logging opt-in",
    ],
    privacy: ["Region pinning", "No abuse-monitoring override available for regulated use"],
    legal: ["Azure OpenAI terms + enterprise MSA"],
    dataGovernance: [
      "Security trimming in Search index is mandatory for user-facing RAG",
      "Purview classification carried into index",
    ],
    agentConnectorRisks: [
      "Foundry agents with tools require explicit action allowlists",
      "Function calling can invoke overbroad backend APIs",
    ],
    environments: ["Dev subscription → UAT → Prod with separate resource groups"],
    commonRisks: [
      "Public model endpoint left open",
      "Search index without security trimming",
      "Secrets in prompts",
      "Missing Content Safety config",
    ],
    fixes: [
      "Enforce private endpoints via Azure Policy",
      "Add security trimming filters",
      "Move secrets to Key Vault + managed identity",
      "Enable Content Safety input+output filters",
    ],
    evidence: [
      "Network diagram with private endpoints",
      "Managed identity role assignments",
      "Search index security trimming query",
      "Content Safety configuration export",
    ],
    scenarioId: "sc-rag-sharepoint",
    quiz: [
      {
        id: "q-foundry-1",
        type: "find-risk",
        prompt: "A Foundry RAG app returns HR salary docs to any employee. Root cause?",
        options: [
          { id: "a", label: "Model hallucinated the numbers" },
          { id: "b", label: "AI Search index has no security trimming filter", correct: true },
          { id: "c", label: "Content Safety is off" },
          { id: "d", label: "Managed identity has too few permissions" },
        ],
        explanation:
          "Retrieval-side ACL enforcement is the single most important RAG control. Without security-trimming filters in AI Search, the index acts as a bypass around SharePoint permissions.",
        domain: "security",
      },
    ],
  }),
  scaffoldPlatform("copilot-studio", "Copilot Studio", "saas-productivity", "Low-code builder for M365 Copilot agents with actions and connectors."),
  scaffoldPlatform("chatgpt-workspace-agents", "ChatGPT Workspace Agents", "saas-chat", "OpenAI workspace agents with tools and connectors."),
  scaffoldPlatform("gemini-enterprise", "Gemini Enterprise", "saas-productivity", "Google's enterprise assistant grounded in Workspace + connectors."),
  scaffoldPlatform("claude-enterprise", "Claude Enterprise", "saas-chat", "Anthropic's enterprise workspace with SSO, admin, and no training on business data."),
  scaffoldPlatform("claude-code", "Claude Code", "coding-assistant", "Terminal-based coding assistant with repo context and tool use."),
  scaffoldPlatform("codex", "Codex", "coding-assistant", "OpenAI coding assistant for engineering workflows."),
  scaffoldPlatform("replit", "Replit", "coding-assistant", "Cloud coding + AI agent environment for teams."),
  scaffoldPlatform("vertex-ai", "Google Vertex AI", "cloud-ai", "Google Cloud's platform for building AI apps grounded in Workspace and BigQuery."),
  scaffoldPlatform("aws-bedrock", "AWS Bedrock", "cloud-ai", "AWS's managed foundation-model platform with knowledge bases and agents."),
  scaffoldPlatform("internal-ai-apps", "Internal AI Apps", "internal", "In-house apps built on top of hosted models."),
  scaffoldPlatform("rag-systems", "RAG Systems", "pattern", "Retrieval-augmented generation systems across platforms."),
  scaffoldPlatform("ai-agents", "AI Agents", "pattern", "Agentic patterns with tools, memory, and planning."),
  scaffoldPlatform("ai-connectors", "AI Connectors", "pattern", "Cross-platform connectors that give AI systems access to enterprise data."),
];

export const platformsById: Record<string, PlatformDef> = Object.fromEntries(
  platforms.map((p) => [p.id, p]),
);