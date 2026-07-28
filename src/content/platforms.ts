import type { PlatformDef } from "./types";

export const platforms: PlatformDef[] = [
  {
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
    iamModel: ["Entra ID SSO (SAML/OIDC)", "Group-based licensing", "PIM for admin roles"],
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
    legal: ["Copilot Copyright Commitment", "Standard Microsoft OST + DPA apply"],
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
        prompt:
          "Copilot returns a document the requester should not see. What is the most likely root cause?",
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
  },
  {
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
        prompt:
          "Legal is worried about employees pasting client data into personal ChatGPT accounts. Which control most directly reduces this?",
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
        prompt:
          "A team shares a custom GPT built on confidential contract templates with the whole workspace. Biggest risk?",
        options: [
          { id: "a", label: "Model may hallucinate template names" },
          {
            id: "b",
            label: "Users outside the contracts team can retrieve contract content via the GPT",
            correct: true,
          },
          { id: "c", label: "Rate limits will be exceeded" },
          { id: "d", label: "Memory will retain the templates" },
        ],
        explanation:
          "GPT sharing scope is a data-access boundary. If confidential content is embedded, sharing widens who can retrieve it. Restrict scope or move to a dedicated workspace.",
        domain: "security",
      },
    ],
  },
  {
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
  },
  {
    id: "copilot-studio",
    name: "Copilot Studio",
    category: "saas-productivity",
    what: "Low-code builder for Microsoft 365 Copilot agents that can call connectors and take actions inside the tenant.",
    useCases: [
      "HR or IT service-desk agents grounded in a SharePoint knowledge base",
      "Approval workflows that call Power Automate flows",
      "Departmental assistants published to a Teams channel",
    ],
    adminResponsibilities: [
      "Control who can create and publish agents (maker governance)",
      "Approve connectors per environment via Power Platform DLP policies",
      "Decide authentication mode per agent — user or service",
      "Review published agents and their audience scope",
      "Ship agent transcripts to Purview for audit",
    ],
    architecture:
      "User → Teams/web channel → Copilot Studio agent → knowledge source (SharePoint, Dataverse, public site) + connector actions → model → response, executing under either the caller's delegated identity or a shared service connection.",
    securityModel: [
      "Power Platform DLP policies partition connectors into business/non-business",
      "Environment boundaries separate dev, test and production agents",
      "Authentication mode decides whose permissions the agent uses",
      "Purview audit captures agent conversations",
    ],
    iamModel: [
      "Entra ID SSO for makers and end users",
      "Per-agent authentication: user (delegated) vs service (shared)",
      "Security-group scoping controls who can chat with a published agent",
    ],
    dataModel: [
      "Knowledge sources are indexed per agent, not per user",
      "Transcripts stored in Dataverse in the environment's region",
      "A shared service connection flattens every caller to one permission set",
    ],
    privacy: [
      "Transcripts may contain personal data — set Dataverse retention deliberately",
      "Environment region determines data residency",
      "DSR requires searching Dataverse, not just mailboxes",
    ],
    legal: ["Covered by the Microsoft OST and DPA", "Third-party connectors add their own terms"],
    dataGovernance: [
      "A SharePoint knowledge source inherits that site's oversharing",
      "Every agent needs a named business owner and a review date",
    ],
    agentConnectorRisks: [
      "Service-principal authentication is the classic mistake: every user inherits the service account's access",
      "A maker can publish org-wide without security review unless publishing is restricted",
      "Connector actions turn a read-only assistant into one that writes",
    ],
    environments: ["Dev environment", "Test with pilot group", "Production with DLP enforced"],
    commonRisks: [
      "Agents authenticating as a shared service account",
      "No DLP policy, so any connector is available to any maker",
      "Published to the whole organisation on day one",
    ],
    fixes: [
      "Default agents to user (delegated) authentication",
      "Define DLP policies before opening maker access",
      "Gate publishing scope behind a review",
    ],
    evidence: [
      "DLP policy export",
      "Agent inventory with owners and auth mode",
      "Publishing approval record",
      "Purview transcript sample",
    ],
    scenarioId: "sc-copilot-studio-hr",
    quiz: [
      {
        id: "q-cs-1",
        type: "find-risk",
        prompt:
          "An HR agent is configured with a service connection so it can always reach the HR knowledge base. What is the risk?",
        options: [
          { id: "a", label: "Higher token cost" },
          {
            id: "b",
            label:
              "Every user inherits the service account's access, bypassing their own permissions",
            correct: true,
          },
          { id: "c", label: "Slower responses" },
          { id: "d", label: "The agent cannot be published to Teams" },
        ],
        explanation:
          "A shared service connection collapses all callers into one identity. Delegated (user) authentication keeps each caller's own permissions in force.",
        domain: "platform",
        competencyIds: ["arch.iam", "sec.data_exfil"],
      },
    ],
  },
  {
    id: "chatgpt-workspace-agents",
    name: "ChatGPT Workspace Agents",
    category: "saas-chat",
    what: "Custom GPTs and agents inside a ChatGPT Enterprise or Team workspace, with file knowledge, tools and third-party actions.",
    useCases: [
      "Team-specific assistants grounded in uploaded reference documents",
      "Agents that call an internal API through a custom action",
      "Shared prompt workflows standardised across a department",
    ],
    adminResponsibilities: [
      "Decide who may create and share GPTs, and at what scope",
      "Review custom actions and the domains they call",
      "Manage the workspace connector allowlist",
      "Pull the compliance API for conversation retention and eDiscovery",
      "Run SCIM deprovisioning so leavers lose access",
    ],
    architecture:
      "User → workspace GPT → uploaded file knowledge and/or custom action over HTTPS to a third-party API → model → response, with the action authenticating via its own stored key rather than the user.",
    securityModel: [
      "Workspace data excluded from model training by default",
      "SSO plus SCIM for lifecycle",
      "Compliance API exposes conversations for retention and legal hold",
      "Admin controls on GPT sharing scope",
    ],
    iamModel: [
      "SAML SSO through the identity provider",
      "SCIM provisioning and deprovisioning",
      "Workspace roles separate owners, admins and members",
    ],
    dataModel: [
      "Files uploaded to a GPT are readable by anyone who can use that GPT",
      "Conversation history retained per workspace policy",
      "Custom action requests leave the workspace boundary",
    ],
    privacy: [
      "Uploaded knowledge files are a common route for unreviewed personal data",
      "Confirm residency and retention before broad rollout",
      "DSR requires the compliance API, not just the UI",
    ],
    legal: [
      "Enterprise agreement and DPA cover the workspace",
      "Each custom action's endpoint carries its own contractual terms",
    ],
    dataGovernance: [
      "File knowledge has no ACL of its own — sharing the GPT shares the file",
      "Maintain an inventory of GPTs and their data sources",
    ],
    agentConnectorRisks: [
      "A custom action holds a static API key, so the agent acts with that key's authority for every user",
      "Actions can reach any allowed domain — egress is the real control point",
      "Org-wide sharing turns one team's knowledge file into a company-wide disclosure",
    ],
    environments: ["Personal draft", "Shared with a pilot team", "Workspace-wide publication"],
    commonRisks: [
      "Confidential documents uploaded as GPT knowledge and shared org-wide",
      "Custom actions authenticating with a long-lived key",
      "No SCIM, so leavers keep workspace access",
    ],
    fixes: [
      "Restrict org-wide sharing to reviewed GPTs",
      "Require short-lived, least-privilege credentials on actions",
      "Enable SCIM and test the leaver path",
    ],
    evidence: [
      "GPT inventory with sharing scope",
      "Custom action review record",
      "SCIM deprovisioning test",
      "Compliance API export sample",
    ],
    scenarioId: "sc-chatgpt-onboarding",
    quiz: [
      {
        id: "q-cwa-1",
        type: "choose-control",
        prompt:
          "A team wants a GPT grounded in a folder of contracts, shared with the whole company. What control matters most first?",
        options: [
          { id: "a", label: "Rate limiting" },
          {
            id: "b",
            label: "Reviewing the classification of the uploaded files and the sharing scope",
            correct: true,
          },
          { id: "c", label: "Choosing a larger model" },
          { id: "d", label: "Enabling streaming responses" },
        ],
        explanation:
          "GPT knowledge files carry no per-user ACL. Anyone who can use the GPT can reach the content, so classification and sharing scope are the deciding controls.",
        domain: "governance_grc",
        competencyIds: ["gov.risk_classification", "sec.data_exfil"],
      },
    ],
  },
  {
    id: "gemini-enterprise",
    name: "Gemini for Google Workspace",
    category: "saas-productivity",
    what: "Google's enterprise assistant grounded in Workspace content — Drive, Gmail, Docs and Chat — with admin controls in the Admin console.",
    useCases: [
      "Summarising long Drive documents and Gmail threads",
      "Drafting grounded in a shared drive",
      "Meeting notes and follow-ups in Meet",
    ],
    adminResponsibilities: [
      "License assignment through organisational units and groups",
      "Configure Drive sharing defaults before enabling grounding",
      "Set data-region policy for covered data",
      "Review audit logs in the security investigation tool",
      "Manage third-party extension availability",
    ],
    architecture:
      "User → Workspace app → Gemini → permission-aware retrieval over Drive/Gmail/Chat within the customer's tenant → model → grounded response with source links.",
    securityModel: [
      "Retrieval respects existing Drive and Gmail permissions",
      "Customer data not used to train models under the Workspace terms",
      "Context-Aware Access and 2SV apply to the underlying session",
      "Data regions policy for at-rest location",
    ],
    iamModel: [
      "Google identity or federated SSO (SAML)",
      "Organisational units scope feature rollout",
      "Groups drive license assignment",
    ],
    dataModel: [
      "Grounding inherits Drive link-sharing settings, including 'anyone with the link'",
      "Prompt and response handling governed by Workspace data terms",
      "Vault retention and hold apply to covered content",
    ],
    privacy: [
      "Data regions can pin at-rest storage to a jurisdiction",
      "Vault supports retention, hold and export for DSR",
      "Shared drives often hold personal data nobody has classified",
    ],
    legal: ["Workspace agreement and DPA", "Extension providers add separate terms"],
    dataGovernance: [
      "Broad link-sharing is the Workspace equivalent of SharePoint oversharing",
      "Run a sharing audit before switching grounding on",
    ],
    agentConnectorRisks: [
      "Third-party extensions widen the data path beyond Workspace",
      "Link-shared files become reachable through grounded answers",
    ],
    environments: ["Test organisational unit", "Pilot OU", "Full rollout"],
    commonRisks: [
      "Enabling grounding while 'anyone with the link' sharing is widespread",
      "No data-region policy for regulated content",
      "Extensions enabled by default",
    ],
    fixes: [
      "Audit and remediate link sharing before rollout",
      "Set data regions and confirm coverage",
      "Allowlist extensions explicitly",
    ],
    evidence: [
      "Drive sharing audit",
      "Data regions policy screenshot",
      "OU rollout plan",
      "Security investigation log sample",
    ],
    scenarioId: "sc-rag-sharepoint",
    quiz: [
      {
        id: "q-gem-1",
        type: "find-risk",
        prompt:
          "Before enabling Workspace grounding, which pre-existing condition most often causes unexpected disclosure?",
        options: [
          { id: "a", label: "Files shared by link to anyone in the company", correct: true },
          { id: "b", label: "Users on older browsers" },
          { id: "c", label: "Large PDF files" },
          { id: "d", label: "Multiple calendars per user" },
        ],
        explanation:
          "Grounding is permission-aware, so it surfaces exactly what sharing already allows. Over-broad link sharing becomes visible the moment retrieval starts.",
        domain: "platform",
        competencyIds: ["gov.registry", "sec.data_exfil"],
      },
    ],
  },
  {
    id: "claude-enterprise",
    name: "Claude Enterprise",
    category: "saas-chat",
    what: "Anthropic's enterprise workspace with SSO, SCIM, audit logging, Projects for shared context, and no training on business data.",
    useCases: [
      "Projects that give a team shared reference context",
      "Long-document analysis within a large context window",
      "Drafting and review workflows with citations back to supplied sources",
    ],
    adminResponsibilities: [
      "Configure SSO and SCIM through the identity provider",
      "Manage Projects and who can join them",
      "Review the audit log and export it to the SIEM",
      "Set data retention for conversations",
      "Govern any connected tools or MCP integrations",
    ],
    architecture:
      "User → Claude workspace → Project knowledge supplied by the team (plus any connected tools) → model → response, with organisation data excluded from training.",
    securityModel: [
      "Business data is not used to train models",
      "SSO with SCIM provisioning and deprovisioning",
      "Audit logging of workspace activity",
      "Role separation between owners, admins and members",
    ],
    iamModel: [
      "SAML SSO from the enterprise IdP",
      "SCIM for joiner/mover/leaver",
      "Project membership as the sharing boundary",
    ],
    dataModel: [
      "Project knowledge is visible to every member of that Project",
      "Conversation retention configurable at workspace level",
      "Uploaded documents live inside the workspace boundary",
    ],
    privacy: [
      "Confirm retention settings against the record-keeping policy",
      "Project uploads are a common route for unclassified personal data",
      "Export paths needed for DSR and legal hold",
    ],
    legal: ["Commercial terms plus DPA", "Confirm subprocessor list during vendor review"],
    dataGovernance: [
      "A Project is an access boundary — treat membership as an entitlement",
      "Give each Project a named owner and periodic recertification",
    ],
    agentConnectorRisks: [
      "Connected tools act with whatever credential they were given, so scope them narrowly",
      "Shared Project context means one member's upload is visible to all members",
    ],
    environments: ["Pilot workspace", "Departmental rollout", "Organisation-wide"],
    commonRisks: [
      "Projects created ad hoc with no owner and no recertification",
      "Sensitive documents uploaded to a broadly-shared Project",
      "SCIM not wired, so leavers retain access",
    ],
    fixes: [
      "Require an owner and a review date per Project",
      "Classify before upload; keep regulated content out of shared Projects",
      "Enable SCIM and test deprovisioning",
    ],
    evidence: [
      "SSO and SCIM configuration record",
      "Project inventory with owners",
      "Audit log export",
      "Retention setting screenshot",
    ],
    scenarioId: "sc-chatgpt-onboarding",
    quiz: [
      {
        id: "q-cla-1",
        type: "owner",
        prompt:
          "Who should own recertification of Project membership in a Claude Enterprise workspace?",
        options: [
          { id: "a", label: "The vendor" },
          {
            id: "b",
            label: "The named business owner of the Project, with IAM support",
            correct: true,
          },
          { id: "c", label: "Any workspace member" },
          { id: "d", label: "Nobody — SSO handles it" },
        ],
        explanation:
          "A Project is an access boundary. SSO authenticates, but only the business owner knows whether a given member still needs the shared context.",
        domain: "governance_grc",
        competencyIds: ["gov.recertification", "plat.rbac"],
      },
    ],
  },
  {
    id: "claude-code",
    name: "Claude Code",
    category: "coding-assistant",
    what: "Terminal-based coding agent with repository context, file editing and tool execution, run on a developer machine or in CI.",
    useCases: [
      "Refactoring and test generation across a repository",
      "Automated fixes driven from CI failures",
      "Codebase exploration and architectural questions",
    ],
    adminResponsibilities: [
      "Decide which repositories the agent may operate on",
      "Control credentials available in the shell it inherits",
      "Set policy for autonomous versus review-gated commits",
      "Manage MCP server allowlists",
      "Ensure secret scanning runs on generated code",
    ],
    architecture:
      "Developer → local CLI with repository and shell access → model → proposed edits and tool calls, executing with the developer's own machine credentials unless deliberately sandboxed.",
    securityModel: [
      "Runs with the privileges of the invoking shell — the blast radius is the developer's access",
      "Permission prompts gate file writes and command execution",
      "Enterprise deployments can route through a managed gateway",
    ],
    iamModel: [
      "Authenticates the developer to the vendor",
      "Repository access comes from existing git credentials",
      "CI usage should use a scoped machine identity, not a personal token",
    ],
    dataModel: [
      "Repository contents form the working context",
      "Generated code inherits the licence and provenance questions of its inputs",
      "Session transcripts may contain source and secrets",
    ],
    privacy: [
      "Repositories can contain personal data in fixtures and test data",
      "Confirm what leaves the machine and under what terms",
    ],
    legal: [
      "Confirm output ownership and IP terms",
      "Open-source licence obligations still apply to generated code",
    ],
    dataGovernance: [
      "Treat the agent as a developer identity — it needs the same review path",
      "Never let it hold long-lived production credentials",
    ],
    agentConnectorRisks: [
      "An agent with shell access and a cloud credential can reach production",
      "MCP servers extend reach; each one is a new trust relationship",
      "Prompt injection from repository content or fetched pages can redirect tool use",
    ],
    environments: [
      "Local dev only",
      "CI with a scoped machine identity",
      "No direct production credential",
    ],
    commonRisks: [
      "Running with cloud admin credentials present in the environment",
      "Auto-approving all tool calls",
      "Generated code merged without review or secret scanning",
    ],
    fixes: [
      "Separate development credentials from production",
      "Keep review gates on writes and commands",
      "Run secret scanning and SAST on agent-authored changes",
    ],
    evidence: [
      "Credential scoping record",
      "Branch protection and review policy",
      "Secret-scanning results",
      "MCP allowlist",
    ],
    scenarioId: "sc-agent-overprivilege",
    quiz: [
      {
        id: "q-cc-1",
        type: "gate",
        prompt:
          "A team wants a coding agent to run in CI and open pull requests. What gates that safely?",
        options: [
          {
            id: "a",
            label: "A scoped machine identity plus mandatory human review on the PR",
            correct: true,
          },
          { id: "b", label: "A personal access token from a senior engineer" },
          { id: "c", label: "Allowing direct pushes to the default branch" },
          { id: "d", label: "Disabling branch protection for speed" },
        ],
        explanation:
          "The agent should hold its own least-privilege identity, and its output should enter through the same review gate as any other contributor's.",
        domain: "security",
        competencyIds: ["sec.ssdlc", "arch.iam", "eng.cicd"],
      },
    ],
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    category: "coding-assistant",
    what: "OpenAI's coding agent for engineering workflows, running tasks against a repository in a managed sandbox and proposing changes.",
    useCases: [
      "Delegating well-scoped tasks that end in a pull request",
      "Bulk refactors and dependency upgrades",
      "Writing tests against existing behaviour",
    ],
    adminResponsibilities: [
      "Connect repositories and scope which the agent may touch",
      "Decide network egress policy for the task sandbox",
      "Set review requirements on agent-authored pull requests",
      "Manage workspace membership and roles",
    ],
    architecture:
      "Developer → task description → sandboxed environment with a repository checkout → model runs commands and edits files → pull request for human review.",
    securityModel: [
      "Work happens in an isolated sandbox rather than on a developer machine",
      "Network access to the sandbox is a policy decision",
      "Output arrives as a reviewable change, not a direct push",
    ],
    iamModel: [
      "Workspace SSO for people",
      "A dedicated integration identity for repository access",
      "Repository scoping limits reach",
    ],
    dataModel: [
      "Repository contents are the working set",
      "Task logs record commands and diffs",
      "Enterprise terms govern training exclusion",
    ],
    privacy: ["Check for personal data in fixtures", "Confirm log retention for task history"],
    legal: ["Output ownership and IP indemnity terms", "Dependency licence obligations persist"],
    dataGovernance: [
      "Agent-authored changes need the same provenance trail as human ones",
      "Keep an inventory of connected repositories",
    ],
    agentConnectorRisks: [
      "Unrestricted sandbox egress allows dependency confusion and exfiltration",
      "A broadly-scoped repository integration reaches far more than the task needs",
    ],
    environments: ["Sandbox task execution", "Pull request review", "Merge via normal CI gates"],
    commonRisks: [
      "Repository integration granted org-wide instead of per-repository",
      "Unrestricted network egress from the task sandbox",
      "Auto-merge on agent pull requests",
    ],
    fixes: [
      "Scope the integration to the repositories in play",
      "Restrict sandbox egress to a package-registry allowlist",
      "Require human approval before merge",
    ],
    evidence: ["Repository scoping record", "Egress policy", "PR review policy", "Task log sample"],
    scenarioId: "sc-agent-overprivilege",
    quiz: [
      {
        id: "q-cx-1",
        type: "choose-control",
        prompt:
          "Which control most reduces the risk of a coding agent's sandbox pulling a malicious dependency?",
        options: [
          { id: "a", label: "A larger model" },
          {
            id: "b",
            label: "Egress restricted to an approved internal package registry",
            correct: true,
          },
          { id: "c", label: "More verbose logging" },
          { id: "d", label: "Longer task timeouts" },
        ],
        explanation:
          "Dependency confusion is a network-path problem. Constraining where the sandbox may fetch from removes the attack, whereas detection after the fact does not.",
        domain: "security",
        competencyIds: ["sec.network", "eng.cicd", "sec.ssdlc"],
      },
    ],
  },
  {
    id: "replit",
    name: "Replit",
    category: "coding-assistant",
    what: "Cloud development environment with an AI agent that can scaffold, edit and deploy applications directly from a browser.",
    useCases: [
      "Rapid prototyping and internal tools",
      "Teaching environments and coding exercises",
      "Quick proofs of concept before a formal build",
    ],
    adminResponsibilities: [
      "Manage the team account and membership",
      "Set deployment and public-visibility policy",
      "Govern secrets stored in the environment",
      "Decide what data classes may enter a hosted workspace",
    ],
    architecture:
      "User → browser workspace → agent edits files and runs the project in a hosted container → optional public deployment, with secrets held in the workspace's own store.",
    securityModel: [
      "Workspace isolation between projects",
      "Secrets manager separate from source files",
      "Visibility control per project — public or private",
    ],
    iamModel: [
      "Team accounts with role assignment",
      "SSO on business plans",
      "Project-level collaborator permissions",
    ],
    dataModel: [
      "Project files and any uploaded data live in the hosted environment",
      "Deployments may expose the project publicly",
    ],
    privacy: [
      "Prototypes routinely pull in real data that was never approved for a hosted environment",
      "Confirm residency before any regulated use",
    ],
    legal: ["Vendor terms for hosting and deployment", "Confirm ownership of generated code"],
    dataGovernance: [
      "Treat prototypes as unapproved systems until reviewed",
      "Prevent production data reaching a prototype environment",
    ],
    agentConnectorRisks: [
      "An agent that can deploy can expose an internal tool to the internet",
      "Secrets pasted into files rather than the secrets store leak with the repository",
    ],
    environments: [
      "Prototype only",
      "Internal demo with synthetic data",
      "Rebuild in a governed environment before production",
    ],
    commonRisks: [
      "Production data copied into a prototype",
      "Accidentally public deployments",
      "Credentials committed into project files",
    ],
    fixes: [
      "Mandate synthetic data for prototypes",
      "Default projects to private and review before deploying",
      "Use the secrets store, and scan for committed keys",
    ],
    evidence: [
      "Prototype data-use attestation",
      "Deployment visibility review",
      "Secret-scanning result",
    ],
    scenarioId: "sc-bedrock-case-assistant",
    quiz: [
      {
        id: "q-rep-1",
        type: "gate",
        prompt:
          "A prototype built in a hosted AI workspace is proving useful. What must happen before it serves real users?",
        options: [
          { id: "a", label: "Nothing — it already works" },
          {
            id: "b",
            label:
              "Rebuild or promote it into a governed environment with real identity, logging and data controls",
            correct: true,
          },
          { id: "c", label: "Add a larger model" },
          { id: "d", label: "Make the project public for feedback" },
        ],
        explanation:
          "Prototype environments lack the identity, logging and data controls production requires. The prototype proves the idea; it does not inherit the right to run it.",
        domain: "architecture",
        competencyIds: ["arch.inhouse", "gov.approval_workflow"],
      },
    ],
  },
  {
    id: "vertex-ai",
    name: "Google Vertex AI",
    category: "cloud-ai",
    what: "Google Cloud's platform for building AI applications, with model serving, grounding over enterprise data, and agent tooling.",
    useCases: [
      "Grounded search and answer apps over BigQuery and Cloud Storage",
      "Custom agents calling internal APIs",
      "Batch inference over structured data",
    ],
    adminResponsibilities: [
      "Design the project and folder layout that scopes blast radius",
      "Assign IAM roles for model, data and deployment access",
      "Configure VPC Service Controls around data perimeters",
      "Set up Cloud Logging and Cloud Monitoring",
      "Manage CMEK keys where required",
    ],
    architecture:
      "App → Vertex AI endpoint inside the customer's Google Cloud project → grounding over BigQuery / Cloud Storage / Vertex AI Search → model → response, with IAM and VPC Service Controls defining the perimeter.",
    securityModel: [
      "IAM at project, dataset and endpoint level",
      "VPC Service Controls create a data perimeter against exfiltration",
      "CMEK for customer-managed encryption",
      "Private endpoints keep traffic off the public internet",
    ],
    iamModel: [
      "Google Cloud IAM roles and service accounts",
      "Workload Identity Federation instead of static keys",
      "Least privilege per service account, not per project",
    ],
    dataModel: [
      "Grounding sources retain their own IAM — the app must not bypass it",
      "Prediction requests and responses can be logged; decide deliberately",
      "Region selection controls processing and storage location",
    ],
    privacy: [
      "Region and CMEK choices carry the residency story",
      "Request logging may capture personal data",
      "Retention on logs and datasets needs an explicit decision",
    ],
    legal: ["Google Cloud terms and DPA", "Model-specific terms for third-party models"],
    dataGovernance: [
      "BigQuery datasets need owners and classification before grounding",
      "Prediction logging is a data flow that belongs in the record",
    ],
    agentConnectorRisks: [
      "A service account shared across users flattens every caller's permissions",
      "Agent tools calling internal APIs need their own scoped identity",
      "Without VPC Service Controls, a compromised job can exfiltrate to any bucket",
    ],
    environments: ["Sandbox project", "Non-production project", "Production with VPC-SC enforced"],
    commonRisks: [
      "Over-broad service account roles such as project Editor",
      "No VPC Service Controls, so data can leave the perimeter",
      "Prediction logs capturing sensitive prompts without retention",
    ],
    fixes: [
      "Grant narrow predefined or custom roles per service account",
      "Enforce VPC Service Controls around the data perimeter",
      "Decide and document logging and retention",
    ],
    evidence: [
      "IAM policy export",
      "VPC Service Controls perimeter config",
      "CMEK key inventory",
      "Logging and retention decision record",
    ],
    scenarioId: "sc-bedrock-case-assistant",
    quiz: [
      {
        id: "q-vx-1",
        type: "choose-control",
        prompt:
          "Which control most directly limits exfiltration of BigQuery data by a compromised Vertex AI workload?",
        options: [
          {
            id: "a",
            label: "VPC Service Controls perimeter around the projects and datasets",
            correct: true,
          },
          { id: "b", label: "A larger model quota" },
          { id: "c", label: "Enabling response streaming" },
          { id: "d", label: "Adding more logging" },
        ],
        explanation:
          "VPC Service Controls stop data crossing the perimeter even when credentials are valid. Logging tells you afterwards; the perimeter prevents it.",
        domain: "security",
        competencyIds: ["sec.network", "sec.data_exfil", "arch.iam"],
      },
    ],
  },
  {
    id: "aws-bedrock",
    name: "AWS Bedrock",
    category: "cloud-ai",
    what: "AWS's managed foundation-model service with knowledge bases, agents and guardrails, running inside the customer's AWS account.",
    useCases: [
      "Retrieval applications over an S3 knowledge base",
      "Bedrock Agents orchestrating calls to internal Lambda functions",
      "Model choice across providers behind one API",
    ],
    adminResponsibilities: [
      "Scope IAM policies for model invocation and knowledge-base access",
      "Configure Bedrock Guardrails for content and topic policy",
      "Set up PrivateLink endpoints to keep traffic internal",
      "Enable model invocation logging to CloudWatch or S3",
      "Manage KMS keys for encryption at rest",
    ],
    architecture:
      "App → Bedrock runtime in the customer's AWS account → knowledge base backed by S3 and a vector store → optional agent action groups calling Lambda → model → response, with IAM and Guardrails enforcing the boundary.",
    securityModel: [
      "IAM policies gate model invocation and data access",
      "Guardrails apply content filters, denied topics and PII handling",
      "PrivateLink keeps calls off the public internet",
      "KMS encryption for knowledge-base and log data",
    ],
    iamModel: [
      "IAM roles per workload rather than shared users",
      "Resource policies on the knowledge base",
      "Action groups execute under their own role",
    ],
    dataModel: [
      "S3 knowledge base is indexed wholesale — object ACLs are not per-user retrieval filters",
      "Model invocation logging is opt-in",
      "Customer data stays in the account and is not used to train base models",
    ],
    privacy: [
      "Guardrails can mask or block PII in prompts and responses",
      "Region selection determines processing location",
      "Invocation logs may capture personal data",
    ],
    legal: ["AWS customer agreement and DPA", "Per-model terms for third-party providers"],
    dataGovernance: [
      "Every S3 prefix in a knowledge base needs a classification and owner",
      "Chunk-level access control must be designed; it is not inherited",
    ],
    agentConnectorRisks: [
      "Agent action groups can take real actions — scope each Lambda's role tightly",
      "A knowledge base ingesting a whole bucket ignores who could see which object",
      "Without Guardrails, injected instructions in retrieved text reach the model unfiltered",
    ],
    environments: [
      "Dev account",
      "Staging with synthetic data",
      "Production with PrivateLink and Guardrails",
    ],
    commonRisks: [
      "Ingesting an entire S3 bucket without per-document permission design",
      "No Guardrails configured, so no content or topic policy exists",
      "Model invocation logging disabled, leaving no evidence trail",
    ],
    fixes: [
      "Filter ingestion by classification and design query-time access control",
      "Configure Guardrails including PII handling before rollout",
      "Enable invocation logging with defined retention",
    ],
    evidence: [
      "IAM policy for the workload role",
      "Guardrail configuration export",
      "Knowledge-base source inventory",
      "Invocation log sample",
    ],
    scenarioId: "sc-bedrock-case-assistant",
    quiz: [
      {
        id: "q-br-1",
        type: "find-risk",
        prompt:
          "A knowledge base is built from an entire S3 bucket containing case files with mixed sensitivity. What breaks first?",
        options: [
          { id: "a", label: "Latency" },
          {
            id: "b",
            label:
              "Retrieval returns content the caller was never entitled to, because indexing ignored object-level permissions",
            correct: true,
          },
          { id: "c", label: "Embedding cost" },
          { id: "d", label: "Region availability" },
        ],
        explanation:
          "Ingestion flattens the corpus. Unless access is enforced at query time using the caller's identity, the index becomes a route around S3 permissions.",
        domain: "agent_rag_connector",
        competencyIds: ["sec.permission_trimming", "arch.rag", "sec.data_exfil"],
      },
    ],
  },
  {
    id: "internal-ai-apps",
    name: "Internal AI Applications",
    category: "internal",
    what: "Applications your own teams build on hosted models — the category where the enterprise owns the whole architecture and every control decision.",
    useCases: [
      "Domain workflows too specific for a SaaS assistant",
      "Applications needing custom retrieval or business logic",
      "Systems that must run inside an existing compliance boundary",
    ],
    adminResponsibilities: [
      "Own identity, retrieval, logging and rate limiting in the application itself",
      "Manage model credentials and rotation",
      "Define the promotion path from lab to production",
      "Instrument evaluation and monitoring",
    ],
    architecture:
      "User → your frontend → your backend enforcing authorisation → retrieval layer → model API → response, where every control that a SaaS product would provide is now yours to build.",
    securityModel: [
      "Authorisation is enforced by your backend, not by the model",
      "Secrets held in a managed vault, never in application config",
      "Egress control between the app and the model provider",
      "Input and output validation around the model call",
    ],
    iamModel: [
      "Application SSO for end users",
      "Workload identity for the backend's model credential",
      "Never pass the end-user's token to the model provider",
    ],
    dataModel: [
      "You decide prompt and response retention",
      "Retrieval must filter by the caller's entitlements before the model sees the context",
      "Evaluation datasets need the same classification as production data",
    ],
    privacy: [
      "Purpose limitation is your responsibility to enforce",
      "Retention and deletion must reach prompts, logs and vector stores alike",
    ],
    legal: ["Provider terms for the model API", "Your own terms with the users of the application"],
    dataGovernance: [
      "The app needs an owner, a register entry and a review cycle like any other system",
      "Vector stores are a data store and inherit the same obligations",
    ],
    agentConnectorRisks: [
      "Any tool the app exposes to the model becomes an action the model can take",
      "Retrieval without permission filtering turns the vector store into a bypass",
    ],
    environments: ["AI lab", "Dev", "UAT with representative data", "Production"],
    commonRisks: [
      "Authorisation checked in the frontend only",
      "Model credential shared across environments",
      "No evaluation, so regressions ship silently",
    ],
    fixes: [
      "Enforce authorisation server-side on every retrieval",
      "Separate credentials per environment with rotation",
      "Build an eval suite with regression gates before launch",
    ],
    evidence: [
      "Architecture document with trust boundaries",
      "Authorisation test results",
      "Eval suite and thresholds",
      "Secret rotation record",
    ],
    scenarioId: "sc-bedrock-case-assistant",
    quiz: [
      {
        id: "q-ia-1",
        type: "owner",
        prompt:
          "In an internally-built AI application, who enforces that a user only retrieves what they may see?",
        options: [
          { id: "a", label: "The model provider" },
          {
            id: "b",
            label: "Your backend, at query time, using the caller's identity",
            correct: true,
          },
          { id: "c", label: "The vector database vendor" },
          { id: "d", label: "The frontend" },
        ],
        explanation:
          "The model has no concept of entitlement and the frontend can be bypassed. Authorisation belongs in the server-side retrieval path.",
        domain: "architecture",
        competencyIds: ["sec.permission_trimming", "arch.iam", "arch.inhouse"],
      },
    ],
  },
  {
    id: "rag-systems",
    name: "RAG Systems",
    category: "pattern",
    what: "The retrieval-augmented generation pattern: ground a model in your own corpus so answers cite real documents instead of recalled training data.",
    useCases: [
      "Policy and knowledge assistants over an internal corpus",
      "Support agents grounded in product documentation",
      "Research tools over regulated document sets",
    ],
    adminResponsibilities: [
      "Decide which sources are eligible for ingestion",
      "Own chunking, embedding and index refresh",
      "Enforce access control at query time",
      "Measure retrieval quality and groundedness",
    ],
    architecture:
      "Query → embed → vector search filtered by the caller's entitlements → retrieved chunks assembled into context → model → grounded answer with citations back to source documents.",
    securityModel: [
      "Query-time ACL enforcement, not ingest-time filtering alone",
      "Retrieved content treated as untrusted input, never as instructions",
      "Source metadata carried through so citations can be checked",
    ],
    iamModel: [
      "The caller's identity must reach the retrieval filter",
      "Index metadata carries the ACL used at query time",
    ],
    dataModel: [
      "Chunk size trades recall against cost and precision",
      "Deletion must propagate to the index, not just the source",
      "Stale indexes serve content that was already revoked",
    ],
    privacy: [
      "The vector store is a copy of your corpus and inherits its obligations",
      "Deletion requests must reach embeddings as well as documents",
    ],
    legal: ["Source licensing carries into generated answers", "Citation supports defensibility"],
    dataGovernance: [
      "Every source needs a named owner before ingestion",
      "Reindexing cadence is a governance decision, not just an engineering one",
    ],
    agentConnectorRisks: [
      "Indirect prompt injection: a document in the corpus carries instructions the model then follows",
      "Retrieval that ignores identity becomes a permission bypass",
    ],
    environments: ["Lab with synthetic corpus", "UAT with representative data", "Production"],
    commonRisks: [
      "Filtering at ingest only, so one index serves everyone",
      "No sanitisation of retrieved text before it enters the prompt",
      "Deletions never propagating to embeddings",
    ],
    fixes: [
      "Bind retrieval to the caller's identity at query time",
      "Neutralise instructions in retrieved chunks and isolate tool-call authority to the user turn",
      "Wire deletion through to the index with verification",
    ],
    evidence: [
      "Access-control test showing cross-user isolation",
      "Injection resistance evaluation",
      "Deletion propagation test",
      "Groundedness metrics",
    ],
    scenarioId: "sc-prompt-injection-rag",
    quiz: [
      {
        id: "q-rag-1",
        type: "find-risk",
        prompt: "Why is a retrieved document chunk treated as untrusted input?",
        options: [
          { id: "a", label: "It may be stale" },
          {
            id: "b",
            label:
              "It can carry instructions that the model follows — source trust is not content trust",
            correct: true,
          },
          { id: "c", label: "It increases token cost" },
          { id: "d", label: "It may be in another language" },
        ],
        explanation:
          "Indirect prompt injection works precisely because the corpus is trusted. The document came from a trusted site; the text inside it is still attacker-controlled.",
        domain: "agent_rag_connector",
        competencyIds: ["sec.indirect_injection", "sec.rag_poisoning", "arch.rag"],
      },
    ],
  },
  {
    id: "ai-agents",
    name: "AI Agents",
    category: "pattern",
    what: "The agentic pattern: a model given tools, memory and a goal, allowed to take actions rather than only produce text.",
    useCases: [
      "Ticket triage that reads, classifies and updates records",
      "Operational runbooks executed with human approval",
      "Multi-step research and reconciliation tasks",
    ],
    adminResponsibilities: [
      "Define the tool allowlist and each tool's scope",
      "Decide which actions require human approval",
      "Build and test a kill switch",
      "Set rate limits and spend caps",
      "Log every tool call with its arguments",
    ],
    architecture:
      "Goal → planner → tool selection → tool execution under a scoped identity → observation fed back → repeat until done or halted, with approval gates on any irreversible action.",
    securityModel: [
      "Least-privilege identity per agent, never a shared admin credential",
      "Read and write tools separated, with writes gated",
      "Kill switch that actually revokes the credential, not just hides the button",
      "Full tool-call audit trail",
    ],
    iamModel: [
      "The agent is an identity and needs joiner/mover/leaver handling",
      "Delegated user identity where the action is on a user's behalf",
      "Ownership recorded so an orphaned agent is detectable",
    ],
    dataModel: [
      "Memory persists across turns and can retain sensitive content",
      "Tool outputs enter the context as untrusted input",
    ],
    privacy: [
      "Agent memory is a data store with retention obligations",
      "Actions taken on personal data need a lawful basis like any processing",
    ],
    legal: ["Accountability for actions taken", "Contractual limits on automated decision-making"],
    dataGovernance: [
      "Register every agent with an owner and a review date",
      "Offboarding a person must include the agents they owned",
    ],
    agentConnectorRisks: [
      "Over-broad tool scope turns a small compromise into a large one",
      "Injection through retrieved or fetched content redirects tool use",
      "Memory poisoning persists an attacker's instruction across sessions",
    ],
    environments: ["Read-only shadow mode", "Write with approval", "Autonomous within limits"],
    commonRisks: [
      "Agents running with a shared service account",
      "No kill switch tested under load",
      "Write actions available before read behaviour was validated",
    ],
    fixes: [
      "Scope tools to the minimum the task needs",
      "Require approval for irreversible actions",
      "Test the kill switch and measure time to containment",
    ],
    evidence: [
      "Agent register with owners",
      "Tool scope review",
      "Kill-switch test result",
      "Tool-call audit sample",
    ],
    scenarioId: "sc-agent-overprivilege",
    quiz: [
      {
        id: "q-ag-1",
        type: "gate",
        prompt:
          "An agent can read tickets, send email and issue refunds. Which capability should be gated first?",
        options: [
          { id: "a", label: "Reading tickets" },
          {
            id: "b",
            label: "Issuing refunds — it is irreversible and financially material",
            correct: true,
          },
          { id: "c", label: "Summarising threads" },
          { id: "d", label: "Searching documentation" },
        ],
        explanation:
          "Gate by reversibility and blast radius. Reads are recoverable; an irreversible financial action needs human approval before it executes.",
        domain: "agent_rag_connector",
        competencyIds: ["sec.agent_tool_misuse", "sec.blast_radius", "plr.hitl"],
      },
    ],
  },
  {
    id: "ai-connectors",
    name: "AI Connectors",
    category: "pattern",
    what: "The integrations that give AI systems reach into enterprise data and actions — OAuth apps, Graph connectors, MCP servers and plugins.",
    useCases: [
      "Grounding an assistant in a third-party system of record",
      "Letting an agent create or update records in another application",
      "Unifying search across multiple SaaS products",
    ],
    adminResponsibilities: [
      "Review requested OAuth scopes against what the use case needs",
      "Decide the consent model — admin consent or per-user",
      "Manage token storage, lifetime and rotation",
      "Maintain an inventory of connected applications",
      "Revoke connectors on offboarding",
    ],
    architecture:
      "AI system → connector holding an OAuth grant → third-party API → data returned into the model's context, where the grant's scope defines everything the AI can reach.",
    securityModel: [
      "Scope minimisation at grant time is the primary control",
      "Admin consent applies tenant-wide and should be a reviewed decision",
      "Tokens stored in a secret vault with rotation",
      "Revocation path tested, not assumed",
    ],
    iamModel: [
      "Delegated permissions act as the user; application permissions act as the app",
      "Application permissions bypass per-user entitlements entirely",
      "Each connector is an identity requiring ownership",
    ],
    dataModel: [
      "The connector can read whatever its scope allows, regardless of the requester",
      "Data crossing the connector leaves one system's controls and enters another's",
    ],
    privacy: [
      "Cross-system data flows need mapping for the privacy record",
      "Third-party processors need their own assessment",
    ],
    legal: [
      "Each connector provider adds contractual terms",
      "Data transfer may cross jurisdictions",
    ],
    dataGovernance: [
      "An inventory of connectors, scopes and owners is the minimum viable control",
      "Recertify scopes on a schedule; they only ever grow",
    ],
    agentConnectorRisks: [
      "Consent phishing: a legitimate-looking app requests broad scopes and receives a durable grant",
      "Application permissions turn a per-user assistant into a tenant-wide reader",
      "Refresh tokens outlive the person who approved them",
    ],
    environments: [
      "Sandbox tenant",
      "Pilot with limited scopes",
      "Production with reviewed consent",
    ],
    commonRisks: [
      "Admin consent granted for read-all scopes to satisfy one narrow use case",
      "Tokens stored in application configuration rather than a vault",
      "No revocation on offboarding, leaving orphaned grants",
    ],
    fixes: [
      "Request the narrowest scope that satisfies the use case, and re-review on change",
      "Restrict who can grant admin consent, and require a review record",
      "Vault tokens, rotate them, and test revocation",
    ],
    evidence: [
      "Connector inventory with scopes and owners",
      "Consent approval record",
      "Token rotation evidence",
      "Revocation test result",
    ],
    scenarioId: "sc-offboarding-agent-owner",
    quiz: [
      {
        id: "q-con-1",
        type: "choose-control",
        prompt:
          "A vendor connector requests application-level read access to all mailboxes to support one team's assistant. What is the right response?",
        options: [
          { id: "a", label: "Grant it — admin consent is faster than per-user consent" },
          {
            id: "b",
            label:
              "Refuse, and require delegated permissions scoped to the team that actually needs it",
            correct: true,
          },
          { id: "c", label: "Grant it but enable more logging" },
          { id: "d", label: "Grant it in production only" },
        ],
        explanation:
          "Application permissions ignore per-user entitlements, so the grant reaches every mailbox regardless of who asks. Delegated, scoped permissions keep the user's own access in force.",
        domain: "agent_rag_connector",
        competencyIds: ["sec.oauth", "arch.connectors", "arch.iam"],
      },
    ],
  },
];

export const platformsById: Record<string, PlatformDef> = Object.fromEntries(
  platforms.map((p) => [p.id, p]),
);
