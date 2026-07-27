import type { LabDef, LabModule } from "./types";

const scaffoldLab = (
  id: string,
  name: string,
  tagline: string,
  mission: string,
  domain: LabDef["domain"],
  seedModules: LabModule[] = [],
): LabDef => ({
  id,
  name,
  tagline,
  mission,
  domain,
  modules: seedModules,
  depth: "scaffold",
});

const seedModule = (id: string, title: string, body: string): LabModule => ({
  id,
  title,
  lesson: {
    simple: body,
    enterprise: `In an enterprise, ${body.toLowerCase()}`,
    deepDive: `Deep dive: expand this module with concrete configurations, code, and diagrams. Suggested outline: (1) what problem this solves, (2) reference architecture, (3) failure modes, (4) required controls, (5) evidence.`,
    mistakes: ["Skipping this control", "Assuming the default is safe"],
    risks: ["Data leak", "Bypass of intended policy"],
    fixes: ["Apply the control", "Add detection", "Document decision"],
    evidence: ["Configuration export", "Test result", "Review sign-off"],
  },
  quiz: [],
});

// ---------- DEEP LAB: SaaS AI Onboarding (Platform Admin) ----------
const saasOnboarding: LabDef = {
  id: "saas-onboarding",
  name: "SaaS AI Onboarding Simulator",
  tagline: "Onboard SaaS AI platforms safely and defensibly.",
  mission:
    "Walk through admin, security, privacy, legal, operations, and FinOps for onboarding a SaaS AI platform end-to-end.",
  domain: "platform",
  depth: "deep",
  modules: [
    {
      id: "sso-scim-rbac",
      title: "SSO, SCIM, RBAC — the identity baseline",
      lesson: {
        simple:
          "SSO logs users in with the corporate identity provider. SCIM keeps the user list in sync. RBAC controls what each user can do inside the platform.",
        enterprise:
          "Every enterprise SaaS AI onboarding begins with SAML/OIDC SSO enforced via IdP conditional access, SCIM provisioning tied to HR/IdP lifecycle, and platform RBAC mapped to IdP security groups. Nothing else is defensible.",
        deepDive:
          "SAML/OIDC federates authentication; SCIM v2 pushes user create/update/deactivate events; platform RBAC then maps groups to feature entitlements. Rotate SAML signing certs, monitor SCIM failure webhooks, and treat platform-native admins as break-glass only. Enforce domain capture where the vendor supports it to eliminate personal-account shadow AI.",
        diagram: `IdP (Entra/Okta) --SAML/OIDC--> SaaS AI\n       |\n       +--SCIM--> user directory sync\n       |\n       +--Groups--> RBAC roles inside SaaS AI`,
        mistakes: [
          "Enabling SSO without SCIM (drift within 30 days)",
          "Granting platform-native admin to individuals",
          "Skipping domain capture",
        ],
        risks: [
          "Personal accounts as shadow AI",
          "Orphaned accounts after termination",
          "Admin sprawl",
        ],
        fixes: [
          "SCIM with automatic deprovisioning",
          "Group-scoped RBAC only",
          "PIM/JIT for admin roles",
          "Verified domain / domain capture",
        ],
        evidence: [
          "SSO metadata + cert rotation policy",
          "SCIM run log",
          "RBAC matrix (group → role)",
          "Domain-capture confirmation",
        ],
      },
      quiz: [
        {
          id: "q-sso-1",
          type: "choose-control",
          prompt:
            "You enabled SSO 6 months ago; termed users still appear as active in the SaaS AI platform. Root cause?",
          options: [
            { id: "a", label: "SAML cert expired" },
            { id: "b", label: "SCIM not enabled or failing silently", correct: true },
            { id: "c", label: "MFA disabled" },
            { id: "d", label: "Group policy misconfigured" },
          ],
          explanation: "SSO handles login. SCIM handles lifecycle. Without SCIM, deprovisioning drifts.",
          domain: "platform",
        },
      ],
      scenarioId: "sc-chatgpt-onboarding",
    },
    {
      id: "features-connectors",
      title: "Feature and connector enablement",
      lesson: {
        simple:
          "SaaS AI platforms ship with many features on by default. Some leak data. You must decide which to enable and for whom.",
        enterprise:
          "Every feature is a policy decision: memory, GPTs/agents, code interpreter, plugins, third-party connectors, browsing. Default-on is not safe. Approve features per group with an owner and a review cadence.",
        deepDive:
          "Publish a feature register: name, description, data path, risk tier, owner, enabled groups, review cadence, evidence. Treat each connector as a delegated identity — record OAuth scopes, source ACL model, and audit log destination. Any connector that ingests third-party data is a new data source that must go through data governance.",
        mistakes: [
          "Leaving memory on by default",
          "Approving connectors org-wide",
          "No feature register — decisions live in Slack",
        ],
        risks: ["Cross-user data leak via memory", "OAuth scope creep", "Data exfil via plugin"],
        fixes: [
          "Disable memory unless justified",
          "Scope connectors to groups",
          "Publish feature register",
          "Log tool calls to SIEM",
        ],
        evidence: ["Feature register", "Connector scope screenshots", "Audit-log sample"],
      },
      quiz: [
        {
          id: "q-feat-1",
          type: "find-risk",
          prompt: "A vendor added a new memory feature default-on last release. Biggest risk?",
          options: [
            { id: "a", label: "Latency" },
            { id: "b", label: "Sensitive context persists across sessions and leaks between users if sharing is misused", correct: true },
            { id: "c", label: "Storage cost" },
            { id: "d", label: "None" },
          ],
          explanation:
            "Default-on memory changes the data-retention model without you noticing. Read release notes weekly and re-review defaults.",
          domain: "platform",
        },
      ],
    },
    {
      id: "audit-logs-cost",
      title: "Audit logs, usage, cost",
      lesson: {
        simple: "You cannot govern what you cannot see. Ship logs to SIEM. Watch cost.",
        enterprise:
          "Configure the platform's audit API (Compliance API, Purview, Admin API), stream to SIEM, build detections for suspicious activity, and wire cost telemetry into FinOps dashboards.",
        deepDive:
          "Detections to build: unusual admin role grants, mass GPT/agent sharing changes, connector re-consent, spike in tool calls per user, off-hours access from new geos. Cost: per-workspace token spend, per-user, per-connector; alert at 80% of budget with automatic downgrade path.",
        mistakes: ["Logs enabled but not ingested", "No cost budget", "No detections"],
        risks: ["Missed incidents", "Runaway bill", "No forensic timeline"],
        fixes: ["SIEM ingest", "Detections", "FinOps alerts + hard caps where supported"],
        evidence: ["SIEM log sample", "Detection catalog", "Budget alert config"],
      },
      quiz: [
        {
          id: "q-log-1",
          type: "mc",
          prompt: "Best first detection for a SaaS AI platform?",
          options: [
            { id: "a", label: "Unusual admin role grants", correct: true },
            { id: "b", label: "Any use after 5pm" },
            { id: "c", label: "Any Python code interpretation" },
            { id: "d", label: "All prompts containing 'password'" },
          ],
          explanation: "Admin-role changes are the highest-signal indicator of takeover or insider misuse.",
          domain: "security",
        },
      ],
    },
    {
      id: "offboarding",
      title: "Offboarding an AI power user",
      lesson: {
        simple: "When someone leaves, their GPTs, agents, and connectors must move to a group owner first.",
        enterprise:
          "Standard offboarding treats accounts as leaf nodes. AI users own assets others depend on. Add an AI-asset transfer step to offboarding runbooks.",
        deepDive:
          "For each platform, enumerate ownable assets (GPTs, agents, projects, connectors, API keys, shared prompts). Owner transfer must be to a group, not a person. Where the platform supports it, enable inherited ownership by default so this is not a manual step.",
        mistakes: ["Deleting the user first, orphaning assets", "Transferring to another individual"],
        risks: ["Broken agents in production", "Loss of institutional AI IP"],
        fixes: ["Transfer-to-group step in offboarding", "Enable inherited group ownership"],
        evidence: ["Offboarding runbook", "Asset transfer log"],
      },
      quiz: [
        {
          id: "q-off-1",
          type: "owner",
          prompt: "Who runs the AI-asset transfer step?",
          options: [
            { id: "a", label: "HR" },
            { id: "b", label: "AI Platform Admin, coordinated with the user's manager", correct: true },
            { id: "c", label: "Security only" },
            { id: "d", label: "The departing user" },
          ],
          explanation:
            "Platform Admin owns the runbook and executes the transfer with manager sign-off on the new group owner.",
          domain: "ops",
        },
      ],
      scenarioId: "sc-offboarding-agent-owner",
    },
  ],
};

// ---------- DEEP LAB: Agent Security ----------
const agentLab: LabDef = {
  id: "agent",
  name: "Agent Security Lab",
  tagline: "Design agents that can act — safely.",
  mission: "Learn how to secure agent identity, tools, memory, and autonomy.",
  domain: "agent_rag_connector",
  depth: "deep",
  modules: [
    {
      id: "what-is-an-agent",
      title: "What is an agent (and what changes because of it)",
      lesson: {
        simple:
          "An agent is an LLM that can call tools, plan multi-step actions, and sometimes act without a human in the loop for each step.",
        enterprise:
          "The moment an LLM can take actions on real systems, it inherits every permission you gave it. Design starts from identity and blast radius, not from prompts.",
        deepDive:
          "Components: planner (LLM), tools (functions/APIs), memory (short + long), identity (user vs. service), controller (HITL, kill switch), telemetry (audit log). Failure modes: overplanning, tool misuse, prompt injection escalating to action, memory leakage across users.",
        diagram:
          "User -> Agent(planner LLM) -> Tools(allowlist) -> Backend APIs\n                       |-> Memory (per-user, TTL)\n                       |-> Audit log (SIEM)\n                       |-> Kill switch",
        mistakes: [
          "Granting the agent broad service-account permissions",
          "Sharing memory across users",
          "No kill switch",
        ],
        risks: [
          "Autonomous destructive actions",
          "Cross-tenant / cross-user data leak via memory",
          "Prompt injection → tool misuse",
        ],
        fixes: [
          "Per-user identity via on-behalf-of flow",
          "Tool allowlist + per-tool scopes",
          "HITL for state-changing tools",
          "Kill switch that revokes tokens",
          "Memory scoped per user with TTL",
        ],
        evidence: ["Threat model", "Tool inventory + scopes", "Kill-switch runbook", "Audit log sample"],
      },
      quiz: [
        {
          id: "q-agent-1",
          type: "gate",
          prompt: "An agent has read+write to production Jira with no HITL. Go/No-Go?",
          options: [
            { id: "go", label: "Go — LLM is good" },
            { id: "cond", label: "Conditional — add HITL for writes, cut scope to project" },
            { id: "no", label: "No-Go — no HITL and broad write scope is a hard block", correct: true },
            { id: "defer", label: "Defer to product" },
          ],
          explanation:
            "Agents with unbounded write permissions and no HITL fail every enterprise security bar. Redesign or block.",
          domain: "security",
        },
      ],
      scenarioId: "sc-agent-overprivilege",
    },
    {
      id: "identity-and-tools",
      title: "Identity, tools, and least privilege",
      lesson: {
        simple:
          "The agent should act as the user, not as an all-powerful service account. Only give it tools it truly needs.",
        enterprise:
          "Use on-behalf-of / OBO flows so downstream APIs enforce the user's own permissions. Each tool is a permission grant — inventory them.",
        deepDive:
          "OAuth on-behalf-of exchanges the user's token for a downstream API token, preserving identity. Function calling / tool schemas must be reviewed as APIs: input validation, output validation, rate limits, per-tool audit. Prefer read tools by default; writes require HITL.",
        mistakes: [
          "Shared service account for the agent",
          "'God-mode' tool that wraps a whole API",
          "Missing input validation on tool inputs",
        ],
        risks: ["Bypass of per-user permissions", "Excessive blast radius", "Injection through tool inputs"],
        fixes: [
          "OBO flow to downstream APIs",
          "Narrow tools (open_ticket, not admin_jira)",
          "Validate tool inputs like external API calls",
        ],
        evidence: ["Identity flow diagram", "Tool schemas + scopes", "Per-tool test results"],
      },
      quiz: [
        {
          id: "q-agent-2",
          type: "choose-control",
          prompt: "Most important control on a support agent that can email customers?",
          options: [
            { id: "a", label: "Rate limiting" },
            { id: "b", label: "HITL approval for outbound email + allowlist of recipients + audit of every send", correct: true },
            { id: "c", label: "Larger context window" },
            { id: "d", label: "Better model" },
          ],
          explanation:
            "Any customer-facing action is state-changing and reputational. HITL + allowlist + audit is the baseline.",
          domain: "security",
        },
      ],
    },
    {
      id: "kill-switch",
      title: "Kill switch and HITL patterns",
      lesson: {
        simple: "You must be able to stop the agent instantly and revoke its access.",
        enterprise:
          "A kill switch is a documented, tested control that (1) stops the agent runner, (2) revokes its tokens, (3) alerts owners. HITL is a design pattern where the agent proposes and a human approves state-changing actions.",
        deepDive:
          "Implement kill switch as: (a) feature flag that short-circuits the planner, (b) revocation of OAuth tokens / managed identity, (c) queue drain, (d) incident channel notification. Test it monthly. HITL should surface the exact tool call, inputs, and predicted impact — not just 'proceed?'.",
        mistakes: ["Kill switch exists on paper but never tested", "HITL that shows nothing meaningful"],
        risks: ["No way to stop a misbehaving agent", "HITL fatigue leading to auto-approve"],
        fixes: ["Monthly kill-switch drill", "Rich HITL that shows tool + inputs + estimated blast radius"],
        evidence: ["Kill-switch drill log", "HITL UI screenshot"],
      },
      quiz: [
        {
          id: "q-agent-3",
          type: "mc",
          prompt: "What proves a kill switch works?",
          options: [
            { id: "a", label: "It exists in the runbook" },
            { id: "b", label: "It was tested in the last month and logs show tokens were revoked", correct: true },
            { id: "c", label: "The vendor says so" },
            { id: "d", label: "It compiles" },
          ],
          explanation: "Controls that are not tested are not controls.",
          domain: "security",
        },
      ],
    },
  ],
};

// ---------- DEEP LAB: RAG Architecture ----------
const ragLab: LabDef = {
  id: "rag",
  name: "RAG Architecture Lab",
  tagline: "Design permission-aware, injection-resistant RAG.",
  mission: "Learn RAG end-to-end: ingestion, chunking, embeddings, retrieval, grounding, security, privacy, governance.",
  domain: "agent_rag_connector",
  depth: "deep",
  modules: [
    {
      id: "rag-basics",
      title: "What RAG is and why enterprises use it",
      lesson: {
        simple:
          "RAG retrieves relevant documents from your data and passes them to the model so answers cite your content.",
        enterprise:
          "RAG lets you ground generic models on internal knowledge without fine-tuning, respect ACLs, cite sources, and refresh knowledge continuously.",
        deepDive:
          "Pipeline: ingest → normalize → chunk → embed → index → retrieve (hybrid: dense + BM25) → rerank → security-trim → assemble prompt → generate → cite. Failure modes emerge at every arrow.",
        diagram:
          "Docs -> Ingest -> Chunk -> Embed -> Vector Index\n                                     |\nUser -> Query -> Retrieve -> Security Trim -> Rerank -> Prompt -> Model -> Answer(+cites)",
        mistakes: [
          "Chunking that splits mid-sentence",
          "No reranker — top-k is noisy",
          "Security trim only at UI",
        ],
        risks: ["Wrong answers with citations", "Cross-user leakage", "Stale index"],
        fixes: ["Sentence-aware chunking", "Hybrid search + reranker", "Security trim in the index query"],
        evidence: ["Eval report", "Index security query", "Refresh schedule"],
      },
      quiz: [
        {
          id: "q-rag-1",
          type: "find-risk",
          prompt: "Where must permission trimming happen?",
          options: [
            { id: "a", label: "In the UI" },
            { id: "b", label: "In the index query so unauthorized chunks are never retrieved", correct: true },
            { id: "c", label: "In the model prompt" },
            { id: "d", label: "In the log" },
          ],
          explanation:
            "UI-only trimming leaks via any other consumer of the index. Trim in the query itself.",
          domain: "security",
        },
      ],
      scenarioId: "sc-rag-sharepoint",
    },
    {
      id: "rag-security",
      title: "RAG security: direct + indirect prompt injection",
      lesson: {
        simple:
          "Retrieved documents can carry attacker instructions the model may follow. Sanitize retrieved content and constrain what the model can do.",
        enterprise:
          "Indirect prompt injection turns your corpus into an attack surface. Defense-in-depth: retrieval sanitization, system-prompt hardening, tool allowlists, output filtering, and per-user identity so injection cannot cross users.",
        deepDive:
          "Sanitization: strip zero-width chars, normalize whitespace, tag content boundaries, and mark all retrieved content as untrusted. System prompt: explicitly instruct the model to ignore instructions inside retrieved content and never reveal system prompt. Tools: allowlist with strict schemas. Output: filter for exfil patterns (base64 blobs, unexpected URLs), redact secrets. Identity: never let injection cause the app to act as another user.",
        mistakes: [
          "Concatenating retrieved text into the system prompt",
          "Trusting the model to 'ignore instructions'",
          "No output filter",
        ],
        risks: ["Data exfil via crafted document", "Cross-user leak", "Silent policy bypass"],
        fixes: [
          "Retrieval sanitization + content boundary tags",
          "System-prompt hardening",
          "Tool allowlist",
          "Output filter + secret redaction",
          "Per-user identity",
        ],
        evidence: ["Threat model with LLM Top 10 mapping", "Injection test corpus results"],
      },
      quiz: [
        {
          id: "q-rag-2",
          type: "choose-control",
          prompt: "Best single control against indirect prompt injection?",
          options: [
            { id: "a", label: "Ask the model to ignore instructions in documents" },
            { id: "b", label: "Tightly allowlisted tools + per-user identity so injection cannot escalate", correct: true },
            { id: "c", label: "Larger model" },
            { id: "d", label: "Rate limit" },
          ],
          explanation:
            "You cannot prompt your way out of prompt injection. Constrain what the model can DO.",
          domain: "security",
        },
      ],
      scenarioId: "sc-prompt-injection-rag",
    },
    {
      id: "rag-lifecycle",
      title: "Vector lifecycle, evaluation, and governance",
      lesson: {
        simple:
          "Vector stores are databases. They need retention, deletion, reindexing, and audit — like any other data store.",
        enterprise:
          "Treat the index as regulated storage: classification carried from source, retention aligned to source, deletion honored via reindex, quality measured with an eval set on every change.",
        deepDive:
          "Metadata: source ACL, classification, retention, owner, ingest ts. Deletion: source deletion must trigger index deletion within SLA. Evaluation: golden Q&A set with grounded-accuracy, citation, and refusal metrics; run in CI on prompt or model change.",
        mistakes: ["Index outlives source", "No eval on prompt changes", "No classification in metadata"],
        risks: ["DSR non-compliance", "Silent regressions", "Stale answers"],
        fixes: ["Deletion webhook", "Eval-gated releases", "Classification-aware retrieval"],
        evidence: ["Deletion audit", "Eval report per release", "Metadata schema"],
      },
      quiz: [
        {
          id: "q-rag-3",
          type: "mc",
          prompt: "A user requests deletion of their profile. What must happen in the RAG index?",
          options: [
            { id: "a", label: "Nothing — RAG is separate" },
            { id: "b", label: "Delete embeddings tied to their PII within DSR SLA", correct: true },
            { id: "c", label: "Wait for the next full reindex" },
            { id: "d", label: "Archive to cold storage" },
          ],
          explanation: "DSR obligations extend to embeddings that carry the person's identifiable content.",
          domain: "privacy_legal_risk",
        },
      ],
    },
  ],
};

// ---------- DEEP LAB: Connector Security ----------
const connectorLab: LabDef = {
  id: "connector",
  name: "Connector Security Lab",
  tagline: "Connectors are permission grants. Treat them as such.",
  mission: "Learn to review connector scopes, credential storage, DLP, and lifecycle.",
  domain: "agent_rag_connector",
  depth: "deep",
  modules: [
    {
      id: "connector-scopes",
      title: "OAuth scopes and least privilege",
      lesson: {
        simple: "Every connector asks for permissions. Only grant what it needs.",
        enterprise:
          "The connector consent screen is a policy document. Review scopes line by line; reject any that read more than the described feature requires.",
        deepDive:
          "Compare requested scopes against the feature's actual data path. Prefer file.read.selected over files.read.all. For write scopes, require HITL. Store credentials in a managed secrets store, never in prompt/context. Rotate. Audit consented apps quarterly.",
        mistakes: ["Approving requested scopes as-is", "Storing tokens in code or config"],
        risks: ["Broad data exfil path", "Long-lived token compromise"],
        fixes: ["Scope reduction request to vendor", "Managed secrets store", "Rotation policy", "Quarterly consent review"],
        evidence: ["Scope decision record", "Vault reference", "Rotation log", "Consent review report"],
      },
      quiz: [
        {
          id: "q-conn-1",
          type: "find-risk",
          prompt: "A new connector asks for 'Sites.FullControl.All'. It only needs to read one library.",
          options: [
            { id: "a", label: "Approve — SSO enforces user identity anyway" },
            { id: "b", label: "Reject and require site-scoped read-only permission", correct: true },
            { id: "c", label: "Approve for pilot only" },
            { id: "d", label: "Approve with an acceptable-use policy" },
          ],
          explanation: "Scope requests are non-negotiable. Push back or block.",
          domain: "security",
        },
      ],
    },
    {
      id: "connector-dlp",
      title: "DLP and lifecycle",
      lesson: {
        simple: "Connectors move data. DLP must apply on that data path. Retire connectors when unused.",
        enterprise:
          "Wire DLP policies to connector data paths (Purview / Chronicle / Netskope). Track usage; a connector unused for 90 days should be reviewed for removal.",
        deepDive:
          "Every connector = new data flow. Map: source, sink, classification, DLP policy, log destination, owner, last used. Automate 90-day dormancy alerts. On removal, revoke tokens and delete any cached data.",
        mistakes: ["Enabling connector without DLP policy update", "Never retiring unused connectors"],
        risks: ["Classified data leaves via unmonitored path", "Zombie connectors as attack surface"],
        fixes: ["DLP policy update per connector", "Dormancy alerts", "Retirement runbook"],
        evidence: ["Connector register", "DLP policy diff", "Dormancy report"],
      },
      quiz: [
        {
          id: "q-conn-2",
          type: "owner",
          prompt: "Who signs off retiring a dormant connector?",
          options: [
            { id: "a", label: "Platform Admin alone" },
            { id: "b", label: "Platform Admin + data owner of the source system", correct: true },
            { id: "c", label: "Security only" },
            { id: "d", label: "Any user" },
          ],
          explanation: "Removal changes data flow — the data owner co-signs.",
          domain: "ops",
        },
      ],
    },
  ],
};

// ---------- DEEP LAB: Zero Trust AI ----------
const zeroTrust: LabDef = {
  id: "zero-trust",
  name: "Zero Trust AI Lab",
  tagline: "Verify explicitly. Least privilege. Assume breach — applied to AI.",
  mission: "Apply Zero Trust to identity, device, app, data, network, workload, and AI-specific controls.",
  domain: "security",
  depth: "deep",
  modules: [
    {
      id: "zt-identity",
      title: "Identity in a Zero Trust AI world",
      lesson: {
        simple: "Every request is authenticated, per-user, with least privilege.",
        enterprise:
          "AI apps must propagate user identity end-to-end (OBO), enforce conditional access, and never use god-mode service accounts.",
        deepDive:
          "Chain: user token → API token (OBO) → data source token. Conditional access on device compliance and risk. Managed identity between services, never shared secrets. Break-glass admin via PIM with recorded justification.",
        mistakes: ["Service account calling data source on behalf of users", "No conditional access on AI apps"],
        risks: ["Retrieval bypass of per-user permissions", "Unmanaged devices exfiltrating outputs"],
        fixes: ["OBO flow", "Conditional access policies for AI apps", "Managed identities everywhere"],
        evidence: ["Identity flow diagram", "Conditional access policy export"],
      },
      quiz: [
        {
          id: "q-zt-1",
          type: "choose-control",
          prompt: "Best Zero Trust identity pattern for a RAG app?",
          options: [
            { id: "a", label: "Shared service account for retrieval" },
            { id: "b", label: "OBO from user to API to data source with conditional access", correct: true },
            { id: "c", label: "API key per user" },
            { id: "d", label: "IP allowlist only" },
          ],
          explanation: "OBO preserves per-user permissions all the way to the data source.",
          domain: "security",
        },
      ],
    },
    {
      id: "zt-network",
      title: "Network, workload, and assume-breach",
      lesson: {
        simple: "Keep AI endpoints private. Assume the app will be compromised — limit blast radius.",
        enterprise:
          "Private endpoints for model + data. Egress allowlist. Workload identity for service-to-service. Segment environments. Design for containment.",
        deepDive:
          "Private link to model + search + storage. Deny-all egress with explicit allowlist. Kill switch that revokes workload identity. Runbook for token compromise. Detection rules for anomalous tool calls and unusual output sizes.",
        mistakes: ["Public model endpoint", "Any-egress from AI workload", "Same env for dev and prod"],
        risks: ["Direct model abuse", "Exfil via egress", "Blast radius across environments"],
        fixes: ["Private endpoints", "Egress allowlist", "Env separation", "Kill switch + detections"],
        evidence: ["Network diagram", "Egress policy", "Detection catalog"],
      },
      quiz: [
        {
          id: "q-zt-2",
          type: "gate",
          prompt: "Public model endpoint in production. Go/No-Go?",
          options: [
            { id: "a", label: "Go" },
            { id: "b", label: "Conditional — front with WAF" },
            { id: "c", label: "No-Go — private endpoint required", correct: true },
            { id: "d", label: "Defer" },
          ],
          explanation: "Baseline Zero Trust: no public model endpoints for enterprise apps.",
          domain: "security",
        },
      ],
    },
  ],
};

// ---------- DEEP LAB: In-House AI App ----------
const inhouseLab: LabDef = {
  id: "in-house-app",
  name: "In-House AI App Simulator",
  tagline: "Design a full in-house AI app across all domains.",
  mission: "Make architecture, security, privacy, legal, data governance, IAM, DevSecOps, ops, and FinOps decisions.",
  domain: "architecture",
  depth: "deep",
  modules: [
    {
      id: "arch-overview",
      title: "Architecture: components and boundaries",
      lesson: {
        simple: "An in-house AI app has frontend, API, orchestrator, model, RAG, data sources, logs.",
        enterprise:
          "Every arrow is a security boundary and every component is an on-call surface. Draw the identity flow before the prompt flow.",
        deepDive:
          "Reference: Frontend (Entra token) → API Gateway → Orchestrator (managed identity) → Model (private endpoint) + Vector Store (security trimmed) + Tools → Response. Logging → SIEM. Secrets → Vault. Feedback loop → eval store.",
        diagram:
          "Frontend --Entra token--> API Gateway --MI--> Orchestrator\n   Orchestrator --> Model (private endpoint)\n   Orchestrator --> Vector Store (security trimmed)\n   Orchestrator --> Tools (allowlist)\n   All --> Logs -> SIEM\n   Secrets -> Vault",
        mistakes: ["No API gateway", "Keys in env vars", "No feedback loop"],
        risks: ["Bypass of gateway controls", "Secret leak", "Silent quality regression"],
        fixes: ["Enforce gateway", "Managed identity + Vault", "Eval loop"],
        evidence: ["Reference architecture", "Threat model", "Eval report"],
      },
      quiz: [],
    },
  ],
};

export const labs: LabDef[] = [
  saasOnboarding,
  inhouseLab,
  ragLab,
  agentLab,
  connectorLab,
  zeroTrust,
  scaffoldLab(
    "privacy",
    "Privacy / PIA Lab",
    "PII, minimization, retention, residency, DSR.",
    "Learn how to run a PIA for AI, map PII, and enforce minimization and residency.",
    "privacy_legal_risk",
    [
      seedModule("pii-mapping", "PII mapping and minimization",
        "Map every PII field the AI app touches. Remove or hash what isn't needed."),
      seedModule("dsr", "DSR (deletion, access, portability)",
        "Design deletion into the RAG index, prompt logs, and eval sets."),
    ],
  ),
  scaffoldLab(
    "legal",
    "Legal / OGC Lab",
    "Vendor terms, DPA, output ownership, indemnification.",
    "Learn to read AI vendor terms, DPAs, and client restrictions.",
    "privacy_legal_risk",
    [
      seedModule("vendor-terms", "Reading vendor terms",
        "Focus on: no-training clauses, output ownership, indemnification, subprocessors."),
    ],
  ),
  scaffoldLab(
    "qrm",
    "QRM / Risk Lab",
    "Inherent vs residual, hallucination, oversight, acceptance.",
    "Learn to tier, treat, and articulate residual risk.",
    "privacy_legal_risk",
    [
      seedModule("risk-tiering", "AI risk tiering",
        "Tier by data sensitivity, autonomy, and blast radius."),
    ],
  ),
  scaffoldLab(
    "data-governance",
    "Data Governance Lab",
    "Data owners, classification, permission trimming, vector lifecycle.",
    "Learn to enforce data-owner sign-off and vector lifecycle discipline.",
    "governance_grc",
    [
      seedModule("data-owner", "Data owner sign-off",
        "No data source enters RAG without a named data owner approval."),
    ],
  ),
  scaffoldLab(
    "iam",
    "IAM / Identity Lab",
    "SSO, OBO, managed identities, service principals.",
    "Learn identity propagation and least-privilege patterns for AI systems.",
    "security",
    [
      seedModule("obo", "On-Behalf-Of flow",
        "Preserve user identity from client to data source."),
    ],
  ),
  scaffoldLab(
    "devsecops",
    "DevSecOps / SSDLC Lab",
    "SAST/DAST/SCA, secrets, IaC, prompt/model versioning.",
    "Learn to secure the AI SDLC.",
    "security",
    [
      seedModule("prompt-versioning", "Prompt and model versioning",
        "Prompts and models are code — version, review, evaluate on change."),
    ],
  ),
  scaffoldLab(
    "ai-engineering",
    "AI Engineering Lab",
    "Evals, guardrails, cost, latency, telemetry.",
    "Learn the engineering discipline of shipping AI.",
    "architecture",
    [
      seedModule("evals", "Building an eval set",
        "Golden Q&A + grounded-accuracy + refusal metrics + regression gates."),
    ],
  ),
];

export const labsById: Record<string, LabDef> = Object.fromEntries(labs.map((l) => [l.id, l]));