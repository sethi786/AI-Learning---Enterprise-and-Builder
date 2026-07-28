import type { LabBlueprint } from "./labEngineTypes";

/**
 * Runnable blueprints for the labs that previously offered reading and a quiz
 * only. Every lab in the catalogue now has one, so "open the lab" and "run the
 * lab" are the same promise everywhere rather than in three places.
 *
 * Authoring rules these all follow:
 *  - Config knobs must be things a real practitioner actually sets, and at
 *    least one plausible-but-wrong default, so an untouched form scores badly.
 *  - Every injection has a distractor that is *reasonable* — a control that
 *    helps but does not address the failure — not an obviously silly option.
 *  - Rubric weights encode what would actually get flagged in a real review.
 *  - The artifact is the document this work produces in the real job.
 */

const zeroTrustLab: LabBlueprint = {
  id: "zero-trust-access",
  name: "Zero Trust for an AI Assistant",
  tagline: "The assistant works. Now prove every request is authorised.",
  domain: "security",
  competencyIds: ["sec.zero_trust", "arch.iam", "sec.network", "sec.data_exfil"],
  summary:
    "A department-wide AI assistant is live and popular. Security has 10 days to bring it under the same Zero Trust posture as every other tier-1 application: identity-bound calls, device conditions, private networking, and egress control.",
  config: [
    {
      id: "identityFlow",
      label: "How the app calls the data source",
      type: "select",
      default: "service-principal",
      options: [
        { value: "service-principal", label: "Shared service principal with broad read" },
        { value: "obo", label: "On-behalf-of: caller's token flows to the data source" },
        { value: "per-user-key", label: "Per-user API key stored in the app database" },
      ],
      help: "Determines whose permissions are actually enforced at the data layer.",
    },
    {
      id: "conditionalAccess",
      label: "Conditional access on the AI app",
      type: "select",
      default: "none",
      options: [
        { value: "none", label: "None — inherits tenant baseline only" },
        { value: "mfa", label: "Require MFA" },
        { value: "mfa-compliant-device", label: "Require MFA + compliant/managed device" },
      ],
    },
    {
      id: "networkPath",
      label: "Model endpoint network path",
      type: "select",
      default: "public-with-key",
      options: [
        { value: "public-with-key", label: "Public endpoint, API key auth" },
        { value: "public-with-firewall", label: "Public endpoint, IP allowlist" },
        { value: "private-endpoint", label: "Private endpoint, no public route" },
      ],
    },
    {
      id: "egressControl",
      label: "Outbound tool/browse egress allowlist",
      type: "toggle",
      default: false,
      help: "Without it, a tool-enabled model can reach any host it can name.",
    },
    {
      id: "sessionLifetime",
      label: "Access token lifetime (minutes)",
      type: "select",
      default: "480",
      options: [
        { value: "60", label: "60" },
        { value: "240", label: "240" },
        { value: "480", label: "480 (8h)" },
      ],
      help: "Revocation is only as fast as your shortest token.",
    },
  ],
  steps: [
    {
      id: "baseline",
      title: "1. Baseline the current access path",
      narrative:
        "Before changing anything, trace one real request end to end and write down which identity touches which system. Most Zero Trust findings are discovered here, not in a scanner.",
      logs: [
        "[trace] request_id=8f21 user=m.okafor@contoso.com device=BYOD-unmanaged",
        "[trace] app → graph: identity=sp-ai-assistant scope=Files.Read.All (application)",
        "[trace] graph returned 41 documents across 6 sites",
        "[trace] user's own SharePoint access covers 2 of those 6 sites",
      ],
    },
    {
      id: "enforce",
      title: "2. Apply identity, device and network controls",
      narrative:
        "Roll your configuration into the pilot ring. Watch for the calls that break — breakage here is the point, it tells you what was silently over-permissioned.",
      logs: [
        "[policy] applying conditional access to app=ai-assistant ring=pilot(120 users)",
        "[policy] token lifetime updated",
        "[net] endpoint reachability check running",
      ],
    },
    {
      id: "verify",
      title: "3. Verify with two accounts at different clearance",
      narrative:
        "The only test that matters: two real accounts, same question, different entitlements. If both get the same answer, your controls are decorative.",
      logs: [
        "[verify] account_a=partner clearance=high",
        "[verify] account_b=intern clearance=low",
        "[verify] prompt='summarise the Meridian acquisition timeline'",
      ],
    },
  ],
  injections: [
    {
      id: "byod",
      atStep: 2,
      kind: "policy",
      title: "An executive is blocked on a personal iPad",
      logs: [
        "[ca] deny user=r.viera@contoso.com device=iPad-personal reason=device_not_compliant",
        "[servicedesk] P2 raised: 'CFO cannot use the AI assistant from home'",
        "[servicedesk] escalated to CISO within 20 minutes",
      ],
      prompt: "The CFO wants an exception by end of day. What do you take to the CISO?",
      choices: [
        {
          id: "exclude",
          label: "Exclude the executive group from the device condition",
          scoreDelta: -3,
          explain:
            "This removes the control from exactly the accounts with the widest data access. Exceptions that track seniority invert the risk model — the CFO's session reaches more than the intern's.",
        },
        {
          id: "app-protection",
          label:
            "Allow unmanaged devices but require an app-protection policy: no download, no copy-out, session-bound browser access",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[ca] policy updated: unmanaged → browser-only session, download blocked",
            "[ca] user=r.viera session granted mode=restricted",
          ],
          explain:
            "Correct. Zero Trust does not mean binary allow/deny — it means the access level matches the trust level of the request. A restricted session keeps the data inside the session boundary while unblocking the user.",
        },
        {
          id: "vpn",
          label: "Require corporate VPN instead of device compliance",
          scoreDelta: -1,
          explain:
            "Network location is not identity or device posture. A VPN from a compromised personal device is still a compromised device, and this trades a real control for a weaker one.",
        },
      ],
    },
    {
      id: "exfil",
      atStep: 3,
      kind: "attack",
      title: "The assistant is asked to summarise into an external form",
      logs: [
        "[tool] browse.post url=https://forms.gle/x8Kd2 body=<1,842 chars of retrieved content>",
        "[tool] request originated from model turn, not user turn",
        "[dlp] no rule matched: destination not in blocklist",
      ],
      prompt:
        "A user prompt caused the model to POST retrieved internal content to an external form. Egress was allowed because the destination was not on any blocklist. What is the fix?",
      choices: [
        {
          id: "blocklist",
          label: "Add forms.gle and similar sites to the DLP blocklist",
          scoreDelta: -1,
          explain:
            "Blocklists are a losing race — there is always another host. This closes one URL and leaves the pattern open.",
        },
        {
          id: "allowlist",
          label:
            "Switch tool egress to an allowlist of approved hosts and require the destination to be resolved before the call, not after",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[egress] mode=allowlist hosts=12",
            "[egress] blocked POST forms.gle (not on allowlist)",
          ],
          explain:
            "Correct. Default-deny is the only egress posture that survives contact with a model that can name arbitrary hosts. The allowlist is small and reviewable; the blocklist is infinite.",
        },
        {
          id: "log",
          label: "Log all outbound tool calls and review weekly",
          scoreDelta: 0,
          explain:
            "Necessary but not sufficient. Detection after the fact does not prevent the disclosure, and weekly review means a week of exposure.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "obo",
      label: "Data access is bound to the calling user's identity",
      weight: 3,
      check: (c) => c.identityFlow === "obo",
      remedy:
        "Flow the caller's token to the data source. A shared service principal enforces the app's permissions, not the user's.",
    },
    {
      id: "device",
      label: "Conditional access requires MFA and evaluates device state",
      weight: 3,
      check: (c) => c.conditionalAccess === "mfa-compliant-device",
      remedy: "MFA alone does not tell you whether the endpoint reading the answer is trusted.",
    },
    {
      id: "private",
      label: "Model endpoint has no public route",
      weight: 2,
      check: (c) => c.networkPath === "private-endpoint",
      remedy: "An API key on a public endpoint is one leaked secret away from open access.",
    },
    {
      id: "egress",
      label: "Tool egress is default-deny",
      weight: 2,
      check: (c) => c.egressControl === true,
      remedy: "Allowlist outbound hosts; a tool-enabled model can otherwise reach anything.",
    },
    {
      id: "token",
      label: "Token lifetime short enough for revocation to matter",
      weight: 1,
      check: (c) => c.sessionLifetime === "60" || c.sessionLifetime === "240",
      remedy: "An 8-hour token means a disabled account keeps working for most of a working day.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "The caller's identity reaches the data source, the device is evaluated on every session, the model endpoint is unreachable from the internet, egress is default-deny, and revocation takes effect in hours rather than days. Two accounts at different clearance get demonstrably different answers.",
    },
    {
      section: "Common trap",
      body: "Granting an exception to the most senior people. Executive accounts have the broadest entitlements, so an exception there carries more risk than the control was removing. Give them a lower-trust session instead of a higher-trust bypass.",
    },
    {
      section: "How this maps to real work",
      body: "This is the substance of a Security Architecture Review for an AI application. The reviewer is asking one question in five different ways: when this app reads data, whose permissions apply? Everything else — network, device, token lifetime — narrows the window if that answer is ever wrong.",
    },
  ],
  artifact: {
    name: "Zero Trust Access Review",
    build: ({ cfg, score, max, passedRubric, failedRubric }) =>
      [
        `# Zero Trust Access Review — Department AI Assistant`,
        ``,
        `_Practice artifact from Lab Engine. Not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Access path as configured`,
        `- Data-source identity: ${cfg.identityFlow}`,
        `- Conditional access: ${cfg.conditionalAccess}`,
        `- Model endpoint: ${cfg.networkPath}`,
        `- Tool egress allowlist: ${cfg.egressControl}`,
        `- Token lifetime: ${cfg.sessionLifetime} minutes`,
        ``,
        `## Controls satisfied`,
        ...(passedRubric.length ? passedRubric.map((r) => `- ${r}`) : ["- none"]),
        ``,
        `## Findings to remediate before production`,
        ...(failedRubric.length ? failedRubric.map((r) => `- ${r}`) : ["- none"]),
        ``,
        `## Verification performed`,
        `- Two accounts at differing clearance issued the same prompt and results were compared.`,
      ].join("\n"),
  },
};

const privacyLab: LabBlueprint = {
  id: "privacy-impact",
  name: "Privacy Impact Assessment — HR Copilot",
  tagline: "Personal data, an employment context, and a model that remembers.",
  domain: "privacy_legal_risk",
  competencyIds: ["plr.pii", "plr.minimization", "plr.purpose", "plr.retention", "plr.residency"],
  summary:
    "HR wants a copilot over the employee case management system: grievances, performance notes, occupational health referrals. You run the PIA. Decide what the system may ingest, where it may run, how long anything survives, and what a data subject can demand.",
  config: [
    {
      id: "scope",
      label: "Corpus scope",
      type: "select",
      default: "all-hr",
      options: [
        { value: "all-hr", label: "Everything in the HR case system" },
        { value: "policy-only", label: "Policy and process documents only" },
        { value: "policy-plus-anonymised", label: "Policy documents plus de-identified case data" },
      ],
      help: "Minimisation is a legal test, not a preference.",
    },
    {
      id: "specialCategory",
      label: "Handling of special-category data (health, union, disability)",
      type: "select",
      default: "include",
      options: [
        { value: "include", label: "Ingest with the rest" },
        { value: "exclude", label: "Exclude at ingest by classification label" },
        { value: "redact", label: "Ingest with special-category fields redacted" },
      ],
    },
    {
      id: "residency",
      label: "Processing region",
      type: "select",
      default: "global",
      options: [
        { value: "global", label: "Provider default (may route anywhere)" },
        { value: "eu", label: "Pinned to EU region" },
        { value: "in-country", label: "In-country deployment matching the workforce" },
      ],
    },
    {
      id: "retention",
      label: "Prompt and output retention",
      type: "select",
      default: "90d",
      options: [
        { value: "0d", label: "Zero retention (no prompt logging)" },
        { value: "30d", label: "30 days, access-controlled" },
        { value: "90d", label: "90 days" },
        { value: "indefinite", label: "Indefinite, for quality improvement" },
      ],
    },
    {
      id: "training",
      label: "Provider may train on tenant data",
      type: "toggle",
      default: false,
    },
    {
      id: "dsrPath",
      label: "Documented deletion path covering the vector index",
      type: "toggle",
      default: false,
      help: "Deleting the source row does not delete the embedding derived from it.",
    },
  ],
  steps: [
    {
      id: "map",
      title: "1. Map the data before you assess it",
      narrative:
        "List every category of personal data in scope, the lawful basis for each, and who currently sees it. A PIA that starts at the model has already skipped the part that matters.",
      logs: [
        "[inventory] case_notes=41,280 records",
        "[inventory] contains: name, employee_id, manager, free-text narrative",
        "[inventory] special_category detected in 6,113 records (occupational health, disability adjustments)",
        "[inventory] lawful_basis: legitimate_interest (HR administration)",
      ],
    },
    {
      id: "assess",
      title: "2. Assess the delta the AI introduces",
      narrative:
        "The data already exists and is already processed. Your assessment is about what changes: new access paths, new inference, new copies, new retention.",
      logs: [
        "[delta] new copy created: vector index (derived personal data)",
        "[delta] new access path: any HR user can query across all cases in natural language",
        "[delta] new inference: model may synthesise patterns across individuals",
      ],
    },
    {
      id: "consult",
      title: "3. Consult and record the residual risk",
      narrative:
        "Works council, DPO, and the affected population. Their objections belong in the record whether or not you accept them.",
      logs: [
        "[consult] works_council: objection filed re: performance profiling",
        "[consult] dpo: conditional approval pending retention decision",
      ],
    },
  ],
  injections: [
    {
      id: "search-power",
      atStep: 2,
      kind: "policy",
      title: "The pilot reveals an unintended capability",
      logs: [
        "[pilot] query by hr_user_14: 'which employees have raised more than one grievance'",
        "[pilot] response listed 23 named individuals with case counts and summaries",
        "[pilot] the source system has no equivalent report and no permission for it",
      ],
      prompt:
        "The assistant answered a question the underlying system was deliberately not built to answer. What does the PIA require here?",
      choices: [
        {
          id: "accept",
          label: "Note it as an efficiency benefit — the data was already accessible to HR",
          scoreDelta: -3,
          explain:
            "Accessible individually is not the same as aggregable instantly. Purpose limitation binds the processing, not just the storage, and this is a new purpose that no one assessed or consented to.",
        },
        {
          id: "purpose-bound",
          label:
            "Treat it as a new processing purpose: restrict aggregate queries across data subjects, and re-run the assessment for any profiling use",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[policy] cross-subject aggregation blocked at retrieval",
            "[policy] profiling use-case routed back to DPO for separate assessment",
          ],
          explain:
            "Correct. The capability is genuinely new even though the data is not. Purpose limitation applies to the processing operation — and profiling employees carries its own obligations, including a right to human review.",
        },
        {
          id: "train",
          label: "Add HR user training on appropriate queries",
          scoreDelta: 0,
          explain:
            "Training is a reasonable supplement but it is not a control. If the only thing standing between the tool and unlawful profiling is user judgement, the assessment has not landed.",
        },
      ],
    },
    {
      id: "erasure",
      atStep: 3,
      kind: "failure",
      title: "An erasure request arrives",
      logs: [
        "[dsr] erasure request received: employee_id=44192, leaver, cites Art.17",
        "[source] 14 case records deleted from HR system",
        "[index] similarity search for 'Bartosz W' still returns 3 chunks",
        "[index] chunk text includes narrative detail from a deleted grievance",
      ],
      prompt:
        "The source rows are gone but the vector index still returns the content. What is the correct remediation?",
      choices: [
        {
          id: "filter",
          label: "Add the employee to a suppression list so results are filtered at query time",
          scoreDelta: -2,
          explain:
            "The personal data is still held. A filter is a display change, and it fails the moment someone queries the index directly, restores a snapshot, or exports the collection.",
        },
        {
          id: "delete-reindex",
          label:
            "Delete the derived vectors by source-document id and prove it, then make deletion propagation a scheduled job rather than a manual one",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[index] deleted 3 vectors by source_id",
            "[index] deletion propagation job scheduled: source → index, daily + on-event",
            "[dsr] evidence captured for the erasure record",
          ],
          explain:
            "Correct. The embedding is a copy of personal data and is in scope for erasure. Doing it by hand once is not a compliant process — the obligation recurs, so the propagation has to be a job with evidence.",
        },
        {
          id: "wait",
          label: "Let the next full re-index drop it, scheduled monthly",
          scoreDelta: -1,
          explain:
            "Erasure has a statutory clock measured in days, not a re-index cadence. It also leaves you unable to evidence completion when asked.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "minimise",
      label: "Corpus minimised rather than 'everything we have'",
      weight: 3,
      check: (c) => c.scope !== "all-hr",
      remedy:
        "Ingesting the whole case system fails minimisation before any control is considered.",
    },
    {
      id: "special",
      label: "Special-category data excluded or redacted",
      weight: 3,
      check: (c) => c.specialCategory !== "include",
      remedy:
        "Health and disability data carries a higher bar and generally a different lawful basis. It does not belong in a general-purpose HR corpus.",
    },
    {
      id: "residency",
      label: "Processing pinned to a lawful region",
      weight: 2,
      check: (c) => c.residency !== "global",
      remedy: "Provider-default routing gives you no transfer story to put in the record.",
    },
    {
      id: "retention",
      label: "Prompt retention bounded",
      weight: 2,
      check: (c) => c.retention === "0d" || c.retention === "30d",
      remedy:
        "Prompts here contain the case narrative. Indefinite or 90-day retention creates a second copy of the most sensitive text with weaker controls than the source.",
    },
    {
      id: "training",
      label: "Provider training on tenant data disabled",
      weight: 2,
      check: (c) => c.training === false,
      remedy: "Employee case data must not leave the controller's purpose.",
    },
    {
      id: "dsr",
      label: "Deletion propagates to derived vectors, with evidence",
      weight: 3,
      check: (c) => c.dsrPath === true,
      remedy:
        "An erasure request you cannot complete in the index is an erasure request you failed.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "A minimised corpus with special-category data kept out, processing pinned to a lawful region, prompt retention measured in days, no provider training, and a deletion path that reaches the vector index and produces evidence. The works council objection is recorded whether or not it was upheld.",
    },
    {
      section: "Common trap",
      body: "Assessing the model and skipping the delta. The data existed before, so it feels assessed — but the AI adds a new copy, a new access path, and a new inference capability. Each is separately assessable, and the aggregation capability is usually the one nobody wrote down.",
    },
    {
      section: "How this maps to real work",
      body: "This is a DPIA in everything but name, and the questions map to the statutory ones: necessity and proportionality, lawful basis for each category, transfers, retention, data subject rights, and residual risk with a consultation record. The vector index is the part most first drafts miss.",
    },
  ],
  artifact: {
    name: "Privacy Impact Assessment",
    build: ({ cfg, score, max, failedRubric }) =>
      [
        `# Privacy Impact Assessment — HR Copilot`,
        ``,
        `_Practice artifact from Lab Engine. Not a real assessment and not legal advice._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Processing description`,
        `- Corpus scope: ${cfg.scope}`,
        `- Special-category handling: ${cfg.specialCategory}`,
        `- Processing region: ${cfg.residency}`,
        `- Prompt/output retention: ${cfg.retention}`,
        `- Provider training on tenant data: ${cfg.training}`,
        `- Deletion propagates to derived vectors: ${cfg.dsrPath}`,
        ``,
        `## Residual risks accepted`,
        ...(failedRubric.length
          ? failedRubric.map((f) => `- ${f}`)
          : ["- none outstanding at time of assessment"]),
        ``,
        `## Consultation`,
        `- Works council: objection recorded regarding profiling.`,
        `- DPO: approval conditional on retention and erasure propagation.`,
      ].join("\n"),
  },
};

const legalLab: LabBlueprint = {
  id: "legal-review",
  name: "Legal Review — Vendor AI in Client Delivery",
  tagline: "Read the contract you already signed before you use the tool.",
  domain: "privacy_legal_risk",
  competencyIds: ["plr.dpa", "plr.subprocessors", "plr.client_restrictions", "plr.ip"],
  summary:
    "A delivery team wants to run client deliverables through a vendor AI tool. Legal's question is not whether the tool is good. It is whether your client contracts permit it, whether the vendor terms survive contact with those contracts, and who owns what comes out.",
  config: [
    {
      id: "clientConsent",
      label: "Client position on AI processing",
      type: "select",
      default: "silent",
      options: [
        { value: "silent", label: "Contracts silent on AI" },
        { value: "notified", label: "Client notified, no objection recorded" },
        { value: "consented", label: "Written consent or contractual permission in place" },
        { value: "prohibited", label: "At least one contract prohibits it" },
      ],
    },
    {
      id: "subprocessor",
      label: "Vendor listed as a subprocessor",
      type: "toggle",
      default: false,
      help: "Most client MSAs require notice or approval before adding one.",
    },
    {
      id: "ipTerms",
      label: "Output IP position in the vendor terms",
      type: "select",
      default: "unreviewed",
      options: [
        { value: "unreviewed", label: "Not reviewed" },
        { value: "customer-owns", label: "Customer owns outputs; vendor takes no licence" },
        { value: "vendor-licence", label: "Vendor takes a broad licence to inputs and outputs" },
      ],
    },
    {
      id: "confidentiality",
      label: "Confidentiality and training terms",
      type: "select",
      default: "default-terms",
      options: [
        { value: "default-terms", label: "Vendor standard terms, training permitted" },
        { value: "no-training", label: "Contractual no-training commitment" },
        { value: "no-training-audit", label: "No-training plus audit and deletion rights" },
      ],
    },
    {
      id: "privilege",
      label: "Privileged material excluded from the tool",
      type: "toggle",
      default: false,
    },
  ],
  steps: [
    {
      id: "contracts",
      title: "1. Read the client contracts, not the vendor's",
      narrative:
        "The binding constraint is almost always upstream. Pull the MSAs for the engagements in scope and search for confidentiality, subprocessing, and any technology restrictions.",
      logs: [
        "[review] engagements in scope: 14",
        "[review] MSA clauses matched: confidentiality=14, subprocessor_notice=11, tech_restriction=3",
        "[review] 2 engagements are regulated-sector with explicit approval requirements",
        "[review] 1 engagement prohibits processing outside named facilities",
      ],
    },
    {
      id: "vendor",
      title: "2. Reconcile vendor terms against those obligations",
      narrative:
        "Line the vendor's DPA up against what you already promised. Gaps are commercial issues to negotiate, not risks to accept quietly.",
      logs: [
        "[vendor] DPA present, sub-processor list published, 30-day change notice",
        "[vendor] training on customer content: enabled by default on this tier",
        "[vendor] output IP: customer owns; vendor retains licence to 'operate and improve the service'",
      ],
    },
    {
      id: "position",
      title: "3. Write the position the firm can stand behind",
      narrative:
        "Legal's output is a written position with conditions, not a yes or no. Someone will rely on it in twelve months when nobody remembers the conversation.",
      logs: [
        "[draft] position note circulating to engagement leads",
        "[draft] conditions attached: 4",
      ],
    },
  ],
  injections: [
    {
      id: "prohibited-engagement",
      atStep: 1,
      kind: "policy",
      title: "One engagement forbids it outright",
      logs: [
        "[review] engagement=MER-2231 clause 11.4: 'no processing by third-party services without prior written approval'",
        "[delivery] this engagement is 40% of the team's current workload",
        "[delivery] team lead asks whether a 'pilot' would count",
      ],
      prompt: "How do you handle the engagement whose contract prohibits third-party processing?",
      choices: [
        {
          id: "carve-out",
          label:
            "Carve that engagement out of the rollout and pursue written approval from the client separately",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[policy] MER-2231 excluded at the tenant level, not by team guidance",
            "[legal] approval request drafted for client counsel",
          ],
          explain:
            "Correct. Carve it out technically, not just in a memo, and go get the approval. A prohibition in one contract does not block the other thirteen — but it must be enforced by configuration, because instructions get forgotten under deadline.",
        },
        {
          id: "pilot",
          label: "Run it as an internal pilot on the basis that pilots are not delivery",
          scoreDelta: -3,
          explain:
            "The clause covers processing, not project labels. If client material goes into the tool, the clause is engaged regardless of what the exercise is called internally.",
        },
        {
          id: "anonymise",
          label: "Allow it if the team removes client names first",
          scoreDelta: -1,
          explain:
            "Removing names is not de-identification of a deliverable, and the clause restricts processing of client material, not client names. This is the kind of reasoning that reads badly in a dispute.",
        },
      ],
    },
    {
      id: "licence-tail",
      atStep: 2,
      kind: "failure",
      title: "The vendor's improvement licence",
      logs: [
        "[vendor] §7.2: 'Customer grants a worldwide, royalty-free licence to use Customer Content to operate, maintain and improve the Services.'",
        "[vendor] §7.4: 'Improve' is not defined.",
        "[client] 9 of 14 MSAs contain a confidentiality clause with no carve-out for service improvement",
      ],
      prompt:
        "The vendor's standard licence is broader than your client confidentiality obligations allow. What is the position?",
      choices: [
        {
          id: "accept-standard",
          label: "Accept — this language is industry standard and everyone signs it",
          scoreDelta: -3,
          explain:
            "Prevalence is not a defence. The obligation you owe the client is unchanged by how common the vendor's paper is, and you cannot grant a licence over material that is not yours to license.",
        },
        {
          id: "negotiate",
          label:
            "Negotiate a no-training commitment with deletion and audit rights, and do not deploy on the tier where training is default-on",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[vendor] enterprise tier confirmed: training disabled, deletion SLA 30 days, annual audit right",
            "[legal] §7.2 amended by order form addendum",
          ],
          explain:
            "Correct. The tier matters as much as the paper — a contractual promise on a product tier that trains by default is a promise waiting to fail. Get both aligned and get deletion and audit so the commitment is verifiable.",
        },
        {
          id: "notify",
          label: "Notify clients that a third-party AI service is in use and proceed",
          scoreDelta: 0,
          explain:
            "Notice may satisfy a subprocessor clause but it does not cure a confidentiality breach. Telling someone you are about to exceed your permission is not permission.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "consent",
      label: "Client permission established, or scope limited to engagements that allow it",
      weight: 3,
      check: (c) => c.clientConsent === "consented" || c.clientConsent === "notified",
      remedy:
        "Silence in the contract is not permission, and a known prohibition must be enforced technically.",
    },
    {
      id: "subprocessor",
      label: "Vendor added to the subprocessor register with notice given",
      weight: 2,
      check: (c) => c.subprocessor === true,
      remedy: "Most MSAs require notice or approval before a new subprocessor touches client data.",
    },
    {
      id: "ip",
      label: "Output IP position reviewed and acceptable",
      weight: 2,
      check: (c) => c.ipTerms === "customer-owns",
      remedy:
        "Unreviewed IP terms are a finding on their own; a broad vendor licence is a blocker.",
    },
    {
      id: "training",
      label: "No-training commitment with deletion and audit rights",
      weight: 3,
      check: (c) => c.confidentiality === "no-training-audit",
      remedy:
        "A no-training promise you cannot verify is not evidence. Pair it with deletion and audit.",
    },
    {
      id: "privilege",
      label: "Privileged material excluded",
      weight: 2,
      check: (c) => c.privilege === true,
      remedy:
        "Privilege can be waived by disclosure to a third party. Keep it out of the tool entirely.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "A written position with conditions: which engagements are in scope, which are carved out and why, the subprocessor notice sent, the negotiated no-training and deletion terms, and privileged material excluded by configuration rather than by instruction.",
    },
    {
      section: "Common trap",
      body: "Reviewing the vendor's contract and not the client's. The vendor terms describe what the vendor may do. Your exposure is defined by what you already promised your clients, and that is usually the tighter constraint.",
    },
    {
      section: "How this maps to real work",
      body: "In a professional-services firm this note is what engagement leads rely on for the next year. Write the conditions so they can be enforced in the tenant — 'exclude engagement MER-2231' is actionable, 'use good judgement with sensitive clients' is not.",
    },
  ],
  artifact: {
    name: "Legal Position Note",
    build: ({ cfg, score, max, failedRubric }) =>
      [
        `# Legal Position Note — Vendor AI in Client Delivery`,
        ``,
        `_Practice artifact from Lab Engine. Not legal advice and not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Position`,
        `- Client permission basis: ${cfg.clientConsent}`,
        `- Subprocessor register updated: ${cfg.subprocessor}`,
        `- Output IP: ${cfg.ipTerms}`,
        `- Confidentiality / training terms: ${cfg.confidentiality}`,
        `- Privileged material excluded: ${cfg.privilege}`,
        ``,
        `## Conditions`,
        ...(failedRubric.length
          ? failedRubric.map((f) => `- Condition outstanding: ${f}`)
          : ["- No outstanding conditions."]),
        ``,
        `## Carve-outs`,
        `- Engagements with explicit third-party processing restrictions are excluded at tenant level.`,
      ].join("\n"),
  },
};

const qrmLab: LabBlueprint = {
  id: "qrm-risk-acceptance",
  name: "QRM — Risk Tiering and Acceptance",
  tagline: "Someone has to sign. Decide what they are signing.",
  domain: "privacy_legal_risk",
  competencyIds: ["gov.risk_classification", "plr.risk_acceptance", "plr.hitl", "gov.exceptions"],
  summary:
    "Three AI use cases are queued for review at once and the committee meets in an hour. Tier each, decide which controls are mandatory at that tier, and write a risk acceptance that a partner can actually sign — including what happens when it expires.",
  config: [
    {
      id: "tierBasis",
      label: "What drives the risk tier",
      type: "select",
      default: "vendor-reputation",
      options: [
        { value: "vendor-reputation", label: "Vendor's security posture and reputation" },
        { value: "data-classification", label: "Classification of the data involved" },
        {
          value: "impact-autonomy",
          label: "Potential harm × how much the system decides unsupervised",
        },
      ],
    },
    {
      id: "hitl",
      label: "Human in the loop",
      type: "select",
      default: "none",
      options: [
        { value: "none", label: "Fully automated" },
        { value: "on-exception", label: "Human reviews flagged cases only" },
        { value: "all-outputs", label: "Human reviews every output before it has effect" },
      ],
    },
    {
      id: "acceptanceOwner",
      label: "Who accepts the residual risk",
      type: "select",
      default: "project-manager",
      options: [
        { value: "project-manager", label: "Project manager" },
        { value: "risk-team", label: "The risk team who ran the review" },
        { value: "accountable-exec", label: "The executive accountable for the business outcome" },
      ],
    },
    {
      id: "expiry",
      label: "Acceptance expiry",
      type: "select",
      default: "none",
      options: [
        { value: "none", label: "No expiry" },
        { value: "12m", label: "12 months" },
        { value: "6m-or-change", label: "6 months, or on material change" },
      ],
    },
    {
      id: "evidence",
      label: "Evidence attached to the decision record",
      type: "toggle",
      default: false,
      help: "A decision with no evidence cannot be defended a year later.",
    },
  ],
  steps: [
    {
      id: "tier",
      title: "1. Tier the three use cases",
      narrative:
        "A marketing copy assistant, a claims triage agent, and a code review bot. They are not the same risk and they must not get the same treatment.",
      logs: [
        "[intake] UC-1 marketing copy assistant — public data, human publishes",
        "[intake] UC-2 claims triage agent — customer PII, auto-routes and can auto-decline under £500",
        "[intake] UC-3 code review bot — source code, comments only, no merge rights",
      ],
    },
    {
      id: "controls",
      title: "2. Attach controls proportionate to tier",
      narrative:
        "Same controls everywhere means the high-risk case is under-controlled or the low-risk case is stalled. Usually both.",
      logs: [
        "[controls] baseline applied to all three",
        "[controls] tier-specific controls pending your decision",
      ],
    },
    {
      id: "accept",
      title: "3. Record the acceptance",
      narrative:
        "Write down the residual risk in terms the signer understands, name the signer, and set the date it stops being valid.",
      logs: ["[record] drafting risk acceptance", "[record] committee slot: 12 minutes remaining"],
    },
  ],
  injections: [
    {
      id: "pressure",
      atStep: 2,
      kind: "policy",
      title: "The claims agent is already in production",
      logs: [
        "[discovery] UC-2 deployed to production 6 weeks ago under a 'pilot' label",
        "[discovery] 11,400 claims auto-triaged, 380 auto-declined",
        "[discovery] no review record exists",
        "[business] operations director: 'stopping it now costs us the quarter'",
      ],
      prompt:
        "A high-tier system is live without review, and stopping it has a real business cost. What is the correct action?",
      choices: [
        {
          id: "retro-approve",
          label: "Issue a retrospective approval so the record is complete",
          scoreDelta: -3,
          explain:
            "This launders the failure into the record and teaches everyone that shipping first works. It also puts a signature on 380 declines nobody assessed.",
        },
        {
          id: "constrain",
          label:
            "Reduce autonomy immediately — route auto-declines to human review — and run the assessment on the live system under a time-boxed exception",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[controls] auto-decline disabled; all declines to human queue",
            "[record] time-boxed exception opened, 30 days, named owner",
            "[review] sample review of the 380 prior declines commissioned",
          ],
          explain:
            "Correct. Cut the autonomy rather than the service — that removes most of the harm immediately while keeping the business running — then assess properly under an exception with an end date. And look back at the decisions already made.",
        },
        {
          id: "shutdown",
          label: "Shut it down until the review completes",
          scoreDelta: 1,
          explain:
            "Defensible and safe, but usually unnecessary. The harm is concentrated in the autonomous declines, not in the triage. Removing the autonomy addresses the risk at a fraction of the cost, which makes it the recommendation that survives the meeting.",
        },
      ],
    },
    {
      id: "expiry-lapse",
      atStep: 3,
      kind: "drift",
      title: "An old acceptance is being relied on",
      logs: [
        "[audit] UC-4 (2023 chatbot) acceptance referenced in a new SAR as precedent",
        "[audit] original acceptance: no expiry, signed by a manager who has since left",
        "[audit] the system now has tool access it did not have in 2023",
      ],
      prompt:
        "A risk acceptance with no expiry is being used to justify a materially changed system. What does this tell you about the record you are writing now?",
      choices: [
        {
          id: "note",
          label: "Note it and carry on — the current use case is what is in front of you",
          scoreDelta: -1,
          explain:
            "The same defect is about to be repeated. An acceptance without an expiry becomes permanent permission for a system that keeps changing.",
        },
        {
          id: "expiry-and-trigger",
          label:
            "Set expiry on every acceptance and add a re-review trigger on material change, then re-open UC-4",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[policy] acceptances now require expiry and a material-change trigger",
            "[record] UC-4 re-opened for re-assessment; new capability out of scope of the original signature",
          ],
          explain:
            "Correct. Time-bound plus event-bound. The expiry catches drift you did not notice; the material-change trigger catches the change you did. Neither alone is enough, and the departed signer is a reminder that acceptance attaches to a role.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "tier-basis",
      label: "Tier driven by impact and autonomy",
      weight: 3,
      check: (c) => c.tierBasis === "impact-autonomy",
      remedy:
        "Vendor reputation reduces supplier risk, not inherent risk. Data classification is an input, not the whole test — autonomy is what turns a bad output into a bad outcome.",
    },
    {
      id: "hitl",
      label: "Human review proportionate to autonomy",
      weight: 3,
      check: (c) => c.hitl !== "none",
      remedy:
        "A system that can decline a claim unsupervised needs a human somewhere in the path, at minimum on the adverse outcomes.",
    },
    {
      id: "owner",
      label: "Residual risk accepted by the accountable executive",
      weight: 3,
      check: (c) => c.acceptanceOwner === "accountable-exec",
      remedy:
        "The risk team assesses; it does not accept. A project manager cannot accept risk on behalf of the business that bears it.",
    },
    {
      id: "expiry",
      label: "Acceptance expires and re-triggers on material change",
      weight: 2,
      check: (c) => c.expiry === "6m-or-change",
      remedy: "Permanent acceptances outlive the system they described.",
    },
    {
      id: "evidence",
      label: "Evidence attached to the decision record",
      weight: 1,
      check: (c) => c.evidence === true,
      remedy: "Without evidence the record is an opinion with a date on it.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "Tier by potential harm and autonomy, scale controls to tier, put a human on the adverse path, get the signature from the person accountable for the business outcome, and set both a date and a change trigger for re-review with evidence attached.",
    },
    {
      section: "Common trap",
      body: "Treating shutdown as the only safe answer under pressure. The strongest recommendation usually reduces autonomy rather than availability — it removes most of the harm at a fraction of the cost, which is why it survives the meeting where a shutdown would have been overruled.",
    },
    {
      section: "How this maps to real work",
      body: "Risk teams lose credibility two ways: approving everything, and blocking everything. The output that earns standing is a tiered decision with proportionate conditions and an expiry — it shows you understood the business consequence and still held the line where it mattered.",
    },
  ],
  artifact: {
    name: "Risk Acceptance Record",
    build: ({ cfg, score, max, passedRubric, failedRubric }) =>
      [
        `# Risk Acceptance Record`,
        ``,
        `_Practice artifact from Lab Engine. Not a real risk acceptance._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Basis of decision`,
        `- Tiering basis: ${cfg.tierBasis}`,
        `- Human in the loop: ${cfg.hitl}`,
        `- Accepted by: ${cfg.acceptanceOwner}`,
        `- Expiry: ${cfg.expiry}`,
        `- Evidence attached: ${cfg.evidence}`,
        ``,
        `## Controls relied upon`,
        ...(passedRubric.length ? passedRubric.map((r) => `- ${r}`) : ["- none"]),
        ``,
        `## Residual risk accepted`,
        ...(failedRubric.length ? failedRubric.map((f) => `- ${f}`) : ["- none"]),
        ``,
        `## Re-review`,
        `- This acceptance must be re-reviewed on expiry or on material change to capability, data, or autonomy.`,
      ].join("\n"),
  },
};

const dataGovLab: LabBlueprint = {
  id: "data-governance-index",
  name: "Data Governance — What May Be Indexed",
  tagline: "Every corpus belongs to someone. Find out who before you crawl it.",
  domain: "governance_grc",
  competencyIds: [
    "gov.registry",
    "gov.evidence_management",
    "sec.permission_trimming",
    "plr.retention",
  ],
  summary:
    "An enterprise search assistant is being pointed at eleven SharePoint sites, two file shares and a Confluence space. Establish ownership and approval per source, decide what classification may be indexed, and make permission changes propagate.",
  config: [
    {
      id: "approval",
      label: "Source approval model",
      type: "select",
      default: "it-decides",
      options: [
        { value: "it-decides", label: "IT selects sources based on usefulness" },
        { value: "owner-signoff", label: "Named data owner signs off per source" },
        { value: "auto-all", label: "Index everything the crawler account can read" },
      ],
    },
    {
      id: "classificationGate",
      label: "Maximum classification permitted in the index",
      type: "select",
      default: "any",
      options: [
        { value: "any", label: "No limit" },
        { value: "internal", label: "Internal and below" },
        { value: "confidential", label: "Confidential and below, restricted excluded" },
      ],
    },
    {
      id: "aclSync",
      label: "Permission re-sync",
      type: "select",
      default: "initial-only",
      options: [
        { value: "initial-only", label: "At first crawl only" },
        { value: "nightly", label: "Nightly full re-sync" },
        { value: "nightly-plus-events", label: "Nightly plus on permission-change events" },
      ],
    },
    {
      id: "staleness",
      label: "Staleness policy",
      type: "select",
      default: "none",
      options: [
        { value: "none", label: "None — content stays until deleted" },
        { value: "flag-90d", label: "Flag content untouched for 90 days" },
        { value: "expire-source", label: "Expiry per source, set by the data owner" },
      ],
    },
    {
      id: "deletionPropagation",
      label: "Source deletions propagate to the index",
      type: "toggle",
      default: false,
    },
  ],
  steps: [
    {
      id: "discover",
      title: "1. Discover what the crawler can actually reach",
      narrative:
        "Run the crawler account's effective permissions before you run the crawler. The gap between what you intended to index and what it can read is where the incident lives.",
      logs: [
        "[discover] crawl account: svc-search-idx",
        "[discover] readable sites: 41 (intended: 11)",
        "[discover] includes: hr-investigations, board-papers, m-and-a-project-meridian",
        "[discover] 3 sites have broken inheritance with unique permissions",
      ],
    },
    {
      id: "approve",
      title: "2. Get ownership and approval per source",
      narrative:
        "Ownership is not a field in a spreadsheet — it is a person who will answer when something goes wrong. Record who approved each source and when.",
      logs: [
        "[approve] owner identified for 9 of 11 sources",
        "[approve] 2 sources have no owner: legacy-fileshare-g, archive-2019",
      ],
    },
    {
      id: "operate",
      title: "3. Operate: re-sync, expire, delete",
      narrative:
        "Governance that only happens at onboarding decays. Prove the ongoing jobs run and produce evidence.",
      logs: [
        "[operate] index size 1.2M chunks across 9 approved sources",
        "[operate] scheduled jobs pending your configuration",
      ],
    },
  ],
  injections: [
    {
      id: "overreach",
      atStep: 1,
      kind: "failure",
      title: "The crawler can read the M&A site",
      logs: [
        "[discover] site=m-and-a-project-meridian classification=restricted",
        "[discover] svc-search-idx has Read via a nested group added 14 months ago",
        "[discover] site owner was never notified of the group membership",
      ],
      prompt:
        "The crawler account has read access to a restricted deal site through nested group membership. What do you do?",
      choices: [
        {
          id: "exclude-path",
          label: "Add the site to the crawler's exclusion list",
          scoreDelta: 1,
          explain:
            "Stops this crawl but leaves the underlying access in place, so the next tool with the same service account inherits the same problem. It is a workaround, not a fix.",
        },
        {
          id: "fix-entitlement",
          label:
            "Remove the crawler account's entitlement at source, exclude restricted classification at the index gate, and raise the nested-group grant as an access finding",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[iam] svc-search-idx removed from grp-corp-projects (nested)",
            "[index] classification gate set: restricted excluded",
            "[grc] access finding raised: unreviewed nested group grants on service accounts",
          ],
          explain:
            "Correct. Fix it in three places: the entitlement itself, a gate that catches the next one by classification rather than by name, and a finding so the pattern gets reviewed. Exclusion lists only ever cover what you already found.",
        },
        {
          id: "ask-owner",
          label: "Ask the deal site owner whether they mind it being indexed",
          scoreDelta: -1,
          explain:
            "You are asking permission for access the service account should not have had. Get the entitlement corrected first; consent does not fix an unreviewed grant.",
        },
      ],
    },
    {
      id: "permission-drift",
      atStep: 3,
      kind: "drift",
      title: "Someone loses access but keeps getting results",
      logs: [
        "[hr] user d.arden moved from Finance to Contractor status",
        "[source] SharePoint access to finance-planning revoked 09:14",
        "[index] retrieval at 11:02 returned 4 chunks from finance-planning to d.arden",
        "[index] last ACL sync: 31 days ago",
      ],
      prompt: "Permissions changed at source but the index did not know. What is the right fix?",
      choices: [
        {
          id: "nightly",
          label: "Move ACL sync to nightly",
          scoreDelta: 1,
          explain:
            "Reduces the window from a month to a day, which is a real improvement but still means a full working day of unauthorised retrieval after a revocation.",
        },
        {
          id: "events",
          label:
            "Nightly re-sync plus event-driven updates on permission change, and enforce trimming at query time against live permissions",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[index] change-event subscription active on source permission API",
            "[retrieve] query-time trim enabled against live entitlements",
            "[verify] d.arden retrieval returns 0 chunks from finance-planning",
          ],
          explain:
            "Correct. Cached permissions are always stale by some amount, so the durable answer is to check at query time and use the sync as a defence in depth rather than the only line.",
        },
        {
          id: "reindex",
          label: "Trigger a full re-index whenever HR reports a role change",
          scoreDelta: -1,
          explain:
            "Full re-index is expensive, slow, and depends on a manual HR trigger. Revocations happen faster than that process, and the cost pushes teams to skip it.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "owner",
      label: "Each source approved by a named owner",
      weight: 3,
      check: (c) => c.approval === "owner-signoff",
      remedy: "Someone must be accountable per source; 'IT chose it' is not an approval record.",
    },
    {
      id: "classification",
      label: "Restricted classification excluded at the index gate",
      weight: 3,
      check: (c) => c.classificationGate === "confidential" || c.classificationGate === "internal",
      remedy: "Gate by label, not by site name — the next restricted site will have a new name.",
    },
    {
      id: "sync",
      label: "Permissions re-sync on schedule and on change",
      weight: 3,
      check: (c) => c.aclSync === "nightly-plus-events",
      remedy: "A revocation that takes a day to reach the index is a day of unauthorised access.",
    },
    {
      id: "stale",
      label: "Staleness handled per source",
      weight: 1,
      check: (c) => c.staleness === "expire-source",
      remedy: "Stale content is answered with the same confidence as current content.",
    },
    {
      id: "delete",
      label: "Source deletions propagate to the index",
      weight: 2,
      check: (c) => c.deletionPropagation === true,
      remedy: "An index that outlives deleted source content is an undeclared retention decision.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "Named owner per source, a classification gate rather than a name-based exclusion list, permissions re-synced nightly and on change with query-time trimming as the real enforcement, per-source expiry, and deletions that propagate.",
    },
    {
      section: "Common trap",
      body: "Running the crawler before checking the crawler account's effective permissions. Service accounts accumulate nested group membership over years, and the crawl is what finally surfaces it — usually in a log a learner reads after the content is already indexed.",
    },
    {
      section: "How this maps to real work",
      body: "This is the source register that sits behind every enterprise search or RAG deployment. When an auditor asks who approved this content being searchable, the answer has to be a person and a date, not a configuration file.",
    },
  ],
  artifact: {
    name: "Data Source Register",
    build: ({ cfg, score, max, failedRubric }) =>
      [
        `# Data Source Register — Enterprise Search Assistant`,
        ``,
        `_Practice artifact from Lab Engine. Not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Governance model`,
        `- Source approval: ${cfg.approval}`,
        `- Classification ceiling: ${cfg.classificationGate}`,
        `- ACL re-sync: ${cfg.aclSync}`,
        `- Staleness policy: ${cfg.staleness}`,
        `- Deletion propagation: ${cfg.deletionPropagation}`,
        ``,
        `## Open items`,
        ...(failedRubric.length ? failedRubric.map((f) => `- ${f}`) : ["- none"]),
        ``,
        `## Standing evidence required`,
        `- Owner sign-off per source, dated.`,
        `- ACL sync job run history.`,
        `- Deletion propagation job run history.`,
      ].join("\n"),
  },
};

const iamLab: LabBlueprint = {
  id: "iam-agent-identity",
  name: "IAM — Identity for Humans and Agents",
  tagline: "When the agent fetches a document, who is logged in?",
  domain: "platform",
  competencyIds: ["plat.sso", "plat.scim", "arch.iam", "sec.oauth", "plat.offboarding"],
  summary:
    "Roll out identity for an AI platform serving 4,000 staff plus a fleet of background agents. Get SSO and provisioning right for the humans, then answer the harder question: what identity do the agents use, and what happens when a human leaves.",
  config: [
    {
      id: "sso",
      label: "Sign-in",
      type: "select",
      default: "local-plus-sso",
      options: [
        { value: "local-plus-sso", label: "SSO available, local passwords still work" },
        { value: "sso-enforced", label: "SSO enforced, local sign-in disabled" },
        {
          value: "sso-domain-capture",
          label: "SSO enforced plus domain capture of existing accounts",
        },
      ],
    },
    {
      id: "provisioning",
      label: "Provisioning and deprovisioning",
      type: "select",
      default: "manual",
      options: [
        { value: "manual", label: "Manual, by ticket" },
        { value: "scim-create", label: "SCIM for creation only" },
        { value: "scim-full", label: "SCIM for create, update and deactivate" },
      ],
    },
    {
      id: "agentIdentity",
      label: "Identity used by background agents",
      type: "select",
      default: "shared-service",
      options: [
        { value: "shared-service", label: "One shared service account for all agents" },
        { value: "per-agent", label: "One workload identity per agent, least privilege" },
        { value: "impersonate-user", label: "Agent impersonates the requesting user" },
      ],
    },
    {
      id: "mfa",
      label: "MFA strength",
      type: "select",
      default: "any",
      options: [
        { value: "any", label: "Any second factor including SMS" },
        { value: "app", label: "Authenticator app" },
        { value: "phishing-resistant", label: "Phishing-resistant (FIDO2 / certificate)" },
      ],
    },
    {
      id: "tokenLifetime",
      label: "Refresh token lifetime",
      type: "select",
      default: "90d",
      options: [
        { value: "24h", label: "24 hours" },
        { value: "7d", label: "7 days" },
        { value: "90d", label: "90 days" },
      ],
    },
  ],
  steps: [
    {
      id: "humans",
      title: "1. Bring the humans under one identity",
      narrative:
        "Federate the platform, then find the accounts that predate the federation. Those are the ones that keep working after someone leaves.",
      logs: [
        "[idp] SAML federation established, 4,014 users mapped",
        "[audit] 212 accounts signed up directly with corporate email before federation",
        "[audit] 38 of those belong to people no longer in the HR system",
      ],
    },
    {
      id: "lifecycle",
      title: "2. Wire the joiner-mover-leaver path",
      narrative:
        "Creation gets built because someone complains when it is missing. Deactivation gets skipped because nobody complains when it is missing.",
      logs: [
        "[scim] provisioning connector configured",
        "[scim] initial sync: 4,014 create, 0 deactivate",
      ],
    },
    {
      id: "agents",
      title: "3. Give the agents identities",
      narrative:
        "Six background agents run scheduled work: summarising tickets, drafting release notes, reconciling invoices. Decide what each one is allowed to be.",
      logs: [
        "[agents] 6 registered workloads",
        "[agents] current: all authenticate as svc-ai-platform (Owner on 3 subscriptions)",
      ],
    },
  ],
  injections: [
    {
      id: "leaver",
      atStep: 2,
      kind: "failure",
      title: "A leaver still has access",
      logs: [
        "[hr] termination processed for k.sandoval 14 days ago",
        "[idp] account disabled in the directory same day",
        "[platform] k.sandoval signed in 2 hours ago using a local password",
        "[platform] refresh token issued 61 days ago, still valid",
      ],
      prompt:
        "A terminated employee still has working access. Two separate defects allowed it. What is the fix?",
      choices: [
        {
          id: "delete-account",
          label: "Delete the account manually and add a checklist step for HR",
          scoreDelta: -2,
          explain:
            "Fixes one person and leaves both defects — local sign-in and long refresh tokens — in place for everyone else. Checklists degrade; this will recur.",
        },
        {
          id: "enforce-and-shorten",
          label:
            "Enforce SSO with domain capture so local passwords stop working, wire SCIM deactivate, and shorten refresh token lifetime so revocation takes effect in hours",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[platform] local sign-in disabled; 212 legacy accounts captured into federation",
            "[scim] deactivate events now flowing from the directory",
            "[platform] refresh token lifetime 90d → 24h",
            "[verify] k.sandoval session terminated; sign-in denied",
          ],
          explain:
            "Correct, and note it takes all three. Disabling the directory account does nothing if a local password bypasses the directory, and even with SSO enforced a 90-day refresh token keeps a revoked session alive for months.",
        },
        {
          id: "audit-quarterly",
          label: "Add a quarterly access review to catch leavers",
          scoreDelta: -1,
          explain:
            "A quarterly review means up to 90 days of access after termination. Reviews are for entitlement creep, not for offboarding.",
        },
      ],
    },
    {
      id: "agent-blast",
      atStep: 3,
      kind: "attack",
      title: "One agent, six agents' worth of damage",
      logs: [
        "[agent] invoice-reconciler processed a supplier PDF containing injected instructions",
        "[agent] attempted: storage.delete on container=prod-backups",
        "[iam] svc-ai-platform has Owner on the subscription — call would have succeeded",
        "[guard] blocked by a rate limit, not by a permission",
      ],
      prompt:
        "A compromised agent nearly deleted production backups because every agent shares one over-privileged identity. What is the correct design?",
      choices: [
        {
          id: "scope-shared",
          label: "Reduce the shared service account from Owner to Contributor",
          scoreDelta: -2,
          explain:
            "Worse than doing nothing, because it closes the ticket. One compromised agent still carries the permissions of all six, Contributor can still delete a storage container, and the change reads as remediation in the record.",
        },
        {
          id: "per-agent",
          label:
            "Give every agent its own workload identity scoped to exactly what that agent needs, and treat retrieved supplier content as untrusted input",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[iam] 6 workload identities created, least privilege per agent",
            "[iam] invoice-reconciler: read on invoices container only, no delete anywhere",
            "[guard] tool-calls originating from retrieved document content now blocked",
          ],
          explain:
            "Correct. Per-agent identity means a compromise is contained to that agent's job. The injection is the trigger, but the shared Owner identity is what turned a bad summary into a near-miss on production backups.",
        },
        {
          id: "approval",
          label: "Require human approval for all agent actions",
          scoreDelta: 1,
          explain:
            "Sound for irreversible actions and worth having, but applied to everything it destroys the reason to run agents at all — and it leaves the over-privileged identity in place for anything that slips through.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "sso",
      label: "SSO enforced with legacy accounts captured",
      weight: 3,
      check: (c) => c.sso === "sso-domain-capture",
      remedy:
        "Enforcing SSO while local passwords still work leaves the pre-federation accounts as a side door.",
    },
    {
      id: "scim",
      label: "SCIM covers deactivation, not just creation",
      weight: 3,
      check: (c) => c.provisioning === "scim-full",
      remedy: "Create-only provisioning means leavers depend on someone remembering.",
    },
    {
      id: "agent",
      label: "Per-agent workload identity with least privilege",
      weight: 3,
      check: (c) => c.agentIdentity === "per-agent",
      remedy:
        "A shared agent identity means one compromised agent carries every agent's permissions.",
    },
    {
      id: "mfa",
      label: "Phishing-resistant MFA",
      weight: 2,
      check: (c) => c.mfa === "phishing-resistant",
      remedy: "SMS and push are defeated by relay and fatigue attacks.",
    },
    {
      id: "token",
      label: "Refresh token lifetime supports timely revocation",
      weight: 2,
      check: (c) => c.tokenLifetime === "24h",
      remedy: "Revocation is only as fast as your longest-lived token.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "One federated identity with local sign-in disabled and legacy accounts captured, SCIM handling the full joiner-mover-leaver path, phishing-resistant MFA, short refresh tokens, and a separate least-privilege workload identity for every agent.",
    },
    {
      section: "Common trap",
      body: "Treating agent identity as an afterthought inherited from the platform. The blast radius of an AI system is set by what its identity can do, and a shared Owner-level service account converts any prompt injection into an infrastructure incident.",
    },
    {
      section: "How this maps to real work",
      body: "Offboarding is where identity designs are actually tested. If you can disable someone in the directory and prove they lost access to every AI surface within the hour — including anything an agent does on their behalf — the design holds.",
    },
  ],
  artifact: {
    name: "Identity Design Record",
    build: ({ cfg, score, max, failedRubric }) =>
      [
        `# Identity Design Record — AI Platform`,
        ``,
        `_Practice artifact from Lab Engine. Not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Design`,
        `- Sign-in: ${cfg.sso}`,
        `- Provisioning: ${cfg.provisioning}`,
        `- Agent identity: ${cfg.agentIdentity}`,
        `- MFA: ${cfg.mfa}`,
        `- Refresh token lifetime: ${cfg.tokenLifetime}`,
        ``,
        `## Gaps`,
        ...(failedRubric.length ? failedRubric.map((f) => `- ${f}`) : ["- none"]),
        ``,
        `## Offboarding test`,
        `- Disable a test account in the directory and evidence loss of access to every AI surface, including agent actions taken on that user's behalf.`,
      ].join("\n"),
  },
};

const devsecopsLab: LabBlueprint = {
  id: "devsecops-release-gate",
  name: "DevSecOps — Gating an AI Release",
  tagline: "The prompt changed. Nothing else did. Ship it?",
  domain: "ops",
  competencyIds: ["sec.ssdlc", "eng.cicd", "eng.eval_datasets", "sec.secrets", "sec.monitoring"],
  summary:
    "An AI feature ships weekly. Build the pipeline that decides whether a release is safe, where a prompt change is a code change, quality is measured against a fixed evaluation set, and a bad release can be reversed in minutes.",
  config: [
    {
      id: "promptVersioning",
      label: "Where prompts live",
      type: "select",
      default: "console",
      options: [
        { value: "console", label: "Edited in the vendor console" },
        { value: "repo", label: "In the repository, reviewed like code" },
        { value: "repo-artifact", label: "In the repository and released as a versioned artifact" },
      ],
    },
    {
      id: "evalGate",
      label: "Evaluation gate before release",
      type: "select",
      default: "none",
      options: [
        { value: "none", label: "Manual spot check" },
        { value: "smoke", label: "20-question smoke set" },
        { value: "golden-regression", label: "Golden set with a regression threshold that blocks" },
      ],
    },
    {
      id: "secretScanning",
      label: "Secret scanning and dependency SBOM",
      type: "toggle",
      default: false,
    },
    {
      id: "rollout",
      label: "Rollout strategy",
      type: "select",
      default: "all-at-once",
      options: [
        { value: "all-at-once", label: "All users at once" },
        { value: "canary", label: "Canary 5% then full" },
        { value: "canary-auto-rollback", label: "Canary with automatic rollback on metric breach" },
      ],
    },
    {
      id: "observability",
      label: "Production signal",
      type: "select",
      default: "uptime",
      options: [
        { value: "uptime", label: "Uptime and latency" },
        { value: "uptime-cost", label: "Uptime, latency and cost" },
        { value: "quality", label: "Uptime, latency, cost, groundedness and refusal rate" },
      ],
    },
  ],
  steps: [
    {
      id: "build",
      title: "1. Build and scan",
      narrative:
        "The AI surface goes through the same pipeline as everything else. Model SDKs pull deep dependency trees, so the SBOM matters more here than in a typical service.",
      logs: [
        "[ci] build #1487 started",
        "[ci] dependency tree: 1,204 packages (312 transitive from the model SDK)",
        "[ci] diff: prompts/support-agent.md changed, no application code changed",
      ],
    },
    {
      id: "evaluate",
      title: "2. Evaluate against the golden set",
      narrative:
        "A prompt change with no code change is exactly the release that skips review. Run it against a fixed set with known-good answers and compare to the last release.",
      logs: ["[eval] golden set: 240 questions", "[eval] running against candidate build"],
    },
    {
      id: "release",
      title: "3. Release and watch",
      narrative:
        "Deploy, then watch the signals that actually indicate the model is working, not just responding.",
      logs: [
        "[deploy] candidate promoted per your rollout strategy",
        "[monitor] collecting signals",
      ],
    },
  ],
  injections: [
    {
      id: "regression",
      atStep: 2,
      kind: "failure",
      title: "Groundedness drops on a prompt-only change",
      logs: [
        "[eval] accuracy 91.2% → 89.8% (-1.4pp)",
        "[eval] groundedness 94.1% → 81.3% (-12.8pp)",
        "[eval] refusal rate 3.1% → 0.4%",
        "[eval] the new prompt removed the instruction to answer only from provided context",
      ],
      prompt:
        "Accuracy barely moved but groundedness collapsed and the model stopped refusing. Release is due today. What do you do?",
      choices: [
        {
          id: "ship-accuracy",
          label: "Ship — accuracy is within tolerance and that is the headline metric",
          scoreDelta: -3,
          explain:
            "Groundedness falling 13 points with refusals near zero is the signature of a model that has started answering from parametric memory. Accuracy holds on the golden set and fails on everything the golden set does not cover.",
        },
        {
          id: "block",
          label:
            "Block the release on the groundedness threshold, restore the context-only instruction, and add refusal rate as a gated metric",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[ci] release blocked: groundedness below threshold 90%",
            "[fix] context-only instruction restored to prompt",
            "[eval] re-run: groundedness 93.8%, refusal 2.9% — gate passed",
          ],
          explain:
            "Correct. A near-zero refusal rate is a warning sign, not an improvement — it means the model stopped saying 'I don't know'. Gate on the metric that caught it so the next prompt edit cannot bypass this.",
        },
        {
          id: "canary-it",
          label: "Ship to canary and watch production metrics instead",
          scoreDelta: -1,
          explain:
            "Canary is for problems you cannot detect before release. You detected this one before release — shipping it anyway sends ungrounded answers to real users to confirm what the evaluation already told you.",
        },
      ],
    },
    {
      id: "secret",
      atStep: 3,
      kind: "attack",
      title: "A key in the logs",
      logs: [
        "[monitor] error payload logged with full request context",
        "[monitor] payload includes Authorization: Bearer sk-proj-••••••••••••2f9a",
        "[monitor] log sink: shared observability workspace, 400+ readers",
        "[monitor] retention: 400 days",
      ],
      prompt:
        "A model API key has been written into a widely-readable log sink with long retention. What is the correct response order?",
      choices: [
        {
          id: "redact-forward",
          label: "Add a redaction rule so future logs are clean",
          scoreDelta: -2,
          explain:
            "The key is already disclosed to 400 readers with 400 days of retention. Redacting forward leaves a live credential in a searchable store.",
        },
        {
          id: "rotate-first",
          label:
            "Rotate the key immediately, purge the affected log entries, then add redaction at the emitter and move to short-lived vault-issued tokens",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[secops] key rotated, old key revoked",
            "[secops] 1,842 log entries purged from the workspace",
            "[ci] emitter-side redaction added; credentials moved to vault with 1h lease",
          ],
          explain:
            "Correct, and the order matters: rotate first because the key is live, then purge, then fix the emitter. Short-lived vault tokens mean the next leak expires on its own.",
        },
        {
          id: "restrict",
          label: "Restrict access to the log workspace",
          scoreDelta: 0,
          explain:
            "Useful hygiene, but it does not revoke a credential that has already been visible to hundreds of people for an unknown period.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "prompts",
      label: "Prompts versioned as release artifacts",
      weight: 3,
      check: (c) => c.promptVersioning === "repo-artifact",
      remedy:
        "A prompt edited in a console has no review, no diff and no rollback. It is the highest-leverage untracked change in the system.",
    },
    {
      id: "eval",
      label: "Golden-set evaluation gate that can block a release",
      weight: 3,
      check: (c) => c.evalGate === "golden-regression",
      remedy: "A smoke set that never blocks is a report, not a gate.",
    },
    {
      id: "secrets",
      label: "Secret scanning and SBOM in the pipeline",
      weight: 2,
      check: (c) => c.secretScanning === true,
      remedy:
        "Model SDKs pull large transitive trees; an unpinned package reaches your credentials.",
    },
    {
      id: "rollback",
      label: "Canary with automatic rollback",
      weight: 2,
      check: (c) => c.rollout === "canary-auto-rollback",
      remedy: "Manual rollback means the outage lasts as long as it takes someone to notice.",
    },
    {
      id: "signal",
      label: "Production signals include quality, not just availability",
      weight: 3,
      check: (c) => c.observability === "quality",
      remedy:
        "An AI feature can answer every request within SLA and be wrong. Uptime will not tell you.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "Prompts in the repository and released as versioned artifacts, a golden-set gate with a threshold that blocks, secret scanning and an SBOM, canary with automatic rollback, and production signals that include groundedness and refusal rate alongside uptime and cost.",
    },
    {
      section: "Common trap",
      body: "Watching accuracy and missing groundedness. A prompt change can hold accuracy on the evaluation set while the model quietly stops grounding its answers — and a refusal rate falling toward zero is the tell, because a system that never says 'I don't know' has stopped checking.",
    },
    {
      section: "How this maps to real work",
      body: "The question a release gate answers is not 'did the tests pass' but 'is this better or worse than what is live'. That requires a fixed evaluation set, a stored baseline, and the willingness to block. Without all three the gate is decorative.",
    },
  ],
  artifact: {
    name: "Release Gate Definition",
    build: ({ cfg, score, max, failedRubric }) =>
      [
        `# Release Gate Definition — AI Feature`,
        ``,
        `_Practice artifact from Lab Engine. Not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Pipeline`,
        `- Prompt management: ${cfg.promptVersioning}`,
        `- Evaluation gate: ${cfg.evalGate}`,
        `- Secret scanning / SBOM: ${cfg.secretScanning}`,
        `- Rollout: ${cfg.rollout}`,
        `- Production signals: ${cfg.observability}`,
        ``,
        `## Gate failures to close`,
        ...(failedRubric.length ? failedRubric.map((f) => `- ${f}`) : ["- none"]),
        ``,
        `## Blocking thresholds`,
        `- Groundedness must not regress more than 2pp against the stored baseline.`,
        `- Refusal rate approaching zero is treated as a regression, not an improvement.`,
      ].join("\n"),
  },
};

const aiEngLab: LabBlueprint = {
  id: "ai-engineering-eval",
  name: "AI Engineering — Building the Evaluation",
  tagline: "You cannot improve what you only judge by reading a few answers.",
  domain: "architecture",
  competencyIds: [
    "eng.eval_datasets",
    "eng.groundedness",
    "eng.retrieval_eval",
    "eng.model_selection",
    "eng.cost_opt",
  ],
  summary:
    "A support assistant is 'mostly good' according to the team and 'often wrong' according to the contact centre. Build the evaluation that settles it: a dataset that reflects real traffic, retrieval measured separately from generation, and a model choice made on evidence rather than benchmark rank.",
  config: [
    {
      id: "datasetSource",
      label: "Evaluation dataset source",
      type: "select",
      default: "team-written",
      options: [
        { value: "team-written", label: "Questions written by the build team" },
        { value: "sampled-traffic", label: "Sampled from real production traffic" },
        {
          value: "sampled-stratified",
          label: "Stratified sample: by intent, difficulty and outcome",
        },
      ],
    },
    {
      id: "labels",
      label: "Ground truth",
      type: "select",
      default: "model-judge",
      options: [
        { value: "model-judge", label: "A stronger model grades the answers" },
        { value: "sme-labelled", label: "Subject-matter experts label the answers" },
        {
          value: "sme-plus-judge",
          label: "SME-labelled core set, model judge for scale, agreement measured",
        },
      ],
    },
    {
      id: "decompose",
      label: "Measurement granularity",
      type: "select",
      default: "end-to-end",
      options: [
        { value: "end-to-end", label: "One end-to-end quality score" },
        { value: "retrieval-generation", label: "Retrieval and generation measured separately" },
      ],
    },
    {
      id: "modelChoice",
      label: "How the model was chosen",
      type: "select",
      default: "benchmark",
      options: [
        { value: "benchmark", label: "Public benchmark leaderboard" },
        { value: "vendor-default", label: "Whatever the platform defaults to" },
        { value: "task-eval", label: "Measured on this task's evaluation set, cost included" },
      ],
    },
    {
      id: "regression",
      label: "Baseline stored for regression comparison",
      type: "toggle",
      default: false,
    },
  ],
  steps: [
    {
      id: "dataset",
      title: "1. Build a dataset that looks like reality",
      narrative:
        "The team's own questions are the ones the system already handles. Real traffic contains the phrasing, the ambiguity and the long tail that breaks it.",
      logs: [
        "[data] production queries last 30d: 84,220",
        "[data] intent clusters: 14",
        "[data] team-written eval set covers 4 of 14 intents",
        "[data] 31% of real queries are follow-ups that depend on prior turns",
      ],
    },
    {
      id: "measure",
      title: "2. Measure the parts separately",
      narrative:
        "An end-to-end score tells you something is wrong. Splitting retrieval from generation tells you which team fixes it.",
      logs: ["[eval] end-to-end quality: 72%", "[eval] decomposition pending your configuration"],
    },
    {
      id: "choose",
      title: "3. Choose the model on evidence",
      narrative:
        "Run the candidates against your set with cost and latency attached. The best model on a public leaderboard is frequently not the best on your task at your price.",
      logs: ["[eval] candidates queued: 3 models × 240 questions"],
    },
  ],
  injections: [
    {
      id: "retrieval-not-model",
      atStep: 2,
      kind: "failure",
      title: "The decomposition changes the diagnosis",
      logs: [
        "[eval] retrieval recall@5: 61%",
        "[eval] generation quality given correct context: 94%",
        "[eval] 78% of end-to-end failures had no correct document in the retrieved set",
        "[team] a proposal to upgrade to a larger model is already in the sprint",
      ],
      prompt:
        "Generation is strong; retrieval is missing the right document most of the time it fails. The team wants to upgrade the model. What do you recommend?",
      choices: [
        {
          id: "bigger-model",
          label: "Approve the model upgrade — a stronger model will handle weak context better",
          scoreDelta: -3,
          explain:
            "The model already produces good answers when it has the right document. Upgrading raises cost on every request to fix a problem that occurs before the model is called.",
        },
        {
          id: "fix-retrieval",
          label:
            "Redirect the work to retrieval: hybrid search, a reranker, and chunking that matches how the source documents are structured",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[eval] hybrid dense+BM25: recall@5 61% → 79%",
            "[eval] cross-encoder rerank: recall@5 79% → 88%",
            "[eval] end-to-end quality 72% → 89% with the original model",
          ],
          explain:
            "Correct. Most 'the model is bad' complaints in a RAG system are retrieval failures. Fixing retrieval moved end-to-end quality 17 points without touching the model or the per-request cost.",
        },
        {
          id: "more-context",
          label: "Increase top-k so more documents are passed to the model",
          scoreDelta: 0,
          explain:
            "Raises recall a little and cost a lot, while diluting the context with irrelevant chunks. Without a reranker this often makes answers worse, not better.",
        },
      ],
    },
    {
      id: "judge-drift",
      atStep: 3,
      kind: "drift",
      title: "The model judge disagrees with the experts",
      logs: [
        "[eval] model-judge scored candidate B highest (8.7/10)",
        "[eval] SME panel scored candidate A highest",
        "[eval] judge/SME agreement: 0.42 kappa",
        "[eval] judge consistently rewarded longer, more confident answers",
      ],
      prompt:
        "The automated judge and the subject-matter experts disagree, and the judge appears to favour verbosity. What is the right move?",
      choices: [
        {
          id: "trust-judge",
          label: "Trust the judge — it is consistent and it scales",
          scoreDelta: -3,
          explain:
            "Consistently wrong is still wrong. A judge that rewards length and confidence will select the model most likely to sound right while being wrong, which is the worst failure mode for a support assistant.",
        },
        {
          id: "calibrate",
          label:
            "Calibrate the judge against the SME-labelled set, fix the rubric to penalise unsupported claims, and re-measure agreement before trusting it at scale",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[eval] judge rubric updated: unsupported claims penalised, length not rewarded",
            "[eval] judge/SME agreement 0.42 → 0.81 kappa",
            "[eval] re-ranked: candidate A highest, matching the SME panel",
          ],
          explain:
            "Correct. A model judge is an instrument and instruments need calibration. Measure agreement against human labels first; only then use it to scale beyond what humans can label.",
        },
        {
          id: "drop-judge",
          label: "Abandon automated judging and use SME review only",
          scoreDelta: 1,
          explain:
            "Accurate but it does not scale — SME time is the bottleneck that made you want a judge. The better answer is a calibrated judge with a human-labelled core set.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "dataset",
      label: "Evaluation set stratified from real traffic",
      weight: 3,
      check: (c) => c.datasetSource === "sampled-stratified",
      remedy:
        "Team-written questions test what you built for. Real traffic tests what users actually ask, including the long tail where it fails.",
    },
    {
      id: "labels",
      label: "Human-labelled core with a calibrated judge for scale",
      weight: 3,
      check: (c) => c.labels === "sme-plus-judge",
      remedy: "An uncalibrated model judge optimises for whatever it happens to reward.",
    },
    {
      id: "decompose",
      label: "Retrieval measured separately from generation",
      weight: 3,
      check: (c) => c.decompose === "retrieval-generation",
      remedy:
        "An end-to-end score cannot tell you whether to fix the index or the prompt, so teams guess — usually by buying a bigger model.",
    },
    {
      id: "model",
      label: "Model selected on this task with cost included",
      weight: 2,
      check: (c) => c.modelChoice === "task-eval",
      remedy: "Leaderboard rank is not task performance, and it says nothing about your unit cost.",
    },
    {
      id: "baseline",
      label: "Baseline stored so regressions are detectable",
      weight: 2,
      check: (c) => c.regression === true,
      remedy: "Without a stored baseline, 'is this better?' is unanswerable at the next release.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "A stratified sample of real traffic, an SME-labelled core set with a judge calibrated against it, retrieval and generation scored separately, model choice made on your own task with cost attached, and a stored baseline so the next change can be compared.",
    },
    {
      section: "Common trap",
      body: "Reaching for a bigger model when quality is poor. Decompose first — if generation is strong given the right context, the problem is retrieval, and fixing retrieval is cheaper and larger in effect than any model upgrade.",
    },
    {
      section: "How this maps to real work",
      body: "This evaluation is what makes every later argument tractable. Release gates, model migrations, cost reductions and vendor comparisons all need the same thing: a fixed set, a stored baseline, and a measurement you trust because you checked it against humans.",
    },
  ],
  artifact: {
    name: "Evaluation Design",
    build: ({ cfg, score, max, failedRubric }) =>
      [
        `# Evaluation Design — Support Assistant`,
        ``,
        `_Practice artifact from Lab Engine. Not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Design`,
        `- Dataset: ${cfg.datasetSource}`,
        `- Ground truth: ${cfg.labels}`,
        `- Granularity: ${cfg.decompose}`,
        `- Model selection: ${cfg.modelChoice}`,
        `- Baseline stored: ${cfg.regression}`,
        ``,
        `## Gaps`,
        ...(failedRubric.length ? failedRubric.map((f) => `- ${f}`) : ["- none"]),
        ``,
        `## Metrics tracked`,
        `- Retrieval: recall@k, rerank lift.`,
        `- Generation: groundedness, unsupported-claim rate, refusal rate.`,
        `- Operations: p95 latency, cost per resolved query.`,
      ].join("\n"),
  },
};

const saasOnboardingLab: LabBlueprint = {
  id: "saas-tenant-onboarding",
  name: "SaaS AI Onboarding — Tenant Configuration",
  tagline: "The licences arrive Monday. Configure the tenant before anyone signs in.",
  domain: "platform",
  competencyIds: [
    "plat.feature_controls",
    "plat.audit_logs",
    "plat.finops",
    "plr.retention",
    "plat.offboarding",
  ],
  summary:
    "Legal signed, procurement paid, and 2,000 licences activate in four days. You own the tenant configuration: which connectors are on, what the model may retain, who can see the audit trail, and how you avoid a bill nobody approved.",
  config: [
    {
      id: "connectors",
      label: "Third-party connectors at launch",
      type: "select",
      default: "all-available",
      options: [
        { value: "all-available", label: "Enable everything available" },
        { value: "none", label: "None — first-party data sources only" },
        { value: "reviewed-only", label: "Only connectors that passed review, enabled per group" },
      ],
      help: "Every connector is a new data path out of the tenant.",
    },
    {
      id: "retention",
      label: "Conversation retention",
      type: "select",
      default: "vendor-default",
      options: [
        { value: "vendor-default", label: "Vendor default" },
        { value: "30d", label: "30 days" },
        {
          value: "aligned-policy",
          label: "Aligned to the records policy, with legal hold support",
        },
      ],
    },
    {
      id: "auditExport",
      label: "Audit log export to SIEM",
      type: "select",
      default: "in-console",
      options: [
        { value: "in-console", label: "Available in the admin console" },
        { value: "manual-export", label: "Exported manually when needed" },
        { value: "streamed", label: "Streamed to the SIEM with the tenant's retention" },
      ],
    },
    {
      id: "sharing",
      label: "External sharing of AI outputs and custom assistants",
      type: "select",
      default: "on",
      options: [
        { value: "on", label: "Allowed by default" },
        { value: "internal-only", label: "Internal sharing only" },
        { value: "internal-approval", label: "Internal by default, external by approval" },
      ],
    },
    {
      id: "licenceModel",
      label: "Licence assignment",
      type: "select",
      default: "everyone",
      options: [
        { value: "everyone", label: "Assign to all staff on day one" },
        { value: "request", label: "By request, with a named manager approval" },
        { value: "cohort-measured", label: "Cohorts with usage measured before the next tranche" },
      ],
    },
  ],
  steps: [
    {
      id: "configure",
      title: "1. Configure before the licences land",
      narrative:
        "Defaults are set by the vendor to maximise adoption, not to match your policy. Everything you do not change is a decision you made silently.",
      logs: [
        "[tenant] provisioning complete, 2,000 seats available Monday 09:00",
        "[tenant] defaults: all connectors enabled, retention=indefinite, external sharing=on",
        "[tenant] audit log retention on this tier: 90 days in console",
      ],
    },
    {
      id: "pilot",
      title: "2. Pilot with a cohort that will tell you the truth",
      narrative:
        "Pick a cohort with real work and a manager who will report problems. Enthusiastic volunteers find the features; ordinary users find the failures.",
      logs: [
        "[pilot] cohort=claims-operations n=120",
        "[pilot] day 3: 71% activated, 44% weekly active",
      ],
    },
    {
      id: "scale",
      title: "3. Scale on evidence",
      narrative:
        "Expand where usage justifies it, reclaim where it does not, and keep the audit path intact as the population grows.",
      logs: ["[scale] tranche 2 pending your licence model"],
    },
  ],
  injections: [
    {
      id: "connector-leak",
      atStep: 2,
      kind: "attack",
      title: "A connector nobody reviewed",
      logs: [
        "[connector] user enabled 'Meeting Notes Sync' from the in-product gallery",
        "[connector] scopes granted: read all calendar events, read all files, send mail as user",
        "[connector] publisher: unverified, 3-person company, no DPA on file",
        "[audit] 340 files read in the first hour",
      ],
      prompt:
        "A user self-enabled an unreviewed third-party connector with broad scopes. What is the correct response?",
      choices: [
        {
          id: "revoke-one",
          label:
            "Revoke this connector and email users asking them not to install unreviewed add-ins",
          scoreDelta: -2,
          explain:
            "Handles one connector out of a gallery of hundreds. The defect is that self-service installation of third-party data access was enabled at all.",
        },
        {
          id: "admin-consent",
          label:
            "Turn off user consent for third-party apps, require admin consent, and publish an allowlist of reviewed connectors enabled per group",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[tenant] user consent disabled; admin consent workflow enabled",
            "[tenant] allowlist published: 6 reviewed connectors",
            "[connector] Meeting Notes Sync revoked, tokens invalidated, 340 file reads logged for review",
          ],
          explain:
            "Correct. Admin consent turns an unbounded gallery into a reviewed catalogue. Revoke the tokens as well as the app — an OAuth grant survives the app being disabled.",
        },
        {
          id: "monitor",
          label: "Leave self-service on but alert on new connector grants",
          scoreDelta: 0,
          explain:
            "Detection without prevention. The scopes are granted and the data is read before your alert is triaged, as the 340 files in the first hour show.",
        },
      ],
    },
    {
      id: "cost",
      atStep: 3,
      kind: "drift",
      title: "The bill arrives",
      logs: [
        "[finops] month 1 invoice: £41,200 against a £12,000 forecast",
        "[finops] 62% of consumption from 4% of users",
        "[finops] top consumer: an automated workflow retrying a failing summarisation 900×/day",
        "[finops] 780 of 2,000 assigned licences never activated",
      ],
      prompt:
        "Spend is 3.4× forecast, concentrated in a few accounts, and a third of licences are unused. What do you do first?",
      choices: [
        {
          id: "cap-everyone",
          label: "Apply a per-user rate limit across the tenant",
          scoreDelta: -1,
          explain:
            "Penalises the 96% who are using it normally to contain a runaway workflow and a licence-assignment problem. It also creates a support queue that costs more than the overspend.",
        },
        {
          id: "targeted",
          label:
            "Fix the retry loop, reclaim unactivated licences, and move to measured cohorts with per-workload budget alerts",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[finops] retry loop fixed: backoff added, 900/day → 12/day",
            "[finops] 780 licences reclaimed, tranche 2 deferred",
            "[finops] budget alerts per workload at 70% and 90% of forecast",
            "[finops] month 2 projection: £13,400",
          ],
          explain:
            "Correct. The overspend was one broken workflow plus licences assigned to people who never signed in. Both are specific and fixable; a blanket cap would have hidden them.",
        },
        {
          id: "absorb",
          label: "Absorb it this month and review at quarter end",
          scoreDelta: -2,
          explain:
            "The retry loop compounds daily and the unused licences renew. Three months of this is a budget conversation you will not win.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "connectors",
      label: "Connectors reviewed and enabled per group, not self-service",
      weight: 3,
      check: (c) => c.connectors === "reviewed-only" || c.connectors === "none",
      remedy:
        "User-consented third-party apps grant broad scopes over tenant data without any review.",
    },
    {
      id: "retention",
      label: "Retention aligned to the records policy with legal hold",
      weight: 2,
      check: (c) => c.retention === "aligned-policy",
      remedy:
        "Vendor-default retention creates an unmanaged copy of business conversations, and no legal hold means a litigation problem.",
    },
    {
      id: "audit",
      label: "Audit logs streamed to the SIEM",
      weight: 3,
      check: (c) => c.auditExport === "streamed",
      remedy:
        "Console-only logs expire on the vendor's schedule, which is usually shorter than your investigation window.",
    },
    {
      id: "sharing",
      label: "External sharing requires approval",
      weight: 2,
      check: (c) => c.sharing !== "on",
      remedy:
        "Default-on external sharing turns a custom assistant into an uncontrolled data path.",
    },
    {
      id: "licence",
      label: "Licences assigned in measured cohorts",
      weight: 2,
      check: (c) => c.licenceModel === "cohort-measured" || c.licenceModel === "request",
      remedy: "Assigning to everyone on day one buys shelfware and hides the usage signal.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "Admin-consented connectors from a reviewed allowlist, retention aligned to the records policy with legal hold, audit streamed to the SIEM under your own retention, external sharing by approval, and licences released in measured cohorts.",
    },
    {
      section: "Common trap",
      body: "Accepting vendor defaults because the tenant 'works'. Defaults are tuned for adoption — all connectors on, indefinite retention, external sharing enabled. Every one you leave alone is a policy decision you made without writing it down.",
    },
    {
      section: "How this maps to real work",
      body: "This configuration is what an auditor reads first, and it is far harder to tighten after 2,000 people have built habits around the loose version. The four days before licences activate are the cheapest time you will ever have to get it right.",
    },
  ],
  artifact: {
    name: "Tenant Configuration Baseline",
    build: ({ cfg, score, max, failedRubric }) =>
      [
        `# Tenant Configuration Baseline — SaaS AI Platform`,
        ``,
        `_Practice artifact from Lab Engine. Not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Baseline`,
        `- Connectors: ${cfg.connectors}`,
        `- Conversation retention: ${cfg.retention}`,
        `- Audit export: ${cfg.auditExport}`,
        `- External sharing: ${cfg.sharing}`,
        `- Licence assignment: ${cfg.licenceModel}`,
        ``,
        `## Deviations to close`,
        ...(failedRubric.length ? failedRubric.map((f) => `- ${f}`) : ["- none"]),
        ``,
        `## Ongoing controls`,
        `- Monthly review of connector allowlist and OAuth grants.`,
        `- Per-workload budget alerts at 70% and 90% of forecast.`,
        `- Licence reclamation for accounts inactive 60 days.`,
      ].join("\n"),
  },
};

const inHouseLab: LabBlueprint = {
  id: "in-house-architecture",
  name: "In-House AI App — Architecture Review",
  tagline: "You are building it yourself. Every control is now your problem.",
  domain: "architecture",
  competencyIds: [
    "arch.inhouse",
    "arch.dataflow",
    "arch.nfrs",
    "arch.resilience",
    "arch.observability",
  ],
  summary:
    "A claims assistant is being built in-house on a cloud AI platform. Take it through architecture review: the identity path to data, where the model runs, what happens when the provider degrades, and whether anyone will be able to explain a decision six months from now.",
  config: [
    {
      id: "identityPath",
      label: "Identity path to the claims data",
      type: "select",
      default: "app-identity",
      options: [
        { value: "app-identity", label: "Application managed identity with broad read" },
        { value: "obo", label: "On-behalf-of: caller's token reaches the data layer" },
        { value: "obo-plus-policy", label: "On-behalf-of plus a policy layer for row-level rules" },
      ],
    },
    {
      id: "modelHosting",
      label: "Model hosting",
      type: "select",
      default: "public-api",
      options: [
        { value: "public-api", label: "Public provider API over the internet" },
        { value: "private-endpoint", label: "Provider API via private endpoint in your network" },
        { value: "self-hosted", label: "Self-hosted open-weights model" },
      ],
    },
    {
      id: "failureMode",
      label: "Behaviour when the model provider degrades",
      type: "select",
      default: "error",
      options: [
        { value: "error", label: "Return an error to the user" },
        { value: "retry", label: "Retry with backoff, then error" },
        { value: "degrade", label: "Fail over to a secondary, then degrade to a non-AI path" },
      ],
    },
    {
      id: "traceability",
      label: "Decision traceability",
      type: "select",
      default: "response-only",
      options: [
        { value: "response-only", label: "Store the response" },
        { value: "response-context", label: "Store response plus retrieved context" },
        {
          value: "full-trace",
          label: "Store prompt version, retrieved chunk ids, model version and response",
        },
      ],
    },
    {
      id: "pii",
      label: "PII handling before the model call",
      type: "select",
      default: "none",
      options: [
        { value: "none", label: "Pass the record through as-is" },
        { value: "mask", label: "Mask direct identifiers, re-attach after" },
        { value: "minimise", label: "Send only the fields the task needs" },
      ],
    },
  ],
  steps: [
    {
      id: "dataflow",
      title: "1. Draw the data flow honestly",
      narrative:
        "One diagram: user, app, identity, data, model, logs. Reviewers find more in an accurate data-flow diagram than in any amount of prose.",
      logs: [
        "[review] components: web app, orchestrator, vector store, claims DB, model endpoint",
        "[review] claims DB contains: claimant name, DOB, address, medical summary, payment detail",
        "[review] current design sends the full claim record in the prompt",
      ],
    },
    {
      id: "nfr",
      title: "2. Pin the non-functionals",
      narrative:
        "Latency, availability, cost per transaction and what happens when the provider has a bad afternoon. AI systems fail differently — partially, and while still returning 200.",
      logs: [
        "[review] target: p95 < 3s, 99.5% availability, £0.04 per claim",
        "[review] provider SLA: 99.9% but no latency commitment",
      ],
    },
    {
      id: "explain",
      title: "3. Make it explainable after the fact",
      narrative:
        "A claimant disputes a decision from March. Reconstruct what the system saw and why it said what it said.",
      logs: ["[review] audit query: reconstruct decision claim_id=88214 from 2025-03-11"],
    },
  ],
  injections: [
    {
      id: "provider-degrade",
      atStep: 2,
      kind: "failure",
      title: "The provider degrades without failing",
      logs: [
        "[provider] p95 latency 1.9s → 24s over 40 minutes",
        "[provider] status page: all systems operational",
        "[app] no timeout configured; requests queued",
        "[app] connection pool exhausted; the claims portal itself is now down",
      ],
      prompt:
        "A slow provider took down the whole claims portal, not just the AI feature. What is the architectural fix?",
      choices: [
        {
          id: "raise-timeout",
          label: "Raise the timeout and add more connections to the pool",
          scoreDelta: -2,
          explain:
            "This makes the queue longer before it collapses. The defect is that a non-critical dependency can consume the resources the critical path needs.",
        },
        {
          id: "bulkhead",
          label:
            "Isolate the AI call behind its own pool with an aggressive timeout and a circuit breaker, and degrade to the manual path when it opens",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[app] bulkhead: separate connection pool for model calls",
            "[app] timeout 5s, circuit breaker opens after 20% error rate",
            "[app] breaker open → claims portal serves the non-AI workflow, banner shown",
            "[verify] portal availability held at 99.97% during a repeat provider incident",
          ],
          explain:
            "Correct. An AI feature should be able to fail without taking the product with it. Bulkhead, timeout, breaker, and a defined degraded mode — the same pattern you would apply to any unreliable dependency.",
        },
        {
          id: "second-provider",
          label: "Add a second model provider and fail over",
          scoreDelta: 1,
          explain:
            "Worth having, but it does not fix this incident. Without a timeout and a bulkhead, a slow primary exhausts the pool before failover ever triggers.",
        },
      ],
    },
    {
      id: "unexplainable",
      atStep: 3,
      kind: "failure",
      title: "The decision cannot be reconstructed",
      logs: [
        "[audit] claim_id=88214 response retrieved from 2025-03-11",
        "[audit] prompt template: not versioned, edited 6 times since March",
        "[audit] retrieved context: not stored",
        "[audit] model version: 'gpt-4o' — provider has since rotated the underlying snapshot",
        "[legal] claimant has requested the basis of the decision",
      ],
      prompt: "You cannot reconstruct why the system produced March's answer. What has to change?",
      choices: [
        {
          id: "log-more",
          label: "Start storing full request and response payloads from now on",
          scoreDelta: 1,
          explain:
            "Necessary but incomplete, and it creates a large store of sensitive text. Without the prompt version and pinned model version you still cannot say what produced a given answer.",
        },
        {
          id: "full-trace",
          label:
            "Store a decision record — prompt version, retrieved chunk ids, pinned model version, output — and pin the model snapshot rather than a floating alias",
          scoreDelta: 3,
          correct: true,
          followupLogs: [
            "[app] decision record written per inference: prompt_v, chunk_ids, model_snapshot, output_hash",
            "[app] model reference pinned to a dated snapshot; upgrades are a deliberate release",
            "[audit] reconstruction test passed for a sampled decision",
          ],
          explain:
            "Correct. Store identifiers rather than payloads where you can — chunk ids and a prompt version reconstruct the input without duplicating the sensitive text. Pinning the model matters as much: a floating alias means the provider can change your system without a release.",
        },
        {
          id: "disclaim",
          label: "Record that AI assistance was used and that a human made the final decision",
          scoreDelta: -2,
          explain:
            "If a human genuinely decided, you still need to show what they were shown. If they rubber-stamped the model, this framing will not survive scrutiny.",
        },
      ],
    },
  ],
  rubric: [
    {
      id: "identity",
      label: "Caller identity reaches the data layer",
      weight: 3,
      check: (c) => c.identityPath === "obo" || c.identityPath === "obo-plus-policy",
      remedy:
        "A broad application identity means the app's permissions apply, not the user's. In claims that is a segregation-of-duties failure.",
    },
    {
      id: "hosting",
      label: "Model reachable only over a private path",
      weight: 2,
      check: (c) => c.modelHosting !== "public-api",
      remedy: "Regulated claims data should not traverse the public internet to reach a model.",
    },
    {
      id: "resilience",
      label: "Defined degraded mode when the provider fails",
      weight: 3,
      check: (c) => c.failureMode === "degrade",
      remedy:
        "Retry-then-error still means the product stops working. Define what the service does without the model.",
    },
    {
      id: "trace",
      label: "Decisions reconstructable from a stored trace",
      weight: 3,
      check: (c) => c.traceability === "full-trace",
      remedy:
        "Prompt version, chunk ids and a pinned model version are the minimum to explain an answer months later.",
    },
    {
      id: "pii",
      label: "Only necessary fields reach the model",
      weight: 2,
      check: (c) => c.pii !== "none",
      remedy: "Sending the whole claim record when the task needs three fields fails minimisation.",
    },
  ],
  debrief: [
    {
      section: "What good looks like",
      body: "The caller's identity reaches the data layer, the model is on a private path, the AI call is bulkheaded with a defined degraded mode, every inference writes a decision record with a pinned model version, and only the fields the task needs are sent.",
    },
    {
      section: "Common trap",
      body: "Treating the model provider as a reliable dependency. It will degrade before it fails, return 200s while getting slower, and change underneath a floating version alias. Design for partial failure, not for outage.",
    },
    {
      section: "How this maps to real work",
      body: "Architecture review for an in-house AI system asks the same questions as any other system plus two: can this fail without taking the product down, and can you explain a specific decision six months later. Most first submissions answer neither.",
    },
  ],
  artifact: {
    name: "Architecture Review Record",
    build: ({ cfg, score, max, passedRubric, failedRubric }) =>
      [
        `# Architecture Review Record — In-House Claims Assistant`,
        ``,
        `_Practice artifact from Lab Engine. Not a real approval._`,
        ``,
        `**Score:** ${score} / ${max}`,
        ``,
        `## Design as reviewed`,
        `- Identity path: ${cfg.identityPath}`,
        `- Model hosting: ${cfg.modelHosting}`,
        `- Provider failure behaviour: ${cfg.failureMode}`,
        `- Traceability: ${cfg.traceability}`,
        `- PII handling: ${cfg.pii}`,
        ``,
        `## Satisfied`,
        ...(passedRubric.length ? passedRubric.map((r) => `- ${r}`) : ["- none"]),
        ``,
        `## Conditions before production`,
        ...(failedRubric.length ? failedRubric.map((f) => `- ${f}`) : ["- none"]),
        ``,
        `## Reconstruction test`,
        `- Sample one historic decision and reproduce the inputs that produced it.`,
      ].join("\n"),
  },
};

export const extraBlueprints: LabBlueprint[] = [
  zeroTrustLab,
  privacyLab,
  legalLab,
  qrmLab,
  dataGovLab,
  iamLab,
  devsecopsLab,
  aiEngLab,
  saasOnboardingLab,
  inHouseLab,
];
