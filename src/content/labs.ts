import type { LabDef, LabModule } from "./types";

// ---------- DEEP LAB: SaaS AI Onboarding (Platform Admin) ----------
const saasOnboarding: LabDef = {
  id: "saas-onboarding",
  name: "SaaS AI Onboarding Simulator",
  tagline: "Onboard SaaS AI platforms safely and defensibly.",
  mission:
    "Walk through admin, security, privacy, legal, operations, and FinOps for onboarding a SaaS AI platform end-to-end.",
  domain: "platform",
  modules: [
    {
      id: "sso-scim-rbac",
      title: "SSO, SCIM, RBAC — the identity baseline",
      lesson: {
        competencyIds: ["plat.sso", "plat.scim", "plat.rbac", "plat.saml"],
        simple:
          "Three separate jobs that get lumped together. One: staff sign in with their normal work login instead of yet another password — that is SSO. Two: accounts are created, changed and switched off automatically as people join, move and leave — that is SCIM. Three: what someone can do once inside depends on their job — that is RBAC. Most organisations wire up the first and skip the second, which is exactly why people who left last year still have working accounts.",
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
          competencyIds: ["plat.sso", "plat.rbac"],
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
          explanation:
            "SSO handles login. SCIM handles lifecycle. Without SCIM, deprovisioning drifts.",
          domain: "platform",
        },
      ],
      scenarioId: "sc-chatgpt-onboarding",
    },
    {
      id: "features-connectors",
      title: "Feature and connector enablement",
      lesson: {
        competencyIds: ["plat.feature_controls", "arch.connectors", "gov.capability_governance"],
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
          competencyIds: ["plat.feature_controls", "arch.connectors"],
          id: "q-feat-1",
          type: "find-risk",
          prompt: "A vendor added a new memory feature default-on last release. Biggest risk?",
          options: [
            { id: "a", label: "Latency" },
            {
              id: "b",
              label:
                "Sensitive context persists across sessions and leaks between users if sharing is misused",
              correct: true,
            },
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
        competencyIds: ["plat.audit_logs", "plat.finops", "plat.usage_analytics"],
        simple:
          "You cannot govern what you cannot see, and two things need watching from the first day. A record of who did what, sent somewhere you control rather than left in the vendor console where it expires on their schedule, not yours. And what it is costing, because AI spend rises with how much people use it rather than with how many people there are — so one badly written automation can outspend an entire department before anyone opens the invoice.",
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
          competencyIds: ["plat.audit_logs", "plat.finops"],
          id: "q-log-1",
          type: "mc",
          prompt: "Best first detection for a SaaS AI platform?",
          options: [
            { id: "a", label: "Unusual admin role grants", correct: true },
            { id: "b", label: "Any use after 5pm" },
            { id: "c", label: "Any Python code interpretation" },
            { id: "d", label: "All prompts containing 'password'" },
          ],
          explanation:
            "Admin-role changes are the highest-signal indicator of takeover or insider misuse.",
          domain: "security",
        },
      ],
    },
    {
      id: "offboarding",
      title: "Offboarding an AI power user",
      lesson: {
        competencyIds: ["plat.offboarding", "gov.retirement", "gov.recertification"],
        simple:
          "When someone leaves, their GPTs, agents, and connectors must move to a group owner first.",
        enterprise:
          "Standard offboarding treats accounts as leaf nodes. AI users own assets others depend on. Add an AI-asset transfer step to offboarding runbooks.",
        deepDive:
          "For each platform, enumerate ownable assets (GPTs, agents, projects, connectors, API keys, shared prompts). Owner transfer must be to a group, not a person. Where the platform supports it, enable inherited ownership by default so this is not a manual step.",
        mistakes: [
          "Deleting the user first, orphaning assets",
          "Transferring to another individual",
        ],
        risks: ["Broken agents in production", "Loss of institutional AI IP"],
        fixes: ["Transfer-to-group step in offboarding", "Enable inherited group ownership"],
        evidence: ["Offboarding runbook", "Asset transfer log"],
      },
      quiz: [
        {
          competencyIds: ["plat.offboarding", "gov.retirement"],
          id: "q-off-1",
          type: "owner",
          prompt: "Who runs the AI-asset transfer step?",
          options: [
            { id: "a", label: "HR" },
            {
              id: "b",
              label: "AI Platform Admin, coordinated with the user's manager",
              correct: true,
            },
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
  modules: [
    {
      id: "what-is-an-agent",
      title: "What is an agent (and what changes because of it)",
      lesson: {
        competencyIds: ["arch.agents", "arch.sequence"],
        simple:
          "Most AI tools write something and stop, and a person reads it and decides what to do. An agent is handed tools instead — it can send the email, update the ticket, call the payment system — and it works through several steps by itself, deciding what to do next as it goes. The moment a system acts rather than suggests, a wrong answer becomes a wrong action, and everything about how you review it has to change.",
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
        evidence: [
          "Threat model",
          "Tool inventory + scopes",
          "Kill-switch runbook",
          "Audit log sample",
        ],
      },
      quiz: [
        {
          competencyIds: ["arch.agents"],
          id: "q-agent-1",
          type: "gate",
          prompt: "An agent has read+write to production Jira with no HITL. Go/No-Go?",
          options: [
            { id: "go", label: "Go — LLM is good" },
            { id: "cond", label: "Conditional — add HITL for writes, cut scope to project" },
            {
              id: "no",
              label: "No-Go — no HITL and broad write scope is a hard block",
              correct: true,
            },
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
        competencyIds: ["arch.iam", "sec.agent_tool_misuse", "sec.oauth"],
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
        risks: [
          "Bypass of per-user permissions",
          "Excessive blast radius",
          "Injection through tool inputs",
        ],
        fixes: [
          "OBO flow to downstream APIs",
          "Narrow tools (open_ticket, not admin_jira)",
          "Validate tool inputs like external API calls",
        ],
        evidence: ["Identity flow diagram", "Tool schemas + scopes", "Per-tool test results"],
      },
      quiz: [
        {
          competencyIds: ["arch.iam", "sec.agent_tool_misuse"],
          id: "q-agent-2",
          type: "choose-control",
          prompt: "Most important control on a support agent that can email customers?",
          options: [
            { id: "a", label: "Rate limiting" },
            {
              id: "b",
              label:
                "HITL approval for outbound email + allowlist of recipients + audit of every send",
              correct: true,
            },
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
        competencyIds: ["sec.kill_switch", "sec.blast_radius", "sec.ir"],
        simple: "You must be able to stop the agent instantly and revoke its access.",
        enterprise:
          "A kill switch is a documented, tested control that (1) stops the agent runner, (2) revokes its tokens, (3) alerts owners. HITL is a design pattern where the agent proposes and a human approves state-changing actions.",
        deepDive:
          "Implement kill switch as: (a) feature flag that short-circuits the planner, (b) revocation of OAuth tokens / managed identity, (c) queue drain, (d) incident channel notification. Test it monthly. HITL should surface the exact tool call, inputs, and predicted impact — not just 'proceed?'.",
        mistakes: [
          "Kill switch exists on paper but never tested",
          "HITL that shows nothing meaningful",
        ],
        risks: ["No way to stop a misbehaving agent", "HITL fatigue leading to auto-approve"],
        fixes: [
          "Monthly kill-switch drill",
          "Rich HITL that shows tool + inputs + estimated blast radius",
        ],
        evidence: ["Kill-switch drill log", "HITL UI screenshot"],
      },
      quiz: [
        {
          competencyIds: ["sec.kill_switch", "sec.blast_radius"],
          id: "q-agent-3",
          type: "mc",
          prompt: "What proves a kill switch works?",
          options: [
            { id: "a", label: "It exists in the runbook" },
            {
              id: "b",
              label: "It was tested in the last month and logs show tokens were revoked",
              correct: true,
            },
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
  mission:
    "Learn RAG end-to-end: ingestion, chunking, embeddings, retrieval, grounding, security, privacy, governance.",
  domain: "agent_rag_connector",
  modules: [
    {
      id: "rag-basics",
      title: "What RAG is and why enterprises use it",
      lesson: {
        competencyIds: ["arch.rag", "arch.chunking", "arch.dataflow"],
        simple:
          "Ask a model a question on its own and it answers from what it absorbed while being trained — which may be out of date and knows nothing about your organisation. So instead you search your own documents first, and hand the relevant ones to the model along with the question. The answer then comes from your material and can point at where it came from. That pattern is called RAG, and it is how very nearly every enterprise AI assistant works.",
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
        fixes: [
          "Sentence-aware chunking",
          "Hybrid search + reranker",
          "Security trim in the index query",
        ],
        evidence: ["Eval report", "Index security query", "Refresh schedule"],
      },
      quiz: [
        {
          competencyIds: ["arch.rag", "arch.chunking"],
          id: "q-rag-1",
          type: "find-risk",
          prompt: "Where must permission trimming happen?",
          options: [
            { id: "a", label: "In the UI" },
            {
              id: "b",
              label: "In the index query so unauthorized chunks are never retrieved",
              correct: true,
            },
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
        competencyIds: ["sec.indirect_injection", "sec.permission_trimming", "sec.rag_poisoning"],
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
          competencyIds: ["sec.indirect_injection", "sec.permission_trimming"],
          id: "q-rag-2",
          type: "choose-control",
          prompt: "Best single control against indirect prompt injection?",
          options: [
            { id: "a", label: "Ask the model to ignore instructions in documents" },
            {
              id: "b",
              label: "Tightly allowlisted tools + per-user identity so injection cannot escalate",
              correct: true,
            },
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
        competencyIds: ["eng.retrieval_eval", "eng.groundedness", "arch.observability"],
        simple:
          "Vector stores are databases. They need retention, deletion, reindexing, and audit — like any other data store.",
        enterprise:
          "Treat the index as regulated storage: classification carried from source, retention aligned to source, deletion honored via reindex, quality measured with an eval set on every change.",
        deepDive:
          "Metadata: source ACL, classification, retention, owner, ingest ts. Deletion: source deletion must trigger index deletion within SLA. Evaluation: golden Q&A set with grounded-accuracy, citation, and refusal metrics; run in CI on prompt or model change.",
        mistakes: [
          "Index outlives source",
          "No eval on prompt changes",
          "No classification in metadata",
        ],
        risks: ["DSR non-compliance", "Silent regressions", "Stale answers"],
        fixes: ["Deletion webhook", "Eval-gated releases", "Classification-aware retrieval"],
        evidence: ["Deletion audit", "Eval report per release", "Metadata schema"],
      },
      quiz: [
        {
          competencyIds: ["eng.retrieval_eval", "eng.groundedness"],
          id: "q-rag-3",
          type: "mc",
          prompt: "A user requests deletion of their profile. What must happen in the RAG index?",
          options: [
            { id: "a", label: "Nothing — RAG is separate" },
            { id: "b", label: "Delete embeddings tied to their PII within DSR SLA", correct: true },
            { id: "c", label: "Wait for the next full reindex" },
            { id: "d", label: "Archive to cold storage" },
          ],
          explanation:
            "DSR obligations extend to embeddings that carry the person's identifiable content.",
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
  modules: [
    {
      id: "connector-scopes",
      title: "OAuth scopes and least privilege",
      lesson: {
        competencyIds: ["arch.connectors", "sec.oauth", "plr.subprocessors"],
        simple: "Every connector asks for permissions. Only grant what it needs.",
        enterprise:
          "The connector consent screen is a policy document. Review scopes line by line; reject any that read more than the described feature requires.",
        deepDive:
          "Compare requested scopes against the feature's actual data path. Prefer file.read.selected over files.read.all. For write scopes, require HITL. Store credentials in a managed secrets store, never in prompt/context. Rotate. Audit consented apps quarterly.",
        mistakes: ["Approving requested scopes as-is", "Storing tokens in code or config"],
        risks: ["Broad data exfil path", "Long-lived token compromise"],
        fixes: [
          "Scope reduction request to vendor",
          "Managed secrets store",
          "Rotation policy",
          "Quarterly consent review",
        ],
        evidence: [
          "Scope decision record",
          "Vault reference",
          "Rotation log",
          "Consent review report",
        ],
      },
      quiz: [
        {
          competencyIds: ["arch.connectors", "sec.oauth"],
          id: "q-conn-1",
          type: "find-risk",
          prompt:
            "A new connector asks for 'Sites.FullControl.All'. It only needs to read one library.",
          options: [
            { id: "a", label: "Approve — SSO enforces user identity anyway" },
            {
              id: "b",
              label: "Reject and require site-scoped read-only permission",
              correct: true,
            },
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
        competencyIds: ["sec.data_exfil", "plr.pii", "sec.monitoring"],
        simple:
          "A connector is a bridge that lets the AI tool reach into another system — your files, your email, your chat history. Data crosses that bridge, so whatever rules you already have for spotting sensitive information leaving the organisation have to apply on it too. And a connector nobody uses is still an open door, so unused ones get switched off rather than left running.",
        enterprise:
          "Wire DLP policies to connector data paths (Purview / Chronicle / Netskope). Track usage; a connector unused for 90 days should be reviewed for removal.",
        deepDive:
          "Every connector = new data flow. Map: source, sink, classification, DLP policy, log destination, owner, last used. Automate 90-day dormancy alerts. On removal, revoke tokens and delete any cached data.",
        mistakes: [
          "Enabling connector without DLP policy update",
          "Never retiring unused connectors",
        ],
        risks: [
          "Classified data leaves via unmonitored path",
          "Zombie connectors as attack surface",
        ],
        fixes: ["DLP policy update per connector", "Dormancy alerts", "Retirement runbook"],
        evidence: ["Connector register", "DLP policy diff", "Dormancy report"],
      },
      quiz: [
        {
          competencyIds: ["sec.data_exfil", "plr.pii"],
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
  mission:
    "Apply Zero Trust to identity, device, app, data, network, workload, and AI-specific controls.",
  domain: "security",
  modules: [
    {
      id: "zt-identity",
      title: "Identity in a Zero Trust AI world",
      lesson: {
        competencyIds: ["sec.zero_trust", "arch.iam", "plat.security_groups"],
        simple: "Every request is authenticated, per-user, with least privilege.",
        enterprise:
          "AI apps must propagate user identity end-to-end (OBO), enforce conditional access, and never use god-mode service accounts.",
        deepDive:
          "Chain: user token → API token (OBO) → data source token. Conditional access on device compliance and risk. Managed identity between services, never shared secrets. Break-glass admin via PIM with recorded justification.",
        mistakes: [
          "Service account calling data source on behalf of users",
          "No conditional access on AI apps",
        ],
        risks: [
          "Retrieval bypass of per-user permissions",
          "Unmanaged devices exfiltrating outputs",
        ],
        fixes: [
          "OBO flow",
          "Conditional access policies for AI apps",
          "Managed identities everywhere",
        ],
        evidence: ["Identity flow diagram", "Conditional access policy export"],
      },
      quiz: [
        {
          competencyIds: ["sec.zero_trust", "arch.iam"],
          id: "q-zt-1",
          type: "choose-control",
          prompt: "Best Zero Trust identity pattern for a RAG app?",
          options: [
            { id: "a", label: "Shared service account for retrieval" },
            {
              id: "b",
              label: "OBO from user to API to data source with conditional access",
              correct: true,
            },
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
        competencyIds: ["sec.network", "sec.zero_trust", "arch.resilience"],
        simple:
          "Keep AI endpoints private. Assume the app will be compromised — limit blast radius.",
        enterprise:
          "Private endpoints for model + data. Egress allowlist. Workload identity for service-to-service. Segment environments. Design for containment.",
        deepDive:
          "Private link to model + search + storage. Deny-all egress with explicit allowlist. Kill switch that revokes workload identity. Runbook for token compromise. Detection rules for anomalous tool calls and unusual output sizes.",
        mistakes: [
          "Public model endpoint",
          "Any-egress from AI workload",
          "Same env for dev and prod",
        ],
        risks: ["Direct model abuse", "Exfil via egress", "Blast radius across environments"],
        fixes: [
          "Private endpoints",
          "Egress allowlist",
          "Env separation",
          "Kill switch + detections",
        ],
        evidence: ["Network diagram", "Egress policy", "Detection catalog"],
      },
      quiz: [
        {
          competencyIds: ["sec.network", "sec.zero_trust"],
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
  mission:
    "Make architecture, security, privacy, legal, data governance, IAM, DevSecOps, ops, and FinOps decisions.",
  domain: "architecture",
  modules: [
    {
      id: "arch-overview",
      title: "Architecture: components and boundaries",
      lesson: {
        competencyIds: ["arch.inhouse", "arch.dataflow", "arch.nfrs"],
        simple:
          "Buying a product means the vendor already made every design decision and you are reviewing their answers. Building your own means assembling the pieces yourself: the screen people use, the service behind it, the part that decides what to do next, the model, the search over your documents, and the logs that record what happened. Every one of those is now a choice you have to defend.",
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
      quiz: [
        {
          id: "q-iha-arch-1",
          type: "choose-control",
          prompt:
            "You are designing an in-house AI app over an existing document store. Which decision most determines whether it can ever be approved for production?",
          options: [
            { id: "a", label: "Which model provider you pick" },
            {
              id: "b",
              label:
                "Where authorisation is enforced — server-side at retrieval, using the caller's identity",
              correct: true,
            },
            { id: "c", label: "Whether responses stream" },
            { id: "d", label: "The choice of vector database" },
          ],
          explanation:
            "Providers and vector stores are replaceable. If authorisation is not enforced server-side at retrieval, the app is a route around your existing permissions, and no amount of model choice fixes that.",
          domain: "architecture",
          competencyIds: ["arch.inhouse", "sec.permission_trimming", "arch.iam"],
        },
      ],
    },

    {
      id: "identity-and-authz",
      title: "Identity and authorisation in an in-house AI app",
      lesson: {
        objective:
          "Design an authorisation path that enforces the caller's real permissions at query time, server-side.",
        competencyIds: ["arch.iam", "sec.permission_trimming", "sec.zero_trust"],
        simple:
          "The app must check what this specific user is allowed to see every time it answers, on the server, using the source system's own permissions.",
        enterprise:
          "The classic in-house failure is an index built with a service account that can read everything, queried by an app that filters results in the browser. Anyone who inspects the network response sees documents they have no right to. The permissions were correct in SharePoint and lost at ingestion.",
        deepDive:
          "Carry the source access control list into the index as metadata, resolve the caller's group membership from the identity provider on each request, and apply it as a pre-filter on the vector query so unauthorised chunks are never retrieved — post-filtering still exposes them to the model. Validate the caller's token server-side, and never forward it to the model provider: the provider is not a party to your authorisation model, and a token in a prompt is a credential in a third party's logs. Re-resolve when permissions change.",
        mistakes: [
          "Indexing with a service account that holds broad read access across the tenant",
          "Filtering results client-side after the server has already returned them",
          "Passing the end-user's OAuth token through to the model provider",
        ],
        risks: [
          "Cross-department or cross-client disclosure through the retrieval path",
          "A user credential leaked into a third party's prompt logs",
          "Permission changes in the source system never reflected in the index",
        ],
        fixes: [
          "Store ACL metadata per chunk and pre-filter the query with the caller's resolved groups",
          "Enforce authorisation in the API layer and treat the frontend as untrusted",
          "Re-sync permissions on a schedule and on source permission-change events",
        ],
        evidence: [
          "Query trace showing the caller's group claims applied as a pre-filter",
          "Test proving a user cannot retrieve a document they lack access to",
          "Code review confirming no end-user token reaches the provider call",
        ],
      },
      quiz: [
        {
          id: "q-iha-1",
          type: "find-risk",
          prompt:
            "An in-house assistant returns all matching chunks from the API and hides the unauthorised ones in the React component. What is the risk?",
          options: [
            { id: "a", label: "None, provided the component is well tested" },
            {
              id: "b",
              label:
                "The unauthorised content has already left the server and is visible in the network response and logs",
              correct: true,
            },
            { id: "c", label: "The page will render slowly" },
            { id: "d", label: "The vector search will return fewer results than expected" },
          ],
          explanation:
            "Anything the API returns has already been disclosed, whatever the interface chooses to display. Test coverage of the component does not help, because the control sits on the wrong side of the trust boundary.",
          domain: "architecture",
          competencyIds: ["arch.iam", "sec.permission_trimming"],
        },
      ],
    },
    {
      id: "evals-and-launch",
      title: "Proving it works before launch",
      lesson: {
        objective:
          "Define the evidence and the promotion path that let an in-house AI app move from UAT into production.",
        competencyIds: ["eng.eval_datasets", "arch.nfrs", "plat.release_mgmt"],
        simple:
          "Before an internal AI app goes live you need proof it answers correctly, holds up under load, costs what you predicted, and can be turned back.",
        enterprise:
          "In-house AI apps are usually demoed rather than tested, and the demo uses ten friendly questions. Then two hundred people use it on Monday, latency triples because the reranker is single-threaded, and the monthly token spend passes the annual budget in nine days. There is no rollback because the index schema changed.",
        deepDive:
          "Set the promotion criteria before UAT, not after. Quality: the golden set passes its thresholds against the production index, not a sample. Performance: p95 latency and throughput measured at projected concurrency, with reranking and embedding calls included. Cost: tokens per session multiplied by expected sessions, with a hard budget alert and a per-user rate limit. Rollback: the previous application version and index snapshot both restorable, which means the index must be versioned rather than mutated in place. Promote through a canary group first.",
        mistakes: [
          "Treating a scripted demo as user acceptance testing",
          "Load-testing the model call alone and omitting retrieval and reranking",
          "Mutating the production index in place, leaving nothing to roll back to",
        ],
        risks: [
          "Latency collapse at real concurrency on the first working day",
          "Token spend exhausting the budget before anyone reads a cost report",
          "A bad release that cannot be reversed because the data layer moved with it",
        ],
        fixes: [
          "Agree numeric criteria for quality, latency, cost and rollback before UAT starts",
          "Version index builds and keep the previous snapshot for the rollback window",
          "Release to a canary group with budget alerts and per-user rate limits enabled",
        ],
        evidence: [
          "UAT report against the agreed criteria with a pass or fail per criterion",
          "Load test results at projected concurrency including retrieval and reranking",
          "Rollback procedure naming the index snapshot identifier to restore",
        ],
      },
      quiz: [
        {
          id: "q-iha-2",
          type: "gate",
          prompt:
            "An in-house assistant passes its golden set and UAT sign-off, but the index is rebuilt in place on every deployment. Should it be promoted?",
          options: [
            {
              id: "a",
              label: "Yes — quality is proven and the index build is an implementation detail",
            },
            { id: "b", label: "Yes, provided a change freeze is in place for the first week" },
            {
              id: "c",
              label:
                "No — without a restorable index snapshot there is no rollback, which is a promotion criterion in its own right",
              correct: true,
            },
            { id: "d", label: "No — golden set results are never sufficient evidence" },
          ],
          explanation:
            "Quality evidence does not substitute for reversibility, and an in-place rebuild means a bad release cannot be undone. A change freeze reduces how often you would need a rollback but does not give you one.",
          domain: "architecture",
          competencyIds: ["plat.release_mgmt", "arch.nfrs"],
        },
      ],
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
  {
    id: "privacy",
    name: "Privacy / PIA Lab",
    tagline: "PII mapping, minimisation, lawful basis, DSR and retention.",
    mission:
      "Learn to run a privacy impact assessment for an AI system, and design deletion that actually reaches every copy.",
    domain: "privacy_legal_risk",
    modules: [
      {
        id: "pii-mapping",
        title: "Mapping personal data through an AI system",
        lesson: {
          objective:
            "Produce a data map showing every place personal data comes to rest in an AI system.",
          competencyIds: ["plr.pii", "plr.purpose", "arch.dataflow"],
          simple:
            "Before you can protect personal data you have to know where it goes. In an AI system it goes to more places than people expect.",
          enterprise:
            "A prompt containing a customer name lands in at least four stores: the request log, the model provider's transient context, the vector index if that content was ingested, and any evaluation dataset built from real traffic. A data map that lists only the source database is wrong.",
          deepDive:
            "Enumerate the flow end to end: source system, ingestion job, chunk store, embedding vector, prompt log, response log, eval set, and any warehouse fed from those. For each, record the lawful basis, retention period and deletion mechanism. Vectors are the commonly-missed one — an embedding derived from personal data is still personal data, and a similarity search returns the original chunk.",
          mistakes: [
            "Mapping only the source system and calling it done",
            "Treating embeddings as anonymous because they are numbers",
            "Forgetting evaluation datasets built from production traffic",
          ],
          risks: [
            "Deletion requests that miss copies, leaving the organisation unable to honour them",
            "Processing with no lawful basis established for the secondary copies",
            "Retention far beyond the stated policy",
          ],
          fixes: [
            "Build the map from the data flow, not the org chart",
            "Record lawful basis and retention per store, not per system",
            "Include prompt and response logs explicitly",
          ],
          evidence: [
            "Data flow diagram covering all stores",
            "Retention schedule per store",
            "Lawful basis register entry",
          ],
        },
        quiz: [
          {
            id: "q-priv-1",
            type: "find-risk",
            prompt:
              "A team says their RAG assistant holds no personal data because the vector store only contains numbers. What is wrong with that claim?",
            options: [
              { id: "a", label: "Nothing — embeddings are anonymous" },
              {
                id: "b",
                label:
                  "Embeddings derived from personal data are still personal data, and retrieval returns the original text",
                correct: true,
              },
              { id: "c", label: "Vectors cannot be searched" },
              { id: "d", label: "Only the source database is in scope" },
            ],
            explanation:
              "An embedding is a derived representation, and the retrieval path returns the source chunk. Both the vector and the chunk store are in scope.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.pii", "arch.rag"],
          },
        ],
      },
      {
        id: "minimisation",
        title: "Minimisation and purpose limitation",
        lesson: {
          objective:
            "Decide what data an AI feature may use, and cut everything that does not earn its place.",
          competencyIds: ["plr.minimization", "plr.purpose", "sec.permission_trimming"],
          simple:
            "Collect what the task needs and nothing else. Every extra field is a liability you gain nothing from.",
          enterprise:
            "Minimisation in an AI system is mostly an ingestion decision. Filtering at ingest is cheaper and more defensible than redacting at query time, because what never entered the index cannot leak from it.",
          deepDive:
            "Work backwards from the answer the system must produce. If the assistant answers policy questions it does not need the HR case notes sitting in the same site. Apply source-level filters, then field-level redaction for what remains, then confirm with a negative retrieval test that excluded classes genuinely cannot be reached. Purpose limitation matters too: data ingested for support triage cannot be silently reused for performance analytics.",
          mistakes: [
            "Ingesting a whole site because selecting folders was harder",
            "Redacting only at display time",
            "Reusing an existing corpus for a new purpose without review",
          ],
          risks: [
            "Excessive collection that cannot be justified to a regulator",
            "Purpose creep as new features reuse an existing index",
            "Redaction bypassed by direct retrieval",
          ],
          fixes: [
            "Filter at ingest, not at render",
            "Record the purpose for each ingested source",
            "Test that excluded classes are unreachable",
          ],
          evidence: [
            "Ingestion filter configuration",
            "Purpose statement per source",
            "Negative retrieval test results",
          ],
        },
        quiz: [
          {
            id: "q-priv-2",
            type: "choose-control",
            prompt: "Which control best enforces data minimisation in a retrieval system?",
            options: [
              { id: "a", label: "Redacting personal data in the user interface" },
              {
                id: "b",
                label: "Filtering at ingestion so excluded content never enters the index",
                correct: true,
              },
              { id: "c", label: "Asking users not to query it" },
              { id: "d", label: "Shortening the model context window" },
            ],
            explanation:
              "What never enters the index cannot be retrieved. Display-time redaction leaves the data reachable through other paths.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.minimization", "sec.data_exfil"],
          },
        ],
      },
      {
        id: "dsr",
        title: "Deletion, access and portability requests",
        lesson: {
          objective:
            "Design a deletion path that provably reaches every copy, including the index.",
          competencyIds: ["plr.deletion", "plr.retention", "arch.rag"],
          simple:
            "When someone asks for their data to be deleted, you have to be able to do it everywhere — not just in the obvious place.",
          enterprise:
            "A deletion request against an AI system fails quietly when the source record is removed but the index still serves the old chunk. Deletion has to be a pipeline, and it has to be verifiable.",
          deepDive:
            "Wire deletion as an event: source deletion triggers index deletion by document id, then a verification query confirms the content is no longer retrievable. Prompt and response logs need the same treatment, which is why logging raw prompts indefinitely is a poor default. Rebuilding the index nightly is not deletion — it is a delay with a window. Access requests need an export across the same stores, which is only feasible if the data map exists.",
          mistakes: [
            "Deleting from the source and assuming the index follows",
            "Relying on a nightly rebuild as the deletion mechanism",
            "Ignoring prompt and response logs",
          ],
          risks: [
            "Inability to honour a lawful request within the statutory window",
            "Deleted content still surfacing in answers",
            "Regulatory exposure from an unverifiable process",
          ],
          fixes: [
            "Propagate deletion by document id, synchronously where possible",
            "Verify with a retrieval query after deletion",
            "Cap prompt-log retention so the deletion surface stays small",
          ],
          evidence: [
            "Deletion runbook",
            "Propagation test showing the content is unreachable",
            "Log retention configuration",
          ],
        },
        quiz: [
          {
            id: "q-priv-3",
            type: "gate",
            prompt:
              "A deletion request arrives and the record is removed from the source database. What must happen before the request can be closed?",
            options: [
              { id: "a", label: "Nothing further" },
              {
                id: "b",
                label:
                  "Index entries and derived copies are deleted, and a retrieval query confirms the content is unreachable",
                correct: true,
              },
              { id: "c", label: "The nightly rebuild runs" },
              { id: "d", label: "The requester is emailed" },
            ],
            explanation:
              "Closure requires verification. Until a query proves the content is gone from the retrieval path, the deletion is incomplete.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.deletion", "gov.evidence_management"],
          },
        ],
      },
    ],
  },
  {
    id: "data-governance",
    name: "Data Governance Lab",
    tagline: "Source ownership, classification, permission trimming and index lifecycle.",
    mission:
      "Learn to decide which data an AI system may use, prove the answers respect existing permissions, and keep the index honest over time.",
    domain: "governance_grc",
    modules: [
      {
        id: "data-ownership",
        title: "Data ownership and source approval",
        lesson: {
          objective:
            "Decide who owns each data source an AI system may use, and what approval it needs before ingestion.",
          competencyIds: ["gov.intake", "gov.registry", "gov.approval_workflow"],
          simple:
            "Every set of documents an AI tool reads belongs to someone. Before you connect it, that person has to agree to how it will be used.",
          enterprise:
            "The team that builds the assistant is rarely the team that owns the content. When a SharePoint site is connected without asking its owner, the first anyone hears of it is a finance director seeing draft board papers quoted back in a chat answer. Ownership has to be recorded before ingestion, not after the incident.",
          deepDive:
            "Run source approval as an intake record per source, not per application: system of record, named data owner, classification, lawful basis, and the approved purpose. The owner signs off on the connector's scope — site, library or table — and on whether the content is refreshed or frozen. Re-approval fires on scope change and on a recertification cycle, because a site owner who left two years ago cannot attest to anything. Store the record in the AI registry so an answer can be traced back to an approved source.",
          mistakes: [
            "Connecting a whole tenant because the connector offered it as one click",
            "Recording the requesting team as the owner instead of the content owner",
            "Approving a source once and never revisiting it after the scope changed",
          ],
          risks: [
            "Content surfacing to staff who were never meant to read it",
            "Nobody able to say who authorised a source when audit asks",
            "Ingestion of a source whose owner would have refused, discovered only after a complaint",
          ],
          fixes: [
            "Require a named owner sign-off per source before the connector is enabled",
            "Bind approval to a specific scope — site, library or table — not to the platform",
            "Recertify source approvals on a fixed cycle and on any scope change",
          ],
          evidence: [
            "Source register with named owner and approval date per source",
            "Connector configuration export showing the approved scope",
            "Recertification log with owner attestation",
          ],
        },
        quiz: [
          {
            id: "q-dg-1",
            type: "owner",
            prompt:
              "A product team wants to index the legal department's contract library into a company-wide assistant. Who must approve the source before ingestion?",
            options: [
              { id: "a", label: "The product team's engineering manager" },
              {
                id: "b",
                label: "Legal, as owner of the content, on the specific scope to be indexed",
                correct: true,
              },
              { id: "c", label: "The AI platform administrator who runs the connector" },
              { id: "d", label: "Anyone with write access to the library" },
            ],
            explanation:
              "Approval belongs to the accountable owner of the content, and it has to name the scope being indexed. The platform administrator enables the connector but cannot accept the risk of exposing somebody else's contracts.",
            domain: "governance_grc",
            competencyIds: ["gov.approval_workflow", "gov.intake"],
          },
        ],
      },
      {
        id: "classification-trimming",
        title: "Classification and permission trimming for retrieval",
        lesson: {
          objective:
            "Design retrieval so every answer respects the permissions the user already holds on the source.",
          competencyIds: ["sec.permission_trimming", "arch.rag", "plat.security_groups"],
          simple:
            "An AI assistant should only show someone what they could already open themselves. If it ignores permissions, it turns a private folder into a search engine.",
          enterprise:
            "Most retrieval systems index with a service account that can read everything, then hope the prompt keeps users in their lane. It does not. The classic failure is a salary review spreadsheet that was over-shared years ago: nobody found it through navigation, but semantic search surfaces it on the first plausible question.",
          deepDive:
            "Carry the source ACL onto every chunk at ingestion and filter the vector query by the caller's group membership, rather than filtering results after generation — a model that has already seen the text will paraphrase it. Access control lists drift, so re-sync permissions on a schedule and on change events, not only at first crawl. Classification labels, whether Microsoft Purview sensitivity labels or your own taxonomy, should gate which sources may be indexed at all. Test with two accounts at different clearance levels asking the same question.",
          mistakes: [
            "Indexing with a service account that holds read access to everything",
            "Filtering results after the model has already read the text",
            "Crawling permissions once and never re-syncing them",
          ],
          risks: [
            "Over-shared content becoming discoverable through semantic search",
            "Answers that quote documents the user cannot open directly",
            "Permission changes at the source taking effect nowhere in the index",
          ],
          fixes: [
            "Store per-chunk ACLs and apply them as a pre-filter on the vector query",
            "Re-sync permissions on a schedule and on source change events",
            "Block indexing of any source above an agreed sensitivity label",
          ],
          evidence: [
            "Retrieval trace showing the ACL filter applied before generation",
            "Two-account test result: same question, correctly different answers",
            "Permission sync job schedule and last successful run",
          ],
        },
        quiz: [
          {
            id: "q-dg-2",
            type: "find-risk",
            prompt:
              'A RAG assistant indexes the intranet with an admin service account, then instructs the model in the system prompt to "only use documents the user is allowed to see". What is the risk?',
            options: [
              { id: "a", label: "Latency increases because the index is large" },
              {
                id: "b",
                label:
                  "The instruction is not an access control — the retrieved text is already in context and can be reproduced",
                correct: true,
              },
              { id: "c", label: "The service account will exhaust its API quota" },
              { id: "d", label: "Nothing, provided the system prompt is well written" },
            ],
            explanation:
              "Enforcement has to happen before retrieval, as a filter on the query. Once a chunk is in the context window the model may paraphrase it, and no wording of the prompt reliably prevents that. A quota limit is an operational nuisance, not the exposure here.",
            domain: "governance_grc",
            competencyIds: ["sec.permission_trimming", "sec.data_exfil"],
          },
        ],
      },
      {
        id: "vector-lifecycle",
        title: "Vector store lifecycle: reindexing, staleness and deletion",
        lesson: {
          objective:
            "Design the reindex, staleness and deletion behaviour of a vector store before it reaches production.",
          competencyIds: ["plr.deletion", "plr.retention", "arch.rag"],
          simple:
            "An index is a copy. Copies go out of date and copies have to be cleaned up, so decide early how yours gets refreshed and removed.",
          enterprise:
            "Vector stores are built once, during the pilot, and then quietly rot. The visible failure is a policy assistant confidently quoting the expenses policy that was withdrawn in March, because the withdrawal deleted the page but nothing removed the chunks. Users lose trust in one answer and stop using the tool.",
          deepDive:
            "Treat the index as a derived store with its own lifecycle. Incremental sync should key on a stable document id and a change token, so an update replaces chunks rather than adding a second copy, and a delete event propagates to the index and is verified by a retrieval query. Track chunk age and source last-modified date as metadata so staleness is reportable. Reindexing is forced by more than content: changing the embedding model invalidates every existing vector, so plan a shadow index and cutover rather than an outage.",
          mistakes: [
            "Adding updated chunks without removing the superseded ones",
            "Treating a full nightly rebuild as the deletion mechanism",
            "Changing the embedding model without reindexing the existing corpus",
          ],
          risks: [
            "Withdrawn documents still cited as current guidance",
            "Two versions of the same policy retrieved for a single question",
            "Silent collapse in retrieval quality after a mixed-embedding index",
          ],
          fixes: [
            "Key sync on document id so updates replace chunks rather than accumulate",
            "Propagate source deletions to the index and verify with a retrieval query",
            "Expose chunk age and source date in the citations shown to users",
          ],
          evidence: [
            "Sync job logs showing inserts, updates and deletes per run",
            "Staleness report giving oldest chunk age per source",
            "Reindex runbook covering an embedding model change",
          ],
        },
        quiz: [
          {
            id: "q-dg-3",
            type: "gate",
            prompt:
              "You are the release gate for a RAG assistant moving from pilot to production. Which condition must be met before you approve?",
            options: [
              { id: "a", label: "Retrieval latency is under 500ms at p95" },
              {
                id: "b",
                label:
                  "Source deletions propagate to the index and a retrieval query confirms the content is unreachable",
                correct: true,
              },
              { id: "c", label: "The corpus contains at least 10,000 documents" },
              { id: "d", label: "The newest available embedding model is in use" },
            ],
            explanation:
              "Production brings real deletion requests and real withdrawn documents, so deletion propagation has to be demonstrated rather than assumed. Latency matters for user experience, but a fast answer citing a withdrawn policy is still the wrong answer.",
            domain: "governance_grc",
            competencyIds: ["plr.deletion", "gov.evidence_management"],
          },
        ],
      },
    ],
  },
  {
    id: "iam",
    name: "IAM / Identity Lab",
    tagline: "SSO, SCIM, MFA, and identity for agents and service principals.",
    mission:
      "Learn to run identity for an AI platform end to end, from human sign-in to the identity an agent presents when it calls a tool.",
    domain: "platform",
    modules: [
      {
        id: "sso-federation",
        title: "SSO, SAML, OIDC and MFA for AI platforms",
        lesson: {
          objective:
            "Design the sign-in path for an AI platform so every account is governed by your identity provider.",
          competencyIds: ["plat.sso", "plat.saml", "plat.oidc"],
          simple:
            "Everyone should sign in to the AI tool through the same company login they use for email. Separate passwords are accounts nobody can find or switch off.",
          enterprise:
            "AI vendors sell to teams, so the first hundred accounts predate the SSO contract and were created with email and password. Enforcing SSO later strands those accounts unless you claim the domain and force a migration. The failure looks like a leaver who kept access for months because their login was never in your directory.",
          deepDive:
            "Choose SAML or OIDC on what the vendor supports: SAML assertions carry attribute statements, OIDC carries claims in an ID token, and both need the group claim mapped to something the platform's roles consume. Enforce phishing-resistant MFA in the identity provider through conditional access rather than in the application, so the policy holds across every SaaS tool. Then close the side doors: domain capture for unmanaged accounts, SSO enforcement so local passwords stop working, and short refresh token lifetimes so revocation takes effect in hours, not weeks.",
          mistakes: [
            "Leaving pre-existing email-and-password accounts alive after SSO goes live",
            "Enforcing MFA in the application instead of in the identity provider",
            "Mapping no group claim, so every user lands in the default role",
          ],
          risks: [
            "Leavers retaining access through accounts the directory never knew about",
            "An MFA posture that differs per tool and cannot be reported on centrally",
            "Session and refresh tokens outliving a revocation by weeks",
          ],
          fixes: [
            "Capture the email domain and force existing users through migration",
            "Set conditional access with phishing-resistant MFA at the identity provider",
            "Map an IdP group claim to platform roles and test the landing state of each role",
          ],
          evidence: [
            "IdP application configuration export showing enforced SSO and MFA",
            "List of remaining non-SSO accounts, with owner and closure date",
            "Sign-in log sample showing federated authentication for all users",
          ],
        },
        quiz: [
          {
            id: "q-iam-1",
            type: "mc",
            prompt:
              "Your AI platform supports both SAML and OIDC. Which factor should decide the choice?",
            options: [
              { id: "a", label: "OIDC is newer, so it should always be preferred" },
              {
                id: "b",
                label:
                  "What the vendor implements well, and how group membership reaches the platform's role model",
                correct: true,
              },
              { id: "c", label: "Whichever protocol the firewall permits" },
              { id: "d", label: "SAML, because it supports MFA and OIDC does not" },
            ],
            explanation:
              "Both protocols federate authentication competently; the practical difference is vendor implementation quality and whether groups arrive as assertions or claims that map onto roles. MFA is enforced at the identity provider in either case, so the last option is simply untrue.",
            domain: "platform",
            competencyIds: ["plat.saml", "plat.oidc"],
          },
        ],
      },
      {
        id: "scim-lifecycle",
        title: "SCIM provisioning and the joiner, mover, leaver path",
        lesson: {
          objective:
            "Design provisioning so a leaver loses AI access, and their AI-owned assets are dealt with, on the same day.",
          competencyIds: ["plat.scim", "plat.offboarding", "gov.recertification"],
          simple:
            "When someone joins, moves or leaves, their access should change automatically. Manual tickets get forgotten, and forgotten access is what audits find.",
          enterprise:
            "An AI platform is not a mailbox: people build things in it. A departing analyst leaves behind custom GPTs, shared agents and connectors bound to their identity. Disable the account and those assets break; delete it and the team loses work nobody documented. Movers are worse: they keep the old team's access alongside the new.",
          deepDive:
            "SCIM drives create, update and deactivate from the directory, but only for what the vendor's SCIM schema exposes — group membership and role are often in scope, while ownership of an agent or a connector is not. So run offboarding as two tracks: SCIM deactivates the account within the sync interval, and a separate step reassigns AI-owned assets to a named successor before deactivation. For movers, source group membership from HR attributes so a transfer removes the old groups; additive-only mapping is how people accumulate a decade of access.",
          mistakes: [
            "Deactivating the account before reassigning the agents and connectors it owns",
            "Adding new groups on a transfer without removing the previous ones",
            "Assuming SCIM deprovisioning also revokes live sessions and personal API keys",
          ],
          risks: [
            "Shared agents breaking mid-quarter when their owner's account is disabled",
            "Movers accumulating access across every team they have ever belonged to",
            "Personal API tokens surviving deprovisioning entirely",
          ],
          fixes: [
            "Add an asset-reassignment step to the leaver workflow, ahead of SCIM deactivation",
            "Drive group membership from HR attributes so a transfer removes old groups",
            "Reconcile platform users against the directory quarterly and act on the diff",
          ],
          evidence: [
            "SCIM provisioning logs showing deactivation within the agreed SLA",
            "Leaver checklist entries recording asset reassignment and named successor",
            "Quarterly reconciliation report listing platform accounts with no directory match",
          ],
        },
        quiz: [
          {
            id: "q-iam-2",
            type: "choose-control",
            prompt:
              "Leavers keep working access to your AI platform for weeks after their last day. Which control addresses the root cause?",
            options: [
              { id: "a", label: "A monthly report of inactive users" },
              {
                id: "b",
                label:
                  "SCIM deprovisioning driven by the directory, with session and token revocation on deactivate",
                correct: true,
              },
              { id: "c", label: "A stricter password policy" },
              { id: "d", label: "Asking managers to raise a ticket when someone leaves" },
            ],
            explanation:
              "SCIM makes the directory the source of truth, so the leaver event removes access without anyone having to remember; revoking sessions and tokens closes the window deactivation alone leaves open. An inactivity report only detects the problem afterwards, and the manager ticket is the manual step that has already failed.",
            domain: "platform",
            competencyIds: ["plat.scim", "plat.offboarding"],
          },
        ],
      },
      {
        id: "machine-identity",
        title: "Machine and agent identity",
        lesson: {
          objective:
            "Decide what identity an agent presents when it calls a tool, and what that identity is allowed to reach.",
          competencyIds: ["arch.iam", "sec.oauth", "sec.blast_radius"],
          simple:
            "When an AI agent goes and fetches something, it has to log in as someone. Choosing who that someone is decides how much damage it can do.",
          enterprise:
            "The shortcut is a service account shared by every agent. It works in the demo and flattens your permission model in production: the agent can reach anything the account can, so a user who asks the right question inherits access they never had. It also destroys attribution — every audit log line names the same principal.",
          deepDive:
            "Prefer on-behalf-of flows: the agent exchanges the user's token for a downstream token through OAuth token exchange, so the target system applies the user's own permissions and logs their identity. Where the work is autonomous — a scheduled ingestion job — use a workload identity with federated credentials rather than a stored client secret, scoped to one system. Give each agent its own service principal so blast radius and audit trail are per agent, and keep consent grants narrow: delegated scopes for user context, application permissions only where nothing else works.",
          mistakes: [
            "One shared service account sitting behind every agent and connector",
            "Storing a long-lived client secret where federated workload identity was available",
            "Granting application-level permissions when delegated scopes would have sufficed",
          ],
          risks: [
            "Permission flattening: users reaching data through the agent that they cannot reach directly",
            "Audit logs that cannot attribute an action to the person who triggered it",
            "One compromised secret exposing every system the agent touches",
          ],
          fixes: [
            "Use on-behalf-of token exchange so downstream systems see and log the end user",
            "Issue one service principal per agent, scoped to that agent's tools only",
            "Replace stored secrets with federated workload identity and short-lived tokens",
          ],
          evidence: [
            "Identity map listing each agent, its principal, its scopes and its tools",
            "Downstream audit log entry showing the end user rather than the service account",
            "Secret inventory showing no long-lived credentials behind agent identities",
          ],
        },
        quiz: [
          {
            id: "q-iam-3",
            type: "find-risk",
            prompt:
              "An agent calls the document API using a single service account granted organisation-wide read access. What is the most serious consequence?",
            options: [
              { id: "a", label: "The API bill increases" },
              {
                id: "b",
                label:
                  "Every user of the agent effectively inherits organisation-wide read access, and the audit trail names only the service account",
                correct: true,
              },
              { id: "c", label: "The agent responds more slowly" },
              { id: "d", label: "The service account's password will expire" },
            ],
            explanation:
              "A shared high-privilege identity flattens the permission model: the agent's answers are bounded by the account's rights, not the caller's. Lost attribution compounds it, because you cannot reconstruct who caused a given read. Cost and latency change nothing about who can see what.",
            domain: "platform",
            competencyIds: ["arch.iam", "sec.blast_radius"],
          },
        ],
      },
    ],
  },
  {
    id: "devsecops",
    name: "DevSecOps / SSDLC Lab",
    tagline: "Secrets, dependencies, prompt versioning, eval gates and production response.",
    mission:
      "Learn to ship AI features through a pipeline that catches regressions before users do, and to run them once they are live.",
    domain: "ops",
    modules: [
      {
        id: "secure-ai-sdlc",
        title: "Securing the AI development lifecycle",
        lesson: {
          objective:
            "Produce a development baseline that keeps secrets, dependencies and prompts under the same control as application code.",
          competencyIds: ["sec.ssdlc", "sec.secrets", "eng.prompt_versioning"],
          simple:
            "AI features are still software. The keys, the libraries and the prompts all need the same care you give ordinary code — including a record of what changed.",
          enterprise:
            "AI work starts in notebooks, and notebook habits ship. The recurring findings are an API key pasted into a demo app that quietly became the pilot, and a prompt edited directly in the vendor console with no version history — so when quality drops on Tuesday, nobody can say what changed on Monday.",
          deepDive:
            "Bring the AI surface into the controls you already run: secret scanning on every push plus pre-commit hooks, secrets held in a managed vault with short-lived tokens rather than environment files, and SAST and dependency scanning with an SBOM — model SDKs pull large transitive trees, and an unpinned package is a supply chain path into your inference credentials. Prompts, system messages, tool definitions and retrieval configuration belong in version control with the code that calls them, released as an artefact and rolled back the same way.",
          mistakes: [
            "Keeping the pilot's hard-coded key because the pilot became production",
            "Editing the system prompt in the vendor console instead of in a pull request",
            "Pinning no versions for model SDKs and their transitive dependencies",
          ],
          risks: [
            "A leaked inference key running up spend and reading whatever that key can reach",
            "Prompt changes that cannot be attributed, reviewed or rolled back",
            "A compromised transitive dependency sitting inside the inference path",
          ],
          fixes: [
            "Move secrets into a managed vault and issue short-lived tokens to workloads",
            "Keep prompts, tool definitions and retrieval settings in the repository, released as artefacts",
            "Run secret scanning, SAST and dependency scanning on every pull request",
          ],
          evidence: [
            "Pipeline run showing secret, SAST and dependency scans passing",
            "Git history for the current production prompt, with named reviewer",
            "Vault policy showing token lifetime and which workload may read each secret",
          ],
        },
        quiz: [
          {
            id: "q-ds-1",
            type: "choose-control",
            prompt:
              "Answer quality drops overnight and nobody can identify what changed. Which control would have removed the ambiguity?",
            options: [
              { id: "a", label: "A larger evaluation dataset" },
              {
                id: "b",
                label:
                  "Prompts and tool definitions held in version control and released as a versioned artefact",
                correct: true,
              },
              { id: "c", label: "A faster model" },
              { id: "d", label: "More detailed application logs" },
            ],
            explanation:
              "Version control makes every change to the prompt attributable and reversible, so the overnight diff is a two-minute question. Richer logging tells you the output changed but not which edit caused it, and a bigger eval set helps you detect the drop rather than explain it.",
            domain: "ops",
            competencyIds: ["eng.prompt_versioning", "sec.ssdlc"],
          },
        ],
      },
      {
        id: "cicd-gates",
        title: "CI/CD gates for AI systems",
        lesson: {
          objective:
            "Design a pipeline gate that blocks a release when model or prompt changes degrade measured quality.",
          competencyIds: ["eng.cicd", "eng.eval_datasets", "eng.testing"],
          simple:
            "Before a change goes live, run it against a fixed set of questions with known good answers. If the score drops, the change does not ship.",
          enterprise:
            "Teams ship AI changes on impressions: someone tries five prompts, likes the output and merges. Then a model upgrade lands and a tool-calling path that worked silently stops, discovered by a customer. Deterministic tests cannot catch this, so quality has to be measured as a score against a maintained dataset and enforced as a gate.",
          deepDive:
            "Build a golden dataset of real questions with agreed answers, versioned next to the code and extended with every incident — the case that broke production becomes a permanent test. Score groundedness, retrieval hit rate and tool-call correctness separately, because a fall in answer quality usually starts in retrieval. Set the gate on a delta from the current baseline: a two-point drop blocks the merge and prints the failing cases. Run the same suite on a schedule against production configuration, since vendor-side model updates change behaviour without any commit of yours.",
          mistakes: [
            "Judging a change by trying a handful of prompts by hand",
            "Building the eval set from invented questions rather than real traffic",
            "Gating on an absolute score, so the bar gets quietly lowered when it fails",
          ],
          risks: [
            "A silent quality regression reaching customers before anyone measures it",
            "Vendor model updates changing behaviour with no commit of yours to point at",
            "Eval sets that decay until passing them means nothing",
          ],
          fixes: [
            "Gate the merge on a delta against the recorded baseline, and fail loudly",
            "Add every production incident to the golden dataset as a permanent case",
            "Run the eval suite on a schedule against production configuration, not only on merge",
          ],
          evidence: [
            "Pipeline output showing eval scores and the baseline they were compared against",
            "Golden dataset with change history and provenance per case",
            "Record of a blocked release and what was changed to unblock it",
          ],
        },
        quiz: [
          {
            id: "q-ds-2",
            type: "gate",
            prompt:
              "A pull request changes the system prompt. The eval suite scores 84 against a recorded baseline of 89. What should the pipeline do?",
            options: [
              { id: "a", label: "Pass — 84 is above the agreed floor of 80" },
              {
                id: "b",
                label:
                  "Block the merge and report the failing cases, because the change regresses the baseline",
                correct: true,
              },
              { id: "c", label: "Pass, and open a ticket to look at it later" },
              { id: "d", label: "Re-run the suite until a run scores above 89" },
            ],
            explanation:
              "The gate exists to stop a change making things worse, and a five-point drop against the current baseline is exactly that, whatever the absolute floor says. Re-running until you like the number turns evaluation noise into the release decision.",
            domain: "ops",
            competencyIds: ["eng.cicd", "eng.testing"],
          },
        ],
      },
      {
        id: "prod-monitoring-ir",
        title: "Monitoring and incident response for AI in production",
        lesson: {
          objective:
            "Design what you monitor for a live AI feature, and what happens in the first hour of an incident.",
          competencyIds: ["eng.observability", "sec.monitoring", "sec.ir"],
          simple:
            "Uptime is not the same as working. An AI feature can answer every request and still be wrong, so watch the answers, not just the service.",
          enterprise:
            "Standard monitoring says the endpoint is healthy while the assistant cites a document deleted in April. AI incidents are quality or disclosure incidents, and they arrive through a user complaint rather than an alert. The uncomfortable question in the first hour is who can turn the feature off, and whether doing so needs a deployment.",
          deepDive:
            "Instrument the chain, not just the endpoint: per-request traces carrying prompt version, model version, retrieved document ids and tool calls, so an incident can be reconstructed from one trace id. Alert on things that move before users complain — refusal rate, groundedness score, retrieval hit rate, token spend per user, and unusual tool-call sequences. Build a kill switch as configuration, feature-flagged per tenant, so containment is a flag change rather than a release. Write the runbook before launch: who declares, what gets preserved, how a poisoned index gets rolled back.",
          mistakes: [
            "Monitoring latency and error rate while nothing watches answer quality",
            "Discovering during the incident that the kill switch requires a deployment",
            "Logging only the final answer, with no retrieval or tool-call detail",
          ],
          risks: [
            "Wrong or over-disclosing answers running for days before anyone notices",
            "Containment delayed by a release cycle while the feature keeps answering",
            "No preserved evidence, so the post-incident review cannot establish cause",
          ],
          fixes: [
            "Trace each request with prompt version, model version and retrieved document ids",
            "Alert on refusal rate, groundedness and retrieval hit rate, not only on errors",
            "Ship a configuration-driven kill switch and rehearse using it before launch",
          ],
          evidence: [
            "Sample trace showing prompt version, retrieved ids and tool calls for one request",
            "Alert definitions with thresholds and the on-call routing",
            "Kill switch test record: elapsed time from decision to feature disabled",
          ],
        },
        quiz: [
          {
            id: "q-ds-3",
            type: "mc",
            prompt:
              "Which signal is most likely to surface a degraded RAG assistant before users complain?",
            options: [
              { id: "a", label: "HTTP 5xx rate on the inference endpoint" },
              {
                id: "b",
                label: "Retrieval hit rate and groundedness score on sampled production traffic",
                correct: true,
              },
              { id: "c", label: "CPU utilisation on the application servers" },
              { id: "d", label: "Daily active users" },
            ],
            explanation:
              "Degradation in a RAG system usually shows up first in retrieval: the endpoint keeps returning 200 while the answers stop being supported by the sources. Infrastructure signals stay green throughout, which is precisely why they are the wrong thing to rely on.",
            domain: "ops",
            competencyIds: ["eng.groundedness", "eng.observability"],
          },
        ],
      },
    ],
  },
  {
    id: "legal",
    name: "Legal / OGC Lab",
    tagline: "Vendor terms, DPAs and transfer, client and sector restrictions.",
    mission:
      "Learn to read what an AI vendor has actually promised, and to make client restrictions enforceable rather than aspirational.",
    domain: "privacy_legal_risk",
    modules: [
      {
        id: "vendor-terms",
        title: "Reading an AI vendor's terms",
        lesson: {
          objective:
            "Produce a one-page summary of what a vendor's terms actually give you on training, ownership and indemnity.",
          competencyIds: ["plr.ip", "plr.subprocessors", "arch.saas"],
          simple:
            "Vendor marketing says one thing and the contract says another. Read the terms yourself and write down what the vendor has actually promised in writing.",
          enterprise:
            'The four clauses that decide whether a tool can be used are training exclusion, output ownership, IP indemnity and the subprocessor list. The common failure is relying on a marketing page saying "we do not train on your data" while the signed agreement covers only the paid tier, not the free accounts staff use.',
          deepDive:
            "Training exclusion is usually tier-dependent and time-bounded — check whether it covers inputs, outputs and telemetry, and whether abuse-monitoring retention sits outside it. Output ownership clauses typically assign what you can own, then disclaim uniqueness, so two customers may receive similar output. IP indemnity is the one with conditions: it commonly requires you to keep provider safety filters enabled, not to train on outputs, and to notify within a stated window. Subprocessor lists change on notice, so track the change feed.",
          mistakes: [
            "Quoting the marketing page rather than the executed agreement",
            "Assuming the training exclusion covers free and personal accounts",
            "Reading the indemnity headline without the conditions that void it",
          ],
          risks: [
            "Confidential input used for training because the tier in use does not carry the exclusion",
            "Indemnity unavailable at the moment it is needed because a condition was breached",
            "A new subprocessor in an unassessed jurisdiction added by a notice nobody read",
          ],
          fixes: [
            "Extract the four clauses into a one-page summary attached to the tool's registry entry",
            "Block free-tier accounts at the identity and network layer, not by policy alone",
            "Subscribe to the subprocessor change feed and route changes to a named reviewer",
          ],
          evidence: [
            "Executed agreement with training, ownership and indemnity clauses cited by section",
            "Registry entry recording tier, exclusion scope and indemnity conditions",
            "Subprocessor list snapshot with the date it was reviewed",
          ],
        },
        quiz: [
          {
            id: "q-legal-1",
            type: "mc",
            prompt:
              "A vendor's public page states that customer data is not used for training. What determines whether that applies to your organisation's usage?",
            options: [
              { id: "a", label: "The public page is binding across all tiers" },
              {
                id: "b",
                label:
                  "The executed agreement and the specific tier or account type actually in use",
                correct: true,
              },
              { id: "c", label: "Whether the data is classified as confidential" },
              { id: "d", label: "The provider's country of incorporation" },
            ],
            explanation:
              "Training commitments are contractual and tier-scoped, so the executed agreement and the account type govern. How you classify the data changes your own obligations but does not alter the provider's terms.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.dpa", "plr.ip"],
          },
        ],
      },
      {
        id: "dpa-and-transfers",
        title: "DPAs and cross-border transfer",
        lesson: {
          objective:
            "Decide whether a vendor's processing geography and human review practices are acceptable, and record the transfer basis.",
          competencyIds: ["plr.dpa", "plr.residency", "plr.hitl"],
          simple:
            "A data processing agreement says what the vendor may do with your data. Where the data is processed, and who may read it, are separate questions.",
          enterprise:
            "Teams see an EU or UK region in the console and assume residency is settled. Inference may run in that region while abuse-monitoring logs, support tooling and evaluation samples sit elsewhere. The failure is a residency claim made to a client that the vendor's own documentation contradicts.",
          deepDive:
            "Separate three things: where inference executes, where prompts and completions are stored, and where humans may view flagged content. Most providers run abuse monitoring that retains flagged traffic for a stated period and permits reviewer access from named jurisdictions; zero-retention or no-human-review is usually an opt-in tied to a specific endpoint. Then record the transfer mechanism — standard contractual clauses, an adequacy decision, or the UK addendum — and a transfer risk assessment referencing the actual jurisdictions, not the headquarters address.",
          mistakes: [
            "Treating the console's region selector as the whole residency answer",
            "Missing that abuse-monitoring review may happen outside the inference region",
            "Signing the DPA without checking which endpoint the zero-retention terms attach to",
          ],
          risks: [
            "A residency commitment to a client that the vendor's documentation does not support",
            "Personal data read by a human reviewer in a jurisdiction with no transfer mechanism in place",
            "Log retention exceeding the period stated in the client contract",
          ],
          fixes: [
            "Document inference region, storage region and review jurisdiction as three separate fields",
            "Enable zero-retention on the specific endpoint and verify it in the console or response headers",
            "Attach the transfer risk assessment to the DPA and re-run it when subprocessors change",
          ],
          evidence: [
            "Signed DPA with the transfer mechanism identified",
            "Vendor documentation extract naming inference, storage and review locations",
            "Configuration proof that zero-retention is active on the endpoint in use",
          ],
        },
        quiz: [
          {
            id: "q-legal-2",
            type: "find-risk",
            prompt:
              "An engineer confirms the API endpoint is pinned to an EU region and reports that no personal data leaves the EU. What has been missed?",
            options: [
              { id: "a", label: "Nothing — the region pin settles it" },
              {
                id: "b",
                label:
                  "Abuse-monitoring retention and human review may occur outside the inference region",
                correct: true,
              },
              { id: "c", label: "EU regions do not support the API" },
              { id: "d", label: "TLS is terminated outside the EU" },
            ],
            explanation:
              "Region pinning governs where inference runs, not where flagged traffic is retained or reviewed. TLS termination is a network detail and does not by itself establish a transfer of personal data for review.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.residency", "plr.dpa", "plr.hitl"],
          },
        ],
      },
      {
        id: "client-restrictions",
        title: "Client and sector restrictions on AI processing",
        lesson: {
          objective:
            "Design an enforceable control that stops restricted client data reaching a third-party model.",
          competencyIds: ["plr.client_restrictions", "plr.purpose", "gov.exceptions"],
          simple:
            "Some clients and some regulators forbid their data being sent to third-party AI. You need to know which, and stop it happening by design.",
          enterprise:
            "Restrictions arrive through master services agreements, sector rules and public-sector schedules, and they usually name subprocessors rather than technologies. The failure is predictable: an engagement team pastes a restricted client's document into an approved assistant because nobody told them that client sat outside the approval.",
          deepDive:
            "Policy text does not stop a paste. Make the restriction a data attribute: tag matters and workspaces with an AI-processing flag at engagement acceptance, then enforce it where the data lives — a sensitivity label that blocks the connector, a matter-scoped index that excludes restricted clients, and DLP on the outbound API path. Where a client permits AI use under conditions, record the conditions and the named approver against the matter, with an expiry, so the exception cannot silently become the default.",
          mistakes: [
            "Holding the restriction list in a legal team spreadsheet that no system reads",
            "Assuming an approved tool is approved for every client whose data goes into it",
            "Granting a client exception verbally, with no expiry and no record",
          ],
          risks: [
            "Contractual breach and client notification obligations after restricted data reaches a vendor",
            "Restricted matter content ingested into a shared index and retrievable by unrelated teams",
            "Exceptions accumulating until the restriction is unenforceable in practice",
          ],
          fixes: [
            "Set the AI-processing flag at matter opening and inherit it into workspace labels",
            "Scope indexes per client or per matter so restricted content cannot be co-mingled",
            "Time-box every exception and re-approve it at engagement renewal",
          ],
          evidence: [
            "Matter-level AI-processing flag visible in the practice management system",
            "Label and DLP policy showing the block applied to restricted content",
            "Exception register with approver, conditions and expiry date",
          ],
        },
        quiz: [
          {
            id: "q-legal-3",
            type: "owner",
            prompt:
              "A partner wants to use an approved assistant on a client matter whose engagement letter forbids third-party AI processing. Who can authorise it?",
            options: [
              { id: "a", label: "The partner, as the client relationship owner" },
              { id: "b", label: "The AI governance forum, since the tool is already approved" },
              {
                id: "c",
                label:
                  "Nobody internally — the restriction is contractual, so it needs the client's written agreement or a variation",
                correct: true,
              },
              { id: "d", label: "The security team, if DLP is disabled for that matter" },
            ],
            explanation:
              "The restriction sits in a contract with the client, so only the client can relax it. The governance forum can set internal risk appetite but cannot waive a term the organisation has already agreed with a counterparty.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.client_restrictions", "gov.exceptions"],
          },
        ],
      },
    ],
  },
  {
    id: "qrm",
    name: "QRM / Risk Lab",
    tagline: "Use case tiering, proportionate oversight, residual risk acceptance.",
    mission:
      "Learn to size the review to the risk, design oversight that survives contact with a busy reviewer, and route residual risk to someone who can actually accept it.",
    domain: "privacy_legal_risk",
    modules: [
      {
        id: "use-case-tiering",
        title: "Tiering an AI use case",
        lesson: {
          objective:
            "Assign a defensible risk tier to an AI use case from data sensitivity, autonomy and blast radius.",
          competencyIds: ["gov.risk_classification", "sec.blast_radius", "gov.intake"],
          simple:
            "Not every AI use case needs the same scrutiny. Three questions decide it: what data it touches, how much it does alone, and what breaks when it is wrong.",
          enterprise:
            "Organisations that tier by tool end up reviewing the same platform forty times and the risky agent once. Tier the use case instead. The failure to avoid is a low-tier label attached to a drafting assistant that was quietly given the ability to send external email.",
          deepDive:
            "Score three axes independently. Data sensitivity: public, internal, personal, special-category or client-restricted. Autonomy: suggests to a human, acts with approval, acts and reports, acts silently. Blast radius: how many records or counterparties a single wrong action reaches before anyone notices. Take the maximum, not the average — an internal-data agent with write access to a payments API is not low risk. Re-tier on capability change, because adding a tool to an agent moves autonomy and blast radius without touching the model or the data.",
          mistakes: [
            "Tiering the platform rather than the individual use case running on it",
            "Averaging the three axes so one extreme score disappears",
            "Leaving the tier fixed after the use case gains write access or new tools",
          ],
          risks: [
            "High-autonomy use cases approved under a review designed for a chatbot",
            "Review capacity consumed by low-risk cases while agents go unexamined",
            "Silent scope expansion with no trigger for reassessment",
          ],
          fixes: [
            "Record data class, autonomy level and blast radius as three separate fields at intake",
            "Set the tier from the highest axis and require written justification to lower it",
            "Trigger re-tiering automatically when a tool, scope or integration is added",
          ],
          evidence: [
            "Intake record showing the three axis scores and the resulting tier",
            "Registry entry carrying the tier and its next review date",
            "Change log showing re-tiering after a capability change",
          ],
        },
        quiz: [
          {
            id: "q-qrm-1",
            type: "gate",
            prompt:
              "A use case scores low on data sensitivity and low on autonomy, but one wrong action can email 12,000 customers. What tier should it carry?",
            options: [
              { id: "a", label: "Low, since two of the three axes are low" },
              { id: "b", label: "Medium, as the average of the three scores" },
              {
                id: "c",
                label: "High, because the tier follows the highest axis and blast radius is high",
                correct: true,
              },
              { id: "d", label: "Undetermined until the model has been chosen" },
            ],
            explanation:
              "Tiering takes the maximum across axes, and a large blast radius alone justifies stronger oversight. Averaging is the common error: it lets one severe score be cancelled out by two benign ones.",
            domain: "privacy_legal_risk",
            competencyIds: ["gov.risk_classification", "sec.blast_radius"],
          },
        ],
      },
      {
        id: "proportionate-oversight",
        title: "Oversight proportionate to the cost of a wrong answer",
        lesson: {
          objective:
            "Design an oversight mechanism matched to what a wrong answer costs, rather than to policy habit.",
          competencyIds: ["plr.hitl", "gov.approval_workflow", "eng.groundedness"],
          simple:
            "Human review is not one thing. Match the check to the damage: read the citation, approve before sending, or limit what the system can say at all.",
          enterprise:
            '"A human is in the loop" is the most over-claimed control in AI governance. In practice the human approves forty items an hour and clicks through all of them. Oversight that costs less attention than the task it checks is theatre, and it fails at exactly the moment it is needed.',
          deepDive:
            "Pick the mechanism that makes the error visible. Citation-and-verify suits answers checkable against a source: the system must cite, and the reviewer opens the citation, so groundedness scoring and a refusal path matter more than fluency. Human approval suits discrete, costly actions — keep approvals rare enough to stay meaningful and capture the approver's identity. Restricting the output space suits work where free text is unnecessary: a fixed set of clause options removes whole classes of error rather than catching them.",
          mistakes: [
            "Claiming human review while the reviewer sees only the output and never the source",
            "Sending every output for approval until approval becomes a reflex",
            "Using free text where a structured choice would do the same job",
          ],
          risks: [
            "Rubber-stamped approvals producing an audit trail that misrepresents the control",
            "Reviewers unable to detect a plausible but unsupported answer",
            "Oversight so expensive that the feature is bypassed or abandoned",
          ],
          fixes: [
            "Show the cited source beside the output so verification takes seconds, not minutes",
            "Sample-review low-tier output and reserve per-item approval for high-tier actions",
            "Constrain the output format wherever the task allows it",
          ],
          evidence: [
            "Reviewer interface showing citations presented alongside each answer",
            "Approval log with reviewer identity and time spent per item",
            "Sampling policy stating review rates by tier",
          ],
        },
        quiz: [
          {
            id: "q-qrm-2",
            type: "choose-control",
            prompt:
              "An assistant drafts responses to regulatory queries from an internal policy library. Which oversight design is most proportionate?",
            options: [
              { id: "a", label: "A disclaimer telling users to check the answer" },
              {
                id: "b",
                label:
                  "Require the assistant to cite the policy clause, and require the reviewer to open it before sending",
                correct: true,
              },
              { id: "c", label: "Route every draft to the head of compliance for approval" },
              { id: "d", label: "Log all prompts and review a sample monthly" },
            ],
            explanation:
              "Citation-and-verify puts the check where the error would show, at a cost the reviewer can sustain. Routing everything to a single approver looks stronger but creates a bottleneck that degrades into rubber-stamping.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.hitl", "eng.groundedness"],
          },
        ],
      },
      {
        id: "residual-risk",
        title: "Residual risk and who may accept it",
        lesson: {
          objective:
            "State residual risk in decision-ready terms and route it to the person with authority to accept it.",
          competencyIds: ["plr.risk_acceptance", "gov.exceptions", "gov.registry"],
          simple:
            "Controls reduce risk, they do not remove it. Someone has to look at what is left, say yes or no, and be named for it.",
          enterprise:
            'Residual risk written as "the model may hallucinate" cannot be accepted by anyone, because it names no consequence and no owner. The failure mode is a risk register full of statements nobody can act on, and an AI system that goes live because no one ever formally declined it.',
          deepDive:
            "Write residual risk as a scenario with a frequency and a consequence: how often the failure is expected given the controls, what it costs when it happens, and who absorbs that cost. Then match the acceptor to the exposure — a business owner can accept operational inefficiency, but reputational, regulatory or client-contractual exposure belongs higher, and some exposures cannot be accepted at all because they breach a commitment already made. Record acceptance with a date, a scope and a review trigger, so it expires rather than becoming permanent.",
          mistakes: [
            "Describing residual risk as a model property rather than a business consequence",
            "Letting the delivery team accept risk that actually lands on the client or the regulator",
            "Recording acceptance with no expiry, so it survives every later change",
          ],
          risks: [
            "Live systems carrying unowned risk because acceptance was implied by silence",
            "Acceptance given by someone without authority to bind the organisation",
            "Stale acceptances covering a system that has since changed materially",
          ],
          fixes: [
            "State each residual risk as frequency, consequence and who bears the cost",
            "Publish an acceptance matrix mapping exposure type to the authorised acceptor",
            "Set an expiry and a re-review trigger on every acceptance",
          ],
          evidence: [
            "Residual risk statement expressed as frequency and consequence",
            "Signed acceptance naming the individual and the scope accepted",
            "Acceptance expiry date recorded against the registry entry",
          ],
        },
        quiz: [
          {
            id: "q-qrm-3",
            type: "owner",
            prompt:
              "An assistant used on client deliverables carries a residual risk of producing an unsupported citation roughly once a week. Who should accept that risk?",
            options: [
              { id: "a", label: "The engineering lead who built the assistant" },
              { id: "b", label: "The model provider, under its IP indemnity" },
              {
                id: "c",
                label:
                  "The accountable business owner for the deliverable, escalated to the level the exposure reaches",
                correct: true,
              },
              { id: "d", label: "Individual users, by accepting the terms of use" },
            ],
            explanation:
              "Risk is accepted by whoever answers for the consequence, which here is the deliverable's business owner. The provider's indemnity covers defined IP claims, not the quality of your work product, so it transfers nothing in this scenario.",
            domain: "privacy_legal_risk",
            competencyIds: ["plr.risk_acceptance", "gov.approval_workflow"],
          },
        ],
      },
    ],
  },
  {
    id: "ai-engineering",
    name: "AI Engineering Lab",
    tagline: "Golden sets and gates, retrieval measurement, prompt and model versioning.",
    mission:
      "Learn to measure an AI system instead of guessing at it, and to keep prompts and model versions under the same control as the rest of your code.",
    domain: "architecture",
    modules: [
      {
        id: "eval-datasets",
        title: "Evaluation datasets and regression gates",
        lesson: {
          objective:
            "Build a golden set and wire it into a gate that blocks a release when quality regresses.",
          competencyIds: ["eng.eval_datasets", "eng.groundedness", "eng.testing"],
          simple:
            "You cannot tell whether a change helped unless you measure the same questions before and after. That set of questions is the thing you build first.",
          enterprise:
            "Most teams ship on vibes: someone tries six prompts, it looks better, it goes out. Two weeks later a support team reports the assistant has started answering questions it used to decline. Without a fixed evaluation set nobody can say which change caused it, or whether the previous version was better.",
          deepDive:
            "A golden set is a versioned file of inputs with expected behaviour, drawn from real traffic and curated by someone who knows the domain — including the cases the system must refuse. Score at least three things: groundedness, meaning every claim is supported by a retrieved passage; answer correctness against the reference; and refusal rate on the out-of-scope slice. Run it in CI on every prompt, model or retrieval change, and fail the build on a regression beyond a stated threshold rather than reporting the number and merging anyway.",
          mistakes: [
            "Writing the evaluation cases from imagination rather than from production logs",
            "Omitting the out-of-scope slice, so refusal behaviour is never measured",
            "Reporting eval scores on a dashboard that no gate actually reads",
          ],
          risks: [
            "Silent quality regression discovered by users rather than by the pipeline",
            "Prompt changes tuned to the six examples the author happened to try",
            "Personal data from production traffic sitting unmanaged inside the eval set",
          ],
          fixes: [
            "Version the golden set alongside the code and review changes to it like code",
            "Set a threshold per metric and fail CI when any of them is breached",
            "Redact or synthesise the eval set and give it an explicit retention period",
          ],
          evidence: [
            "Golden set file under version control with a changelog",
            "CI run showing a build failed on a groundedness regression",
            "Threshold definitions per metric with a named owner",
          ],
        },
        quiz: [
          {
            id: "q-eng-1",
            type: "gate",
            prompt:
              "A prompt change raises answer correctness by four points but drops refusal rate on the out-of-scope slice from 92% to 61%. What should the gate do?",
            options: [
              { id: "a", label: "Pass — correctness is the primary metric" },
              { id: "b", label: "Pass, with a note for the next retrospective" },
              {
                id: "c",
                label: "Fail — the system has started answering questions it should decline",
                correct: true,
              },
              { id: "d", label: "Pass, then watch production for complaints" },
            ],
            explanation:
              "A thirty-point fall in refusal rate means the system now answers out-of-scope questions, which is a regression regardless of the correctness gain. Deferring to production monitoring accepts user-visible harm as the detection mechanism.",
            domain: "architecture",
            competencyIds: ["eng.eval_datasets", "eng.testing"],
          },
        ],
      },
      {
        id: "retrieval-quality",
        title: "Engineering retrieval quality",
        lesson: {
          objective:
            "Diagnose whether a poor answer came from retrieval or generation, and fix the retrieval stage with measurements rather than guesses.",
          competencyIds: ["eng.retrieval_eval", "arch.chunking", "arch.rag"],
          simple:
            "If the right passage never reaches the model, no amount of prompt tuning will fix the answer. Measure retrieval separately from generation.",
          enterprise:
            "When a RAG assistant gives a poor answer, teams reflexively rewrite the prompt. Often the retrieved passages never contained the answer at all. The failure is weeks spent tuning the generation stage while recall sits at 60% because documents were chunked at a fixed 500 tokens, splitting tables and clause numbering.",
          deepDive:
            "Build a retrieval-only test set: each query paired with the passage ids that should come back, then measure recall@k and mean reciprocal rank before the model sees anything. If recall@20 is high but recall@5 is poor, add a cross-encoder reranker rather than a larger context window. If recall@20 is poor, the problem is upstream — chunking that ignores document structure, missing metadata filters, or an embedding model unfamiliar with your terminology. Hybrid BM25 plus vector search usually beats either alone on jargon and identifiers.",
          mistakes: [
            "Tuning prompts to fix failures that are actually retrieval misses",
            "Chunking at a fixed token count across contracts, tables and slide decks alike",
            "Judging retrieval by reading a handful of results instead of scoring recall@k",
          ],
          risks: [
            "Confident answers assembled from passages that do not contain the fact",
            "Engineering effort spent on generation while the real defect stays untouched",
            "Context padded with irrelevant passages, raising cost and diluting the answer",
          ],
          fixes: [
            "Hold a labelled retrieval set and track recall@k as a first-class release metric",
            "Chunk on document structure — headings, clauses, table boundaries — and carry metadata",
            "Add a reranker when recall@20 is strong and recall@5 is weak",
          ],
          evidence: [
            "Labelled query-to-passage set with recall@k and MRR reported per release",
            "Chunking configuration documented per source type",
            "Before-and-after retrieval scores for the reranker change",
          ],
        },
        quiz: [
          {
            id: "q-eng-2",
            type: "mc",
            prompt:
              "Retrieval evaluation shows recall@20 of 0.94 and recall@5 of 0.51. What is the most appropriate next step?",
            options: [
              { id: "a", label: "Re-chunk the corpus into smaller chunks" },
              {
                id: "b",
                label:
                  "Add a reranker over the top 20 candidates so the correct passage rises into the top 5",
                correct: true,
              },
              { id: "c", label: "Switch to a model with a larger context window" },
              { id: "d", label: "Rewrite the system prompt to be more specific" },
            ],
            explanation:
              "The correct passage is already being retrieved but ranked too low, which is precisely what reranking fixes. Re-chunking addresses weak recall@20, and recall@20 here is already high.",
            domain: "architecture",
            competencyIds: ["eng.retrieval_eval", "arch.rag"],
          },
        ],
      },
      {
        id: "prompt-model-versioning",
        title: "Prompt and model version management",
        lesson: {
          objective:
            "Put prompts and model versions under change control so an upstream update cannot silently alter behaviour.",
          competencyIds: ["eng.prompt_versioning", "eng.model_lifecycle", "eng.cicd"],
          simple:
            "The prompt is code and the model is a dependency. Both need versions, both need review, and neither should change without you knowing.",
          enterprise:
            "Prompts edited in a vendor console leave no diff, no author and no rollback. Meanwhile a provider deprecates the pinned model version and the alias moves to a successor. The system starts producing longer, differently formatted output, a downstream parser breaks, and nothing in your change log explains why.",
          deepDive:
            "Keep prompts in the repository, versioned with the code that calls them, and treat an edit as a pull request that runs the eval suite. Pin the model to a dated snapshot identifier rather than a floating alias, and record it in request logs so any output traces back to the version that produced it. Subscribe to the provider's deprecation notices, and run the golden set against the successor version in a shadow environment before the retirement date, since output length, formatting and refusal behaviour shift between versions.",
          mistakes: [
            "Editing production prompts in a vendor console with no diff and no author",
            "Calling a floating model alias from production code",
            "Learning about a deprecation from a failing job rather than from the notice",
          ],
          risks: [
            "Behaviour changing under a system that was signed off against a different version",
            "No way to reproduce or explain an output after the fact",
            "Forced migration on the provider's timetable with no tested successor",
          ],
          fixes: [
            "Store prompts as reviewed files and require the eval suite to pass on every change",
            "Pin dated snapshot identifiers and log the identifier with each request",
            "Shadow-test the successor version against the golden set before the retirement date",
          ],
          evidence: [
            "Prompt change history with author, reviewer and eval results",
            "Request logs containing the model snapshot identifier",
            "Shadow-run comparison report for the successor model version",
          ],
        },
        quiz: [
          {
            id: "q-eng-3",
            type: "choose-control",
            prompt:
              "Which control most directly prevents a provider's model update from silently changing a production system's behaviour?",
            options: [
              { id: "a", label: "Lowering the temperature setting" },
              {
                id: "b",
                label:
                  "Pinning a dated model snapshot and re-running the eval suite before moving to a successor",
                correct: true,
              },
              { id: "c", label: "Adding a disclaimer to the output" },
              { id: "d", label: "Increasing the context window" },
            ],
            explanation:
              "Pinning removes the silent change and the eval suite makes the deliberate change measurable. Temperature only affects sampling variation within a version, so it does nothing when the underlying version is swapped.",
            domain: "architecture",
            competencyIds: ["eng.model_lifecycle", "eng.prompt_versioning"],
          },
        ],
      },
    ],
  },
];

export const labsById: Record<string, LabDef> = Object.fromEntries(labs.map((l) => [l.id, l]));
