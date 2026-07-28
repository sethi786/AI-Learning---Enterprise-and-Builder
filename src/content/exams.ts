import type { ExamDef } from "./types";

export const exams: ExamDef[] = [
  {
    id: "security-architect",
    name: "AI Security Architect — Practice Exam",
    roleId: "security-architect",
    description: "10 questions across OWASP LLM Top 10, agents, connectors, RAG, and Zero Trust.",
    questions: [
      {
        id: "sa-1",
        type: "find-risk",
        prompt: "A RAG app concatenates retrieved documents into the system prompt. Biggest risk?",
        options: [
          { id: "a", label: "Cost" },
          { id: "b", label: "Indirect prompt injection escalating to tool misuse", correct: true },
          { id: "c", label: "Latency" },
          { id: "d", label: "Model hallucination" },
        ],
        explanation:
          "Retrieved content is untrusted input. Concatenating it into the system prompt gives it authority.",
        domain: "security",
      },
      {
        id: "sa-2",
        type: "choose-control",
        prompt: "Best control against agent tool misuse via prompt injection?",
        options: [
          { id: "a", label: "Instruct the model to refuse malicious inputs" },
          {
            id: "b",
            label: "Strict tool allowlist + per-tool schemas + HITL for state-changing tools",
            correct: true,
          },
          { id: "c", label: "Bigger model" },
          { id: "d", label: "Rate limiting" },
        ],
        explanation: "Constrain what the model can do — you cannot rely on it to constrain itself.",
        domain: "security",
      },
      {
        id: "sa-3",
        type: "gate",
        prompt: "Public model endpoint for an in-house RAG app in production.",
        options: [
          { id: "a", label: "Go" },
          { id: "b", label: "Conditional — WAF" },
          { id: "c", label: "No-Go — private endpoint required", correct: true },
          { id: "d", label: "Defer" },
        ],
        explanation: "Baseline Zero Trust for enterprise AI.",
        domain: "security",
      },
      {
        id: "sa-4",
        type: "mc",
        prompt: "OWASP LLM Top 10 category most relevant to a poisoned SharePoint doc?",
        options: [
          { id: "a", label: "Prompt Injection", correct: true },
          { id: "b", label: "Insecure Output Handling" },
          { id: "c", label: "Model DoS" },
          { id: "d", label: "Model Theft" },
        ],
        explanation: "Indirect prompt injection is a form of prompt injection (LLM01).",
        domain: "security",
      },
      {
        id: "sa-5",
        type: "find-risk",
        prompt: "Agent uses a shared service account with full Jira permissions.",
        options: [
          { id: "a", label: "Latency" },
          { id: "b", label: "Bypass of per-user permissions + huge blast radius", correct: true },
          { id: "c", label: "Cost" },
          { id: "d", label: "Cache misses" },
        ],
        explanation:
          "Shared service accounts erase user-level accountability and permission scoping.",
        domain: "security",
      },
      {
        id: "sa-6",
        type: "owner",
        prompt: "Who owns SAR sign-off for an in-house AI app?",
        options: [
          { id: "a", label: "Platform Admin" },
          { id: "b", label: "AI Security Architect", correct: true },
          { id: "c", label: "Product Manager" },
          { id: "d", label: "Legal" },
        ],
        explanation:
          "Security Architecture Review is owned by AI Security Architecture, partnered with Solution Architecture.",
        domain: "governance_grc",
      },
      {
        id: "sa-7",
        type: "choose-control",
        prompt: "Best control for secrets ending up in coding-assistant context?",
        options: [
          { id: "a", label: "User training only" },
          {
            id: "b",
            label: "Repo-level secrets scanning + pre-commit hooks + policy-blocked file types",
            correct: true,
          },
          { id: "c", label: "Bigger context window" },
          { id: "d", label: "Turn the assistant off" },
        ],
        explanation: "Defense in the SDLC pipeline, not at the human layer.",
        domain: "security",
      },
      {
        id: "sa-8",
        type: "mc",
        prompt: "Kill switch counts as a control only if…",
        options: [
          { id: "a", label: "It exists in Confluence" },
          {
            id: "b",
            label: "It has been tested in the last 30 days with logged evidence",
            correct: true,
          },
          { id: "c", label: "The vendor supports it" },
          { id: "d", label: "It has a red button icon" },
        ],
        explanation: "Untested controls do not exist in an audit.",
        domain: "security",
      },
      {
        id: "sa-9",
        type: "find-risk",
        prompt: "AI Search index for a RAG app has no security-trimming filter.",
        options: [
          { id: "a", label: "Latency" },
          {
            id: "b",
            label: "Any authenticated user can retrieve any indexed document",
            correct: true,
          },
          { id: "c", label: "Model refuses to answer" },
          { id: "d", label: "Cost" },
        ],
        explanation: "The index becomes a permission-bypass side channel.",
        domain: "security",
      },
      {
        id: "sa-10",
        type: "gate",
        prompt: "A vendor connector requires 'Sites.FullControl.All' but only reads one library.",
        options: [
          { id: "a", label: "Go" },
          { id: "b", label: "Conditional — pilot only" },
          {
            id: "c",
            label: "No-Go — push back for narrower scope; block until reduced",
            correct: true,
          },
          { id: "d", label: "Defer" },
        ],
        explanation: "Broad scope requests are the top connector risk. Block or narrow.",
        domain: "security",
      },
    ],
  },
  {
    id: "platform-admin",
    name: "AI Platform Admin — Practice Exam",
    roleId: "platform-admin",
    description:
      "Ten questions across identity, rollout rings, connector approval, audit logging, cost and offboarding.",
    questions: [
      {
        id: "pa-1",
        type: "mc",
        prompt: "Best single control to eliminate personal-account shadow AI?",
        options: [
          { id: "a", label: "Acceptable-use policy" },
          {
            id: "b",
            label: "Verified domain / domain capture on the enterprise workspace",
            correct: true,
          },
          { id: "c", label: "Block ChatGPT at proxy" },
          { id: "d", label: "Longer passwords" },
        ],
        explanation:
          "Domain capture forces employees with corporate email into the managed workspace.",
        domain: "platform",
      },
      {
        id: "pa-2",
        type: "choose-control",
        prompt:
          "Leavers keep working AI assistant access for weeks after their last day. Root-cause control?",
        options: [
          { id: "a", label: "Monthly manual access review by team leads" },
          {
            id: "b",
            label: "SCIM deprovisioning driven by the HR-sourced identity record",
            correct: true,
          },
          { id: "c", label: "Shorter session token lifetimes" },
          { id: "d", label: "Disabling the leaver's mailbox" },
        ],
        explanation:
          "SCIM binds the account lifecycle to the authoritative joiner-mover-leaver feed, so termination removes access and reclaims the licence. A monthly review only shortens the exposure window.",
        domain: "platform",
        competencyIds: ["plat.scim", "plat.offboarding"],
      },
      {
        id: "pa-3",
        type: "mc",
        prompt:
          "Users sign in via SAML SSO, but group membership changes never reach the AI platform. Most likely cause?",
        options: [
          {
            id: "a",
            label: "SCIM provisioning is not configured, so groups never sync",
            correct: true,
          },
          { id: "b", label: "The SAML signing certificate has expired" },
          { id: "c", label: "OIDC is required before groups can be used" },
          { id: "d", label: "MFA is enforced at the identity provider" },
        ],
        explanation:
          "SAML authenticates a session; ongoing attribute and group lifecycle needs SCIM. An expired certificate would break sign-in altogether, not just group updates.",
        domain: "platform",
        competencyIds: ["plat.saml", "plat.scim", "plat.sso"],
      },
      {
        id: "pa-4",
        type: "owner",
        prompt:
          "One admin role can change AI tenant settings and also purge the audit log. Who owns the fix?",
        options: [
          { id: "a", label: "Security operations, as the log consumer" },
          {
            id: "b",
            label: "Platform Admin — split configuration rights from log custody",
            correct: true,
          },
          { id: "c", label: "Internal audit" },
          { id: "d", label: "The platform vendor" },
        ],
        explanation:
          "Role design in the tenant is the Platform Admin's accountability, and separation of duties means the configurer cannot erase the record. Security operations reads the logs but cannot change tenant roles.",
        domain: "platform",
        competencyIds: ["plat.admin_roles", "plat.audit_logs"],
      },
      {
        id: "pa-5",
        type: "gate",
        prompt:
          "An assistant grounded in SharePoint is ready for org-wide launch. The oversharing review is still outstanding.",
        options: [
          { id: "a", label: "Go — permissions are already in place" },
          { id: "b", label: "Conditional — launch to a pilot ring first" },
          {
            id: "c",
            label: "No-Go — remediate oversharing before any ring beyond IT",
            correct: true,
          },
          { id: "d", label: "Defer to the next release train" },
        ],
        explanation:
          "A grounded assistant surfaces existing over-permissioned content at speed and scale, so remediation must precede rollout. A pilot ring still exposes real over-shared data to real users.",
        domain: "platform",
        competencyIds: ["plat.release_mgmt", "sec.permission_trimming"],
      },
      {
        id: "pa-6",
        type: "find-risk",
        prompt:
          "Users may install any third-party connector from the platform's public marketplace themselves. Biggest risk?",
        options: [
          { id: "a", label: "Latency from additional API calls" },
          {
            id: "b",
            label: "Unreviewed connectors move corporate data to unvetted third parties",
            correct: true,
          },
          { id: "c", label: "Higher licence consumption" },
          { id: "d", label: "Duplicate results in search" },
        ],
        explanation:
          "Self-service install creates an unmanaged egress path and an unassessed subprocessor outside the contract. Licence cost is real but recoverable; the data movement is not.",
        domain: "platform",
        competencyIds: ["arch.connectors", "sec.data_exfil"],
      },
      {
        id: "pa-7",
        type: "choose-control",
        prompt:
          "Prompt and connector activity logs are held for 30 days in the vendor console only. Best control?",
        options: [
          { id: "a", label: "Ask the vendor to extend console retention to 90 days" },
          {
            id: "b",
            label: "Export logs to the SIEM with retention matched to the records policy",
            correct: true,
          },
          { id: "c", label: "Take a monthly export by screenshot" },
          { id: "d", label: "Enable email alerts on admin actions" },
        ],
        explanation:
          "SIEM export gives independent custody, correlation with identity events, and policy-aligned retention. Extending vendor retention leaves the only copy of your evidence under the vendor's control.",
        domain: "ops",
        competencyIds: ["plat.audit_logs", "sec.monitoring"],
      },
      {
        id: "pa-8",
        type: "mc",
        prompt:
          "Seat spend keeps rising while about half of assigned licences show no activity for 60 days. First action?",
        options: [
          { id: "a", label: "Negotiate a volume discount at renewal" },
          {
            id: "b",
            label: "Reclaim inactive seats from usage analytics, then right-size the commitment",
            correct: true,
          },
          { id: "c", label: "Cap tokens per user per day" },
          { id: "d", label: "Move everyone to a cheaper model tier" },
        ],
        explanation:
          "Usage analytics turns unused seats back into budget before the commitment is set. Discounting an oversized estate simply locks the waste in for another term.",
        domain: "ops",
        competencyIds: ["plat.finops", "plat.usage_analytics"],
      },
      {
        id: "pa-9",
        type: "find-risk",
        prompt:
          "A departing engineer owned several shared custom assistants and the credentials one agent uses. Biggest risk?",
        options: [
          { id: "a", label: "The assistants stop working immediately" },
          {
            id: "b",
            label: "Orphaned assets keep running with no accountable owner and stale credentials",
            correct: true,
          },
          { id: "c", label: "Conversation history is lost" },
          { id: "d", label: "The licence count drops" },
        ],
        explanation:
          "Disabling the user does not retire what they built; ownership must be reassigned and credentials rotated. Assuming the assistants stop is the common error — service-principal-backed automation usually keeps running.",
        domain: "platform",
        competencyIds: ["plat.offboarding", "gov.retirement"],
      },
      {
        id: "pa-10",
        type: "gate",
        prompt:
          "A vendor proposes a shared multi-tenant index holding your documents beside other customers', with logical separation only.",
        options: [
          { id: "a", label: "Go — logical separation is industry standard" },
          {
            id: "b",
            label:
              "Conditional — require tenant-scoped keys, isolation test evidence and contractual controls",
            correct: true,
          },
          { id: "c", label: "No-Go — only single-tenant deployment is acceptable" },
          { id: "d", label: "Defer to Legal" },
        ],
        explanation:
          "Logical isolation is acceptable when it is evidenced and contractually bound. Blanket rejection ignores how most SaaS works, but unverified separation is an assertion, not a control.",
        domain: "platform",
        competencyIds: ["arch.saas", "plr.dpa"],
      },
    ],
  },
  {
    id: "governance-operator",
    name: "AI Governance Operator — Practice Exam",
    roleId: "governance-operator",
    description:
      "Ten questions across intake, classification, reviewer selection, evidence, recertification and retirement.",
    questions: [
      {
        id: "go-1",
        type: "owner",
        prompt:
          "A team wants a new SharePoint-grounded RAG assistant. Which review path is REQUIRED?",
        options: [
          { id: "a", label: "Security only" },
          {
            id: "b",
            label: "Security + Privacy + Legal + QRM + Data Governance + IAM",
            correct: true,
          },
          { id: "c", label: "Governance committee only" },
          { id: "d", label: "None" },
        ],
        explanation: "RAG on internal data touches every review domain.",
        domain: "governance_grc",
      },
      {
        id: "go-2",
        type: "mc",
        prompt:
          "A team submits intake for an AI feature already running as a pilot. What must triage establish first?",
        options: [
          { id: "a", label: "Which model vendor the team has chosen" },
          {
            id: "b",
            label:
              "Purpose, data classification and affected populations — the inputs to the risk tier",
            correct: true,
          },
          { id: "c", label: "Expected annual run cost" },
          { id: "d", label: "Whether the pilot may continue meanwhile" },
        ],
        explanation:
          "Triage exists to route work, and the risk tier that decides the reviewers follows from purpose, data and impact. Vendor choice matters at review, not at routing.",
        domain: "governance_grc",
        competencyIds: ["gov.intake", "gov.risk_classification"],
      },
      {
        id: "go-3",
        type: "owner",
        prompt: "Who holds authority to approve go-live for a high-risk AI system?",
        options: [
          { id: "a", label: "The AI Governance Operator, who runs the workflow" },
          {
            id: "b",
            label: "The accountable business owner, on record, once required reviews have cleared",
            correct: true,
          },
          { id: "c", label: "The AI Security Architect" },
          { id: "d", label: "The steering committee chair by default" },
        ],
        explanation:
          "The operator orchestrates and evidences the workflow but does not carry the risk. Approval belongs to the business owner who will live with the consequences.",
        domain: "governance_grc",
        competencyIds: ["gov.approval_workflow", "plr.risk_acceptance"],
      },
      {
        id: "go-4",
        type: "find-risk",
        prompt:
          "The register of AI systems is a spreadsheet updated only when a team volunteers an entry. Biggest risk?",
        options: [
          { id: "a", label: "It duplicates the CMDB" },
          {
            id: "b",
            label:
              "Scope is unknown, so audit, recertification and incident response all miss systems",
            correct: true,
          },
          { id: "c", label: "It is difficult to sort and filter" },
          { id: "d", label: "Concurrent editors overwrite each other" },
        ],
        explanation:
          "Voluntary disclosure always understates the estate, and you cannot govern or contain what is not recorded. Overlap with the CMDB is an inconvenience, not a control failure.",
        domain: "governance_grc",
        competencyIds: ["gov.registry"],
      },
      {
        id: "go-5",
        type: "choose-control",
        prompt:
          "Reviewers approve in chat threads, and evidence is assembled from email when the auditor asks. Best control?",
        options: [
          { id: "a", label: "A quarterly reminder to file evidence" },
          {
            id: "b",
            label:
              "Approvals captured in the workflow tool and linked to the registry record at decision time",
            correct: true,
          },
          { id: "c", label: "A shared evidence folder per project" },
          { id: "d", label: "Longer email retention" },
        ],
        explanation:
          "Evidence captured at the moment of decision is contemporaneous and attributable. Reconstructing it afterwards produces the gaps auditors treat as a failed control.",
        domain: "governance_grc",
        competencyIds: ["gov.evidence_management", "gov.approval_workflow"],
      },
      {
        id: "go-6",
        type: "gate",
        prompt:
          "A team asks to ship without a completed privacy review, promising to close it shortly after launch.",
        options: [
          { id: "a", label: "Go — the commitment is sufficient" },
          {
            id: "b",
            label:
              "Conditional — time-bound exception with a named owner, compensating controls and a review date",
            correct: true,
          },
          { id: "c", label: "No-Go — exceptions are never granted" },
          { id: "d", label: "Defer until the review completes" },
        ],
        explanation:
          "Exceptions are legitimate when bounded, owned and compensated. An open-ended promise is an unrecorded risk acceptance that no one will revisit.",
        domain: "governance_grc",
        competencyIds: ["gov.exceptions", "gov.approval_workflow"],
      },
      {
        id: "go-7",
        type: "mc",
        prompt:
          "How often should an approved high-risk AI system have its controls and permissions recertified?",
        options: [
          { id: "a", label: "Once, at go-live" },
          {
            id: "b",
            label: "On a defined cycle and on material change, whichever comes first",
            correct: true,
          },
          { id: "c", label: "Only after an incident" },
          { id: "d", label: "At each contract renewal" },
        ],
        explanation:
          "Data sources, prompts and permissions drift, so recertification must be both periodic and change-triggered. Waiting for an incident makes the control detective at best.",
        domain: "governance_grc",
        competencyIds: ["gov.recertification", "gov.registry"],
      },
      {
        id: "go-8",
        type: "find-risk",
        prompt:
          "A retired assistant is switched off, but its index, connectors and service principal remain in place.",
        options: [
          { id: "a", label: "Users see confusing errors" },
          {
            id: "b",
            label: "Dormant credentials and a copied data set stay reachable and unmonitored",
            correct: true,
          },
          { id: "c", label: "The registry entry becomes stale" },
          { id: "d", label: "Storage costs continue" },
        ],
        explanation:
          "Decommissioning must remove identities and derived copies of data, not just the front end. A stale registry entry is a symptom; the live credential and index are the exposure.",
        domain: "governance_grc",
        competencyIds: ["gov.retirement", "sec.blast_radius"],
      },
      {
        id: "go-9",
        type: "choose-control",
        prompt:
          "Teams argue about which reviews apply, so every intake becomes a negotiation. Best control?",
        options: [
          { id: "a", label: "Escalate each dispute to the steering committee" },
          {
            id: "b",
            label: "A published applicability matrix keyed to risk tier and data classification",
            correct: true,
          },
          { id: "c", label: "Require every review for every request" },
          { id: "d", label: "Let the sponsoring executive decide" },
        ],
        explanation:
          "A published matrix makes routing deterministic and defensible before the argument starts. Requiring every review for everything creates queues that teams then work around.",
        domain: "governance_grc",
        competencyIds: ["gov.review_applicability", "gov.risk_classification"],
      },
      {
        id: "go-10",
        type: "mc",
        prompt: "An auditor asks for proof that a live AI system was approved. What is sufficient?",
        options: [
          { id: "a", label: "The system appears in the registry as approved" },
          {
            id: "b",
            label:
              "A dated record naming the approver, the scope approved and the reviews relied on",
            correct: true,
          },
          { id: "c", label: "An email from the sponsor confirming approval" },
          { id: "d", label: "The completed security questionnaire" },
        ],
        explanation:
          "Audit needs attribution, date and scope so the decision can be tested against policy. A registry status shows the outcome was recorded, not who decided it or on what basis.",
        domain: "governance_grc",
        competencyIds: ["gov.evidence_management", "gov.registry"],
      },
    ],
  },
  {
    id: "solution-architect",
    name: "AI Solution Architect — Practice Exam",
    roleId: "solution-architect",
    description:
      "Ten questions across trust boundaries, RAG and agent architecture, NFRs, promotion and observability.",
    questions: [
      {
        id: "arch-1",
        type: "mc",
        prompt: "You are asked to add a chatbot to help find HR policies. Best pattern?",
        options: [
          { id: "a", label: "Fine-tuned model on policies" },
          { id: "b", label: "Permission-aware RAG with citations", correct: true },
          { id: "c", label: "An agent with 5 tools" },
          { id: "d", label: "A search box" },
        ],
        explanation:
          "RAG with citations is the standard pattern for grounded Q&A over enterprise content.",
        domain: "architecture",
      },
      {
        id: "sla-2",
        type: "mc",
        prompt:
          "The requirement is summarising public product documentation for customers, with no proprietary data. Best build decision?",
        options: [
          { id: "a", label: "Host a model in-house for full control" },
          {
            id: "b",
            label: "Managed SaaS capability — no differentiating data or logic is involved",
            correct: true,
          },
          { id: "c", label: "Fine-tune a base model on the documentation" },
          { id: "d", label: "Hybrid, with a private index for the public content" },
        ],
        explanation:
          "Build where differentiation or data sensitivity demands it; commodity summarisation over public content does not justify the operating cost of in-house hosting.",
        domain: "architecture",
        competencyIds: ["arch.bcbe", "arch.saas"],
      },
      {
        id: "sla-3",
        type: "find-risk",
        prompt:
          "A design shows the browser calling the model API directly, with the API key held in client code.",
        options: [
          { id: "a", label: "An extra network hop is avoided" },
          {
            id: "b",
            label: "The key crosses the trust boundary and can be extracted and reused",
            correct: true,
          },
          { id: "c", label: "CORS configuration becomes complex" },
          { id: "d", label: "Latency is harder to measure" },
        ],
        explanation:
          "Anything shipped to the client is public, so the call must be brokered by a server that holds the credential and enforces authorisation per user.",
        domain: "architecture",
        competencyIds: ["arch.dataflow", "sec.secrets"],
      },
      {
        id: "sla-4",
        type: "choose-control",
        prompt:
          "One RAG index serves several departments with different access rights. Best design control?",
        options: [
          { id: "a", label: "A separate index per department" },
          {
            id: "b",
            label: "Query-time security trimming using the caller's identity and document ACLs",
            correct: true,
          },
          { id: "c", label: "Instruct the model to withhold restricted content" },
          { id: "d", label: "A distinct system prompt per department" },
        ],
        explanation:
          "Trimming at retrieval keeps the source permissions authoritative at query time. Asking the model to withhold content means the restricted text has already entered the context.",
        domain: "architecture",
        competencyIds: ["arch.rag", "sec.permission_trimming"],
      },
      {
        id: "sla-5",
        type: "owner",
        prompt:
          "Who owns defining latency, availability and groundedness targets for a new AI service?",
        options: [
          { id: "a", label: "The Platform Admin who runs the tenant" },
          {
            id: "b",
            label:
              "The Solution Architect, agreed with the business owner and testable before build",
            correct: true,
          },
          { id: "c", label: "The model vendor, through its SLA" },
          { id: "d", label: "The engineering team, measured after release" },
        ],
        explanation:
          "Non-functional requirements are architectural commitments set with the sponsor and made measurable up front. A vendor SLA covers one component, not your end-to-end service.",
        domain: "architecture",
        competencyIds: ["arch.nfrs", "arch.observability"],
      },
      {
        id: "sla-6",
        type: "find-risk",
        prompt:
          "An agent design lets the planner retry failed tool calls with progressively wider parameters until one succeeds.",
        options: [
          { id: "a", label: "Token cost grows with each retry" },
          {
            id: "b",
            label:
              "Retries explore the permission surface until an unintended state change succeeds",
            correct: true,
          },
          { id: "c", label: "Responses become slower" },
          { id: "d", label: "Log volume increases" },
        ],
        explanation:
          "Retry-until-success turns a bounded tool contract into a search for whatever the agent is still allowed to do. Cost and latency are symptoms of the same loop, not the risk.",
        domain: "architecture",
        competencyIds: ["arch.agents", "sec.agent_tool_misuse"],
      },
      {
        id: "sla-7",
        type: "gate",
        prompt:
          "A team wants to promote a prototype to production using the same workspace, index and keys as development.",
        options: [
          { id: "a", label: "Go — the code is unchanged" },
          { id: "b", label: "Conditional — add monitoring before promotion" },
          {
            id: "c",
            label: "No-Go — separate environments, credentials and data first",
            correct: true,
          },
          { id: "d", label: "Defer until the next quarter" },
        ],
        explanation:
          "A shared environment merges test data with production identity, so a development mistake becomes a production incident. Monitoring would detect that, not prevent it.",
        domain: "architecture",
        competencyIds: ["eng.cicd", "arch.iam"],
      },
      {
        id: "sla-8",
        type: "mc",
        prompt:
          "The model provider starts returning throttling errors at peak load. Which design response is sound?",
        options: [
          { id: "a", label: "Retry immediately in a tight loop" },
          {
            id: "b",
            label:
              "Backoff with jitter, queue deferrable work, and degrade to cached or non-AI results",
            correct: true,
          },
          { id: "c", label: "Raise the client timeout" },
          { id: "d", label: "Move the whole service to a larger model" },
        ],
        explanation:
          "Backoff plus graceful degradation protects the user journey and the shared quota. Tight retries amplify the very overload that triggered the throttling.",
        domain: "architecture",
        competencyIds: ["arch.resilience", "arch.nfrs"],
      },
      {
        id: "sla-9",
        type: "choose-control",
        prompt:
          "A summarisation feature is accurate but too slow and too costly at volume. Best first move?",
        options: [
          { id: "a", label: "Buy reserved capacity from the provider" },
          {
            id: "b",
            label:
              "Route by task complexity to a smaller model, cache repeats, keep the large model for hard cases",
            correct: true,
          },
          { id: "c", label: "Shorten the system prompt" },
          { id: "d", label: "Limit the feature to fewer users" },
        ],
        explanation:
          "Tiered routing and caching attack the dominant cost and latency driver while preserving quality where it matters. Reserved capacity just pre-pays for the same inefficiency.",
        domain: "architecture",
        competencyIds: ["arch.cost", "eng.model_selection"],
      },
      {
        id: "sla-10",
        type: "find-risk",
        prompt:
          "The service logs HTTP status codes only — no prompt version, retrieval sources or token counts.",
        options: [
          { id: "a", label: "Log storage costs rise" },
          {
            id: "b",
            label: "Quality regressions cannot be diagnosed or attributed to a change",
            correct: true,
          },
          { id: "c", label: "Dashboards render slowly" },
          { id: "d", label: "Capacity planning becomes harder" },
        ],
        explanation:
          "Without prompt version and retrieved sources you cannot separate a retrieval fault from a prompt change. Status codes report availability, which is the narrowest part of AI service health.",
        domain: "architecture",
        competencyIds: ["arch.observability", "eng.observability"],
      },
    ],
  },
  {
    id: "grc-lead",
    name: "Enterprise AI GRC Lead — Practice Exam",
    roleId: "grc-lead",
    description:
      "Ten questions across risk appetite, residual acceptance, regulatory mapping, third-party risk and control testing.",
    questions: [
      {
        id: "grc-1",
        type: "gate",
        prompt:
          "A business unit proposes a fourth chat AI platform 'to compare.' You already have three.",
        options: [
          { id: "a", label: "Go" },
          {
            id: "b",
            label: "Conditional — 30-day AI Lab bake-off, retire one before adding",
            correct: true,
          },
          { id: "c", label: "No-Go — reject" },
          { id: "d", label: "Defer" },
        ],
        explanation: "Rationalize platforms; do not accumulate.",
        domain: "governance_grc",
      },
      {
        id: "gl-2",
        type: "mc",
        prompt: "What determines an AI system's risk tier?",
        options: [
          { id: "a", label: "The size of the model behind it" },
          {
            id: "b",
            label: "Impact on people and the business, data sensitivity, and the system's autonomy",
            correct: true,
          },
          { id: "c", label: "The project budget" },
          { id: "d", label: "Whether the vendor is on the approved list" },
        ],
        explanation:
          "Tiering measures potential harm and how much the system decides unsupervised, which sets the depth of control. Approved-vendor status reduces supplier risk but not the inherent tier.",
        domain: "governance_grc",
        competencyIds: ["gov.risk_classification"],
      },
      {
        id: "gl-3",
        type: "owner",
        prompt:
          "A high-risk system will go live with a known unmitigated gap. Who may accept the residual risk?",
        options: [
          { id: "a", label: "The security architect who identified the gap" },
          {
            id: "b",
            label:
              "The accountable executive within delegated appetite, recorded with an expiry date",
            correct: true,
          },
          { id: "c", label: "The delivery project manager" },
          { id: "d", label: "The GRC Lead, as risk owner of record" },
        ],
        explanation:
          "Acceptance is a business decision bounded by delegated authority and must be documented and time-limited. Assessors and GRC identify and record risk; they do not own it.",
        domain: "governance_grc",
        competencyIds: ["plr.risk_acceptance", "gov.exceptions"],
      },
      {
        id: "gl-4",
        type: "choose-control",
        prompt:
          "A vendor may add new model subprocessors in other regions mid-contract. Best control?",
        options: [
          { id: "a", label: "An annual vendor security questionnaire" },
          {
            id: "b",
            label:
              "Contractual subprocessor notice with a right to object, plus register and residency checks",
            correct: true,
          },
          { id: "c", label: "Penetration testing of the vendor's platform" },
          { id: "d", label: "Encryption at rest across the estate" },
        ],
        explanation:
          "Notice and objection rights make supply-chain change visible while you can still act on it. An annual questionnaire discovers the same change up to twelve months late.",
        domain: "privacy_legal_risk",
        competencyIds: ["plr.subprocessors", "plr.residency"],
      },
      {
        id: "gl-5",
        type: "gate",
        prompt:
          "A proposed assistant will score employee productivity from meeting transcripts. No impact assessment has begun.",
        options: [
          { id: "a", label: "Go — the transcripts are already retained" },
          { id: "b", label: "Conditional — run the assessment in parallel with the build" },
          {
            id: "c",
            label:
              "No-Go — systematic evaluation of individuals requires the assessment before processing",
            correct: true,
          },
          { id: "d", label: "Defer to the employee representative body" },
        ],
        explanation:
          "Systematic monitoring and scoring of individuals is a standard assessment trigger, and the assessment must precede processing. Running it in parallel means processing starts unassessed.",
        domain: "privacy_legal_risk",
        competencyIds: ["plr.pii", "plr.purpose"],
      },
      {
        id: "gl-6",
        type: "find-risk",
        prompt:
          "Controls are mapped to a single framework, and each new regulation triggers a fresh, separate control set.",
        options: [
          { id: "a", label: "More documentation to maintain" },
          {
            id: "b",
            label:
              "Duplicated controls diverge, are tested inconsistently and produce contradictory evidence",
            correct: true,
          },
          { id: "c", label: "Higher external audit fees" },
          { id: "d", label: "Slower onboarding for new staff" },
        ],
        explanation:
          "A common control set mapped to many obligations is tested once and satisfies each. Parallel sets drift apart, so the same control passes in one regime and fails in another.",
        domain: "governance_grc",
        competencyIds: ["gov.evidence_management", "gov.review_applicability"],
      },
      {
        id: "gl-7",
        type: "mc",
        prompt:
          "An AI assistant exposed personal data to staff who should not have seen it. What starts the reporting clock?",
        options: [
          { id: "a", label: "Completion of remediation" },
          {
            id: "b",
            label: "The organisation becoming aware, against each affected jurisdiction's deadline",
            correct: true,
          },
          { id: "c", label: "The vendor confirming root cause" },
          { id: "d", label: "The next scheduled risk committee" },
        ],
        explanation:
          "Statutory clocks run from awareness, so notification is often filed while investigation continues. Waiting for vendor confirmation routinely forfeits the deadline.",
        domain: "privacy_legal_risk",
        competencyIds: ["sec.ir", "plr.pii"],
      },
      {
        id: "gl-8",
        type: "choose-control",
        prompt:
          "Control tests are performed, but results sit in the tester's mailbox and are purged each year. Best control?",
        options: [
          { id: "a", label: "Ask testers to keep their results for longer" },
          {
            id: "b",
            label:
              "File results in the evidence repository against the control, under the records retention schedule",
            correct: true,
          },
          { id: "c", label: "Re-run the tests shortly before each audit" },
          { id: "d", label: "Rely on the vendor's certification report" },
        ],
        explanation:
          "Evidence must outlive the tester and be retrievable against the control it proves. Re-testing before an audit shows the control works today, not that it operated throughout the period.",
        domain: "governance_grc",
        competencyIds: ["gov.evidence_management", "plr.retention"],
      },
      {
        id: "gl-9",
        type: "find-risk",
        prompt:
          "The exception register holds forty open items, a third of them past their review date. Biggest risk?",
        options: [
          { id: "a", label: "Administrative overhead on the GRC team" },
          {
            id: "b",
            label:
              "Exceptions have become the operating policy, and aggregate risk quietly exceeds appetite",
            correct: true,
          },
          { id: "c", label: "Auditors will raise findings" },
          { id: "d", label: "Teams lose confidence in the policy" },
        ],
        explanation:
          "Expired exceptions accumulate into unmeasured residual risk that no one has accepted afresh. Audit findings follow from that breach; they are not the harm itself.",
        domain: "governance_grc",
        competencyIds: ["gov.exceptions", "plr.risk_acceptance"],
      },
      {
        id: "gl-10",
        type: "mc",
        prompt: "What belongs in the quarterly board report on AI risk?",
        options: [
          { id: "a", label: "An inventory of every model and assistant in use" },
          {
            id: "b",
            label:
              "Exposure against appetite, tier movements, open exceptions and control test outcomes, with trend",
            correct: true,
          },
          { id: "c", label: "Prompt and evaluation metrics per application" },
          { id: "d", label: "Vendor pricing and licence comparisons" },
        ],
        explanation:
          "A board needs position against appetite and direction of travel in order to decide. An inventory is operational detail that shows what exists, not whether risk is being managed.",
        domain: "governance_grc",
        competencyIds: ["gov.registry", "plr.risk_acceptance"],
      },
    ],
  },
];

export const examsById: Record<string, ExamDef> = Object.fromEntries(exams.map((e) => [e.id, e]));
