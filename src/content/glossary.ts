/**
 * The glossary.
 *
 * Every entry has three parts and they do different jobs:
 *   plain    — what it is, in words a non-technical reader already knows. No
 *              other glossary term may appear here. This is the promise.
 *   matters  — why anyone should care. A definition without a stake is trivia.
 *   precise  — the sentence a practitioner would actually use. Optional; absent
 *              where the plain definition is already the precise one.
 *
 * `aliases` exist because prose says "ACLs" and "access control lists" and
 * "SSO" and "single sign-on" interchangeably, and a learner who does not know
 * the term does not know they are the same thing.
 */

export interface GlossaryTerm {
  id: string;
  term: string;
  aliases?: string[];
  plain: string;
  matters: string;
  precise?: string;
  /** Where this is taught, if it is taught somewhere specific. */
  seeAlso?: { label: string; labId?: string; platformId?: string }[];
  category:
    "ai-basics" | "identity" | "security" | "data" | "governance" | "engineering" | "operations";
}

const T = (t: GlossaryTerm): GlossaryTerm => t;

export const glossary: GlossaryTerm[] = [
  // ── AI basics ───────────────────────────────────────────────────────────
  T({
    id: "llm",
    term: "LLM",
    aliases: ["large language model", "large language models", "LLMs"],
    category: "ai-basics",
    plain:
      "The thing behind ChatGPT and its competitors: software that has read an enormous amount of text and can continue a piece of writing convincingly.",
    matters:
      "It predicts what text should come next. It does not look anything up and it has no idea whether what it produced is true — which is why nearly every control in this platform exists to give it correct material to work from and to check what it said.",
    precise:
      "A model trained on large text corpora to predict the next token, used through an API or a hosted product.",
  }),
  T({
    id: "rag",
    term: "RAG",
    aliases: ["retrieval augmented generation", "retrieval-augmented generation"],
    category: "ai-basics",
    plain:
      "Before answering, the system searches your own documents and hands the relevant ones to the model, so the answer comes from your material rather than the model's memory.",
    matters:
      "This is how nearly every enterprise AI assistant works. It also means your document permissions have to be enforced at the moment of search — otherwise the assistant will happily quote a file the person asking was never allowed to open.",
    precise:
      "Retrieval-Augmented Generation: retrieve relevant chunks from an index, place them in the prompt as context, generate an answer grounded in them, and cite the sources.",
    seeAlso: [{ label: "RAG Architecture Lab", labId: "rag" }],
  }),
  T({
    id: "prompt",
    term: "prompt",
    aliases: ["system prompt", "prompts"],
    category: "ai-basics",
    plain:
      "Everything the model is given before it answers — the user's question plus whatever standing instructions and documents the system added.",
    matters:
      "Standing instructions are code in every way that counts: change one word and the system behaves differently. Treating them as configuration rather than as a release is one of the most common ways an AI system silently gets worse.",
  }),
  T({
    id: "agent",
    term: "agent",
    aliases: ["agents", "agentic", "AI agent"],
    category: "ai-basics",
    plain:
      "An AI that can take actions on its own — send an email, update a ticket, call another system — rather than only producing text for a person to read.",
    matters:
      "The moment a system can act, a wrong answer becomes a wrong action. Everything about how you review it changes, because you can no longer rely on a person noticing before anything happens.",
    seeAlso: [{ label: "Agent Security Lab", labId: "agent" }],
  }),
  T({
    id: "hallucination",
    term: "hallucination",
    aliases: ["hallucinate", "hallucinations"],
    category: "ai-basics",
    plain:
      "When the model states something false with complete confidence, because producing fluent text and producing true text are not the same task.",
    matters:
      "It does not look like an error. There is no warning, no blank, no exception — just a wrong answer written in the same tone as a right one, which is why detecting it requires measurement rather than reading.",
  }),
  T({
    id: "groundedness",
    term: "groundedness",
    aliases: ["grounded", "grounding"],
    category: "engineering",
    plain:
      "The share of an answer that is actually supported by the documents the system was given, rather than made up from the model's own memory.",
    matters:
      "It is the metric that catches the failure accuracy misses. An answer can be right and ungrounded — which means it will be wrong on the next question you did not test.",
  }),
  T({
    id: "embedding",
    term: "embedding",
    aliases: ["embeddings", "vector", "vectors"],
    category: "ai-basics",
    plain:
      "A way of turning a piece of text into a list of numbers so that texts about similar things end up with similar numbers, which is what makes 'find me related documents' possible.",
    matters:
      "The list of numbers is a copy of the original text for legal purposes. Deleting the source document does not delete it — a point that decides most erasure requests.",
  }),
  T({
    id: "chunk",
    term: "chunk",
    aliases: ["chunks", "chunking"],
    category: "ai-basics",
    plain:
      "Documents are cut into smaller pieces before being indexed, because handing a model a 200-page contract is neither affordable nor effective.",
    matters:
      "Where you cut matters enormously. Cut mid-sentence or mid-clause and the retrieved piece no longer means what the document meant, and the answer is confidently wrong.",
  }),
  T({
    id: "context-window",
    term: "context window",
    category: "ai-basics",
    plain:
      "The maximum amount of text a model can consider at once — the question, the instructions, and every document you attached, all counted together.",
    matters:
      "It is a hard ceiling and it costs money to fill. Most 'why did it ignore my document' questions turn out to be a context window that was already full.",
  }),
  T({
    id: "token",
    term: "token",
    aliases: ["tokens"],
    category: "ai-basics",
    plain:
      "Models read and write in fragments of words rather than whole words. A token is roughly three-quarters of an English word.",
    matters: "It is the unit you are billed in and the unit the context window is measured in.",
  }),
  T({
    id: "eval",
    term: "evaluation set",
    aliases: ["eval set", "evals", "golden set", "eval"],
    category: "engineering",
    plain:
      "A fixed list of questions with known good answers, run against the system every time something changes, so you can tell whether it got better or worse.",
    matters:
      "Without one, 'is this an improvement?' is unanswerable and every release is a guess. It is the single artefact that makes an AI system manageable rather than mysterious.",
    seeAlso: [{ label: "AI Engineering Lab", labId: "ai-engineering" }],
  }),

  // ── Identity ────────────────────────────────────────────────────────────
  T({
    id: "sso",
    term: "SSO",
    aliases: ["single sign-on", "single sign on", "federation", "federated"],
    category: "identity",
    plain:
      "Signing in to a tool using your normal work login instead of creating a separate username and password for it.",
    matters:
      "It means one place controls who has access. Without it, disabling someone in the company directory does nothing to the twenty tools they also had accounts on.",
    seeAlso: [{ label: "IAM / Identity Lab", labId: "iam" }],
  }),
  T({
    id: "scim",
    term: "SCIM",
    aliases: ["provisioning", "deprovisioning", "joiner mover leaver"],
    category: "identity",
    plain:
      "The plumbing that automatically creates someone's account when they join, changes it when they move team, and switches it off when they leave.",
    matters:
      "Sign-in and account lifecycle are separate problems. Companies wire up the first because people complain when they cannot log in, and skip the second because nobody complains when a leaver's account keeps working.",
    precise:
      "System for Cross-domain Identity Management: a standard API for provisioning, updating and deactivating accounts from a directory.",
    seeAlso: [{ label: "IAM / Identity Lab", labId: "iam" }],
  }),
  T({
    id: "mfa",
    term: "MFA",
    aliases: ["multi-factor authentication", "two-factor", "2FA"],
    category: "identity",
    plain:
      "Requiring a second proof of identity beyond a password — a code, an app approval, or a physical key.",
    matters:
      "Not all second factors are equal. Codes by text message and tap-to-approve prompts are both routinely defeated; a physical security key is not.",
  }),
  T({
    id: "obo",
    term: "on-behalf-of",
    aliases: ["OBO", "on behalf of", "delegated identity"],
    category: "identity",
    plain:
      "When the AI tool goes to fetch a document, it does so as *you* rather than as itself — so it can only reach what you could already open.",
    matters:
      "This one decision determines whether an assistant respects your file permissions or quietly ignores them. It is the first thing a security reviewer looks for and the most common thing to get wrong.",
    precise:
      "An OAuth flow in which the application exchanges the caller's token for a downstream token, so the data source authorises against the end user rather than the application.",
    seeAlso: [{ label: "Zero Trust AI Lab", labId: "zero-trust" }],
  }),
  T({
    id: "service-account",
    term: "service account",
    aliases: ["service principal", "managed identity", "workload identity"],
    category: "identity",
    plain:
      "A login that belongs to a piece of software rather than to a person, used when a system needs to talk to another system.",
    matters:
      "These accumulate permissions for years and nobody reviews them. If an AI system uses one shared account with broad access, anything that goes wrong goes wrong with all of that access.",
  }),
  T({
    id: "rbac",
    term: "RBAC",
    aliases: ["role-based access control", "roles and permissions"],
    category: "identity",
    plain:
      "Deciding what someone can do based on their job rather than granting permissions one person at a time.",
    matters:
      "It is how access stays manageable past about fifty people. It is also where 'temporary' admin rights become permanent.",
  }),
  T({
    id: "conditional-access",
    term: "conditional access",
    category: "identity",
    plain:
      "Rules that decide whether to allow a sign-in based on the circumstances — who, from what device, from where, how risky it looks.",
    matters:
      "It lets you say 'yes, but less' instead of only yes or no. That distinction is usually what unblocks a senior person without removing the control.",
  }),
  T({
    id: "least-privilege",
    term: "least privilege",
    category: "security",
    plain:
      "Give each person and each system exactly the access it needs to do its job, and nothing beyond that.",
    matters:
      "It does not prevent incidents. It decides how bad one is — which is usually the difference between an embarrassing afternoon and a reportable breach.",
  }),

  // ── Security ────────────────────────────────────────────────────────────
  T({
    id: "prompt-injection",
    term: "prompt injection",
    aliases: ["indirect prompt injection", "injected instructions"],
    category: "security",
    plain:
      "Hiding instructions inside a document or web page so that when the AI reads it, it follows those instructions instead of yours.",
    matters:
      "The attacker never touches your system — they just put text somewhere the AI will eventually read. It is the defining new attack of AI systems and there is no single fix, only a set of boundaries.",
    seeAlso: [{ label: "Agent Security Lab", labId: "agent" }],
  }),
  T({
    id: "permission-trimming",
    term: "permission trimming",
    aliases: [
      "security trimming",
      "permission-trimmed",
      "permission trimmed",
      "security-trimmed",
      "ACL",
      "ACLs",
      "access control list",
    ],
    category: "security",
    plain:
      "Filtering search results down to only the documents the person asking is actually allowed to see.",
    matters:
      "It has to happen when the search runs, against that person's live permissions. Filtering afterwards is too late — a model that has already read the text will paraphrase it.",
    seeAlso: [{ label: "Data Governance Lab", labId: "data-governance" }],
  }),
  T({
    id: "blast-radius",
    term: "blast radius",
    category: "security",
    plain: "How much damage something can do if it goes wrong or is taken over.",
    matters:
      "It is set by permissions, not by intentions. An AI agent with administrator rights has an enormous blast radius no matter how carefully it was written.",
  }),
  T({
    id: "kill-switch",
    term: "kill switch",
    category: "security",
    plain: "A way to stop an AI system immediately, without a deployment or a meeting.",
    matters:
      "The value is entirely in whether someone can actually reach it at 2am. A kill switch that requires three approvals is a plan, not a control.",
  }),
  T({
    id: "zero-trust",
    term: "Zero Trust",
    category: "security",
    plain:
      "Assume nothing is safe just because it is inside the company network. Check identity and device on every request.",
    matters:
      "The old model trusted anything behind the firewall. That stopped being reasonable when work moved to laptops, homes and hundreds of cloud tools.",
    seeAlso: [{ label: "Zero Trust AI Lab", labId: "zero-trust" }],
  }),
  T({
    id: "egress",
    term: "egress",
    aliases: ["egress control", "outbound"],
    category: "security",
    plain: "Data leaving your environment — and the controls on where it is allowed to go.",
    matters:
      "An AI that can browse or call tools can send data to any address it can name. Listing what is blocked is a losing race; listing what is allowed is not.",
  }),
  T({
    id: "siem",
    term: "SIEM",
    aliases: ["security information and event management", "log aggregation"],
    category: "security",
    plain:
      "The central system where security logs from everything are collected, kept, and searched when something goes wrong.",
    matters:
      "Logs that live only inside a vendor's admin console disappear on the vendor's schedule, which is usually shorter than the period you will need to investigate.",
  }),
  T({
    id: "dlp",
    term: "DLP",
    aliases: ["data loss prevention"],
    category: "security",
    plain:
      "Tooling that spots sensitive information — card numbers, health records, contracts — moving somewhere it should not.",
    matters:
      "Most DLP was built for email and file sharing. AI creates new paths it does not watch, which is why an AI rollout usually needs the rules revisited rather than reused.",
  }),
  T({
    id: "threat-model",
    term: "threat model",
    aliases: ["threat modelling", "threat modeling"],
    category: "security",
    plain:
      "Sitting down before you build and asking: who would want to attack this, what would they aim at, and what would stop them.",
    matters:
      "An hour of this finds problems that months of testing will not, because testing checks what you thought of and this is the exercise for thinking of more.",
  }),

  // ── Data, privacy and legal ─────────────────────────────────────────────
  T({
    id: "pii",
    term: "personal data",
    aliases: ["PII", "personally identifiable information"],
    category: "data",
    plain:
      "Any information that identifies a living person, directly or in combination with something else.",
    matters:
      "It is a broader category than most people expect — an employee number, an IP address and a job title together can identify someone as surely as a name.",
  }),
  T({
    id: "special-category",
    term: "special-category data",
    aliases: ["sensitive personal data"],
    category: "data",
    plain:
      "The kinds of personal information the law treats as higher risk: health, ethnicity, religion, sexuality, union membership, biometrics.",
    matters:
      "It carries a higher bar and often a different legal basis entirely. Sweeping it into a general corpus is the single most common serious finding in an AI privacy assessment.",
  }),
  T({
    id: "minimisation",
    term: "data minimisation",
    aliases: ["minimisation", "minimization"],
    category: "data",
    plain: "Use the least data that will do the job, rather than everything you happen to have.",
    matters:
      "It is a legal test, not a preference. 'We indexed the whole share because it was easier' fails it before any security control is even discussed.",
  }),
  T({
    id: "purpose-limitation",
    term: "purpose limitation",
    category: "data",
    plain:
      "Data collected for one reason cannot be freely reused for another, even if you already hold it.",
    matters:
      "AI creates new capabilities over old data — the data has not changed but what you can do with it has, and that new thing is a new purpose needing its own justification.",
  }),
  T({
    id: "retention",
    term: "retention",
    category: "data",
    plain: "How long something is kept before it is deleted, and who decided that.",
    matters:
      "AI tools create a second copy of your most sensitive conversations under the vendor's default settings, often kept longer and watched less closely than the original.",
  }),
  T({
    id: "erasure",
    term: "erasure",
    aliases: ["right to erasure", "deletion request", "DSR", "data subject request"],
    category: "data",
    plain:
      "A person's right to require an organisation to delete the information it holds on them.",
    matters:
      "The search index is a separate copy. Deleting the source record and leaving the index is a failed erasure, and it is the part most first attempts miss.",
    seeAlso: [{ label: "Privacy / PIA Lab", labId: "privacy" }],
  }),
  T({
    id: "pia",
    term: "PIA",
    aliases: ["DPIA", "privacy impact assessment", "data protection impact assessment"],
    category: "governance",
    plain:
      "A structured write-up, done before you build, of what personal data a system will use, why that is justified, what could go wrong, and what you are doing about it.",
    matters:
      "For higher-risk processing it is legally required. Done properly it is also the cheapest place to find the design problem, because nothing has been built yet.",
    seeAlso: [{ label: "Privacy / PIA Lab", labId: "privacy" }],
  }),
  T({
    id: "dpa",
    term: "DPA",
    aliases: ["data processing agreement"],
    category: "governance",
    plain:
      "The contract term that says what a supplier may and may not do with the data you give them.",
    matters:
      "It is where you find out whether the vendor may train on your content. The answer frequently depends on which product tier you bought, not only on what the contract says.",
  }),
  T({
    id: "subprocessor",
    term: "subprocessor",
    category: "governance",
    plain:
      "A supplier your supplier uses. If your AI vendor runs on someone else's cloud, that cloud is a subprocessor.",
    matters:
      "Most contracts with your own customers require you to tell them, or get permission, before adding one. Adding an AI tool to client work usually triggers that clause.",
  }),
  T({
    id: "classification",
    term: "classification",
    aliases: ["sensitivity label", "data classification"],
    category: "data",
    plain:
      "Labelling information by how sensitive it is — public, internal, confidential, restricted.",
    matters:
      "It gives you a rule that catches the next problem as well as this one. Blocking documents by name only ever covers what you already found.",
  }),

  // ── Governance ──────────────────────────────────────────────────────────
  T({
    id: "risk-tier",
    term: "risk tier",
    aliases: ["risk tiering", "risk classification"],
    category: "governance",
    plain:
      "Sorting systems into levels of concern so a chatbot that drafts marketing copy does not get the same scrutiny as one that declines insurance claims.",
    matters:
      "Tier by how much harm it could do and how much it decides without a human. Vendor reputation and data type are inputs, but autonomy is what turns a bad output into a bad outcome.",
    seeAlso: [{ label: "QRM / Risk Lab", labId: "qrm" }],
  }),
  T({
    id: "hitl",
    term: "human in the loop",
    aliases: ["HITL", "human review"],
    category: "governance",
    plain: "A person checks or approves what the AI produced before it has any real effect.",
    matters:
      "Where the human sits decides everything. Reviewing every output does not scale; reviewing only the decisions that harm someone usually does.",
  }),
  T({
    id: "risk-acceptance",
    term: "risk acceptance",
    category: "governance",
    plain:
      "A named person formally agreeing that a known, unresolved risk is acceptable, and signing for it.",
    matters:
      "It must be signed by whoever is accountable for the business outcome, not by the risk team who assessed it. And it must expire, or it becomes permanent permission for a system that keeps changing.",
  }),
  T({
    id: "sar",
    term: "security architecture review",
    aliases: ["SAR", "architecture review"],
    category: "governance",
    plain:
      "A structured review of how a system is built, done before it goes live, checking identity, data flow, network and failure behaviour.",
    matters:
      "For AI systems it hangs on one question asked five ways: when this reads data, whose permissions apply?",
  }),
  T({
    id: "go-no-go",
    term: "go / no-go",
    category: "governance",
    plain:
      "The final decision meeting: ship it, ship it with conditions attached, or send it back.",
    matters:
      "The strongest answer is rarely 'no'. It is the narrowest constraint that removes the risk while letting the rest of the benefit through.",
  }),
  T({
    id: "evidence",
    term: "evidence",
    category: "governance",
    plain:
      "The documents and records that show a control genuinely operates, rather than that someone intended it to.",
    matters:
      "'We have a policy' is not evidence. A log showing the job ran, with dates, is. Auditors are asking for the second thing.",
  }),

  // ── Engineering and operations ──────────────────────────────────────────
  T({
    id: "cicd",
    term: "CI/CD",
    aliases: ["pipeline", "continuous integration", "continuous delivery"],
    category: "engineering",
    plain:
      "The automated conveyor belt that takes a change from someone's laptop, checks it, and puts it live.",
    matters:
      "If prompts are edited in a vendor console instead of going down this belt, the highest-leverage part of an AI system has no review, no history and no way back.",
    seeAlso: [{ label: "DevSecOps / SSDLC Lab", labId: "devsecops" }],
  }),
  T({
    id: "canary",
    term: "canary release",
    aliases: ["canary", "staged rollout"],
    category: "operations",
    plain: "Giving a change to a small share of users first and watching, before everyone gets it.",
    matters:
      "It limits how many people meet a problem you did not catch. It is not a substitute for testing something you already know is broken.",
  }),
  T({
    id: "rollback",
    term: "rollback",
    category: "operations",
    plain: "Putting the previous version back when a change turns out badly.",
    matters:
      "Some things cannot be rolled back. If the system sent letters or made payments, reversing the code does not reverse the effect — which changes how much you should trust the release.",
  }),
  T({
    id: "sbom",
    term: "SBOM",
    aliases: ["software bill of materials", "dependency scanning"],
    category: "engineering",
    plain:
      "A list of every third-party component your software is built from, so you can answer 'are we affected?' when one of them turns out to be vulnerable.",
    matters:
      "AI libraries pull in unusually deep chains of other people's code, and any one of them runs where your model credentials live.",
  }),
  T({
    id: "secrets",
    term: "secrets",
    aliases: ["API key", "credentials", "vault"],
    category: "security",
    plain: "Passwords, API keys and tokens — the things that prove a system is allowed in.",
    matters:
      "They end up in logs constantly. When one leaks the order is: rotate it first because it is live, then clean up, then fix whatever wrote it there.",
  }),
  T({
    id: "observability",
    term: "observability",
    aliases: ["monitoring", "telemetry"],
    category: "operations",
    plain: "Being able to tell what a live system is doing and whether it is doing it well.",
    matters:
      "For AI, uptime is nearly useless on its own. A system can answer every request inside its target response time and be wrong every time.",
  }),
  T({
    id: "circuit-breaker",
    term: "circuit breaker",
    aliases: ["bulkhead", "graceful degradation"],
    category: "operations",
    plain:
      "Automatically stopping calls to something that is failing, so one broken dependency does not drag everything else down with it.",
    matters:
      "AI providers usually degrade before they fail — getting slower while still returning success. Without a timeout and a breaker, that quietly consumes the resources the rest of your product needs.",
  }),
  T({
    id: "private-endpoint",
    term: "private endpoint",
    category: "security",
    plain:
      "A connection to a cloud service that never travels over the public internet, reachable only from inside your own network.",
    matters:
      "It removes a whole class of exposure. A public address protected only by an API key is one leaked key away from open.",
  }),
  T({
    id: "connector",
    term: "connector",
    aliases: ["connectors", "integration", "plugin", "add-in"],
    category: "security",
    plain:
      "An add-on that lets an AI tool reach into another system — your email, your files, your calendar.",
    matters:
      "Each one is a new path for data to leave. If people can install them without approval, your data reach is decided by whoever clicked, not by anyone who reviewed.",
    seeAlso: [{ label: "Connector Security Lab", labId: "connector" }],
  }),
  T({
    id: "tenant",
    term: "tenant",
    category: "operations",
    plain:
      "Your organisation's own private area inside a shared cloud product, with its own users, data and settings.",
    matters:
      "The vendor's default settings are tuned for adoption, not for your policy. Every default you leave alone is a decision you made without writing it down.",
  }),
  T({
    id: "finops",
    term: "FinOps",
    aliases: ["cost management", "unit cost"],
    category: "operations",
    plain: "Keeping track of what cloud and AI usage actually costs, and who is spending it.",
    matters:
      "AI costs scale with use rather than with headcount, so one broken automated loop can outspend a whole department without anyone noticing until the invoice.",
  }),
  T({
    id: "shadow-it",
    term: "shadow IT",
    aliases: ["shadow AI"],
    category: "governance",
    plain:
      "Staff using tools nobody approved, usually because the approved option is missing or too slow.",
    matters:
      "It is a signal, not just a violation. Widespread shadow AI use tells you exactly what people need, and blocking it without providing the alternative just pushes it further out of sight.",
  }),
  T({
    id: "saml-oidc",
    term: "SAML",
    aliases: ["OIDC", "SAML assertion"],
    category: "identity",
    plain:
      "Two competing standards for the same job: letting one system vouch to another that you are who you say you are, so you only log in once.",
    matters:
      "Which one you use is decided by what the product supports, not by preference. The part that goes wrong in both is the same — making sure your group memberships travel across, because that is what the tool uses to decide your permissions.",
    precise:
      "SAML passes signed XML assertions carrying attribute statements; OIDC layers an identity token on OAuth 2.0 carrying claims.",
    seeAlso: [{ label: "IAM / Identity Lab", labId: "iam" }],
  }),
  T({
    id: "pim",
    term: "PIM",
    aliases: ["privileged identity management", "just-in-time access", "break-glass"],
    category: "identity",
    plain:
      "Rather than a handful of people holding administrator rights permanently, nobody has them until they ask, with a reason, for a limited time.",
    matters:
      "Standing administrator access is the largest blast radius in most organisations, and it is usually held by people who need it a few hours a month.",
  }),
  T({
    id: "sast",
    term: "SAST",
    aliases: ["static analysis", "secret scanning"],
    category: "engineering",
    plain:
      "Automated checks that read your source code looking for known-dangerous patterns and for passwords accidentally left in it.",
    matters:
      "Credentials committed by accident are one of the most common ways systems are broken into, and this is the cheap check that catches them before they are published.",
  }),
  T({
    id: "bm25",
    term: "keyword search",
    aliases: ["BM25", "hybrid search", "lexical search"],
    category: "ai-basics",
    plain:
      "Matching on the actual words in a document, the way a normal search box does — as opposed to matching on meaning.",
    matters:
      "Meaning-based search misses exact things: a part number, an error code, a policy reference. Running both and combining the results is usually the single largest quality improvement available to a retrieval system.",
  }),
];

export const glossaryById: Record<string, GlossaryTerm> = Object.fromEntries(
  glossary.map((g) => [g.id, g]),
);

/**
 * Longest-first so "prompt injection" wins over "prompt", and lower-cased for
 * matching. Built once at module load — this runs on every rendered lesson.
 */
export const glossaryLookup: { needle: string; term: GlossaryTerm }[] = glossary
  .flatMap((t) => [t.term, ...(t.aliases ?? [])].map((needle) => ({ needle, term: t })))
  .sort((a, b) => b.needle.length - a.needle.length);
