import type { RoleId } from "./types";

/**
 * Career reality.
 *
 * The platform teaches five roles well and never says the obvious thing: these
 * are jobs, they are hiring, and you may already be most of the way qualified
 * without knowing it. Someone outside the industry does not know "AI Platform
 * Administrator" is a title, does not know a service-desk background transfers
 * into it, and does not know what the interview will actually ask.
 *
 * Two things this file deliberately does NOT do:
 *
 *  - quote salary figures. They vary by country, city, sector and year by
 *    multiples, and a confident wrong number sends someone into a negotiation
 *    badly informed. It describes seniority bands and tells you how to find
 *    real local numbers instead.
 *  - promise outcomes. Practice is not experience. Every claim here is about
 *    what the work involves and what interviewers ask, not about what you will
 *    earn or how quickly you will be hired.
 */

export interface InterviewQuestion {
  id: string;
  /** What they actually say, in the words they use. */
  question: string;
  /** Why they ask it — usually testing something other than the literal question. */
  testing: string;
  /** Points a strong answer hits. Not a script; a checklist to self-mark against. */
  strongAnswer: string[];
  /** The answer that sounds fine and fails. */
  weakAnswer: string;
  difficulty: "opening" | "core" | "senior";
}

export interface CareerProfile {
  roleId: RoleId;
  /** Titles this job is actually advertised under. Searching the wrong words finds nothing. */
  alsoAdvertisedAs: string[];
  /** One paragraph a non-technical reader can follow. */
  whatTheJobIs: string;
  /** A day, concretely. People underestimate how much of this is conversation. */
  typicalDay: string[];
  /** Backgrounds that genuinely transfer, and why. */
  transfersFrom: { from: string; why: string }[];
  /** Honest about the bar. */
  entryReality: string;
  /** How to read the job ad. */
  decodeTheAd: { phrase: string; means: string }[];
  /** What you would be judged on in the first three months. */
  firstNinetyDays: string[];
  seniority: { band: string; looksLike: string }[];
  interview: InterviewQuestion[];
}

const platformAdmin: CareerProfile = {
  roleId: "platform-admin",
  alsoAdvertisedAs: [
    "AI Platform Administrator",
    "Copilot Administrator",
    "Modern Workplace Engineer (AI)",
    "Collaboration & AI Services Administrator",
    "M365 Administrator",
  ],
  whatTheJobIs:
    "You own the AI tools the organisation has bought — who can use them, what they can reach, what is switched on, and what it costs. When 3,000 people get a licence, you are the person who decided what happens on their first login. Most of the job is configuration and judgement rather than programming, and it is the most common way people move into AI work from an existing IT role.",
  typicalDay: [
    "Reviewing a request to enable a connector, and deciding whether it goes to the whole company or one team",
    "Chasing why a group of users lost access after a directory change",
    "Pulling usage numbers because someone senior wants to know if the licences are worth renewing",
    "Sitting in a review meeting explaining what the tool does with data, to people who will not read the documentation",
    "Working out why the bill went up 40% and which automation caused it",
  ],
  transfersFrom: [
    {
      from: "Microsoft 365 / Google Workspace administration",
      why: "This is the same job with new services attached. You already know tenants, licensing, groups and the ticket queue — the AI-specific part is a few weeks of reading, not a career change.",
    },
    {
      from: "Service desk or IT support",
      why: "You already know how permissions break in practice and how users describe problems, which is most of the diagnostic skill. The gap is the configuration surface, and it is learnable.",
    },
    {
      from: "Identity or directory administration",
      why: "Identity is the hardest part of this role and you already have it. The rest is product knowledge.",
    },
    {
      from: "Anyone who has run a software rollout",
      why: "Change management, cohorts, communications and reclaiming unused licences are the parts that decide whether a rollout succeeds, and none of them are technical.",
    },
  ],
  entryReality:
    "This is the most accessible role on the platform for someone already in IT. It generally does not require programming, a degree in computer science, or prior AI experience. It does require you to be comfortable saying no to senior people and explaining why. If you have administered any SaaS platform at scale, you are closer than you think.",
  decodeTheAd: [
    {
      phrase: "Experience with Copilot / ChatGPT Enterprise / Gemini deployment",
      means:
        "They want someone who has configured a tenant, not someone who has used the product. Talk about connectors, retention and licence assignment, not about prompting.",
    },
    {
      phrase: "Strong stakeholder management",
      means:
        "You will be told to enable something you should not enable, and they want to know you will handle that without either caving or picking a fight.",
    },
    {
      phrase: "FinOps awareness",
      means:
        "Someone got a surprise invoice. They want budget alerts and licence reclamation, and it is an easy thing to be visibly good at.",
    },
    {
      phrase: "Security-minded",
      means:
        "They want you to spot that a connector requests more access than it needs, before it is approved rather than after.",
    },
  ],
  firstNinetyDays: [
    "Produce an accurate picture of who has access to what — most organisations do not have one",
    "Find and switch off the settings that were left at vendor defaults",
    "Get audit logs flowing somewhere with your own retention rather than the vendor's",
    "Reclaim licences from accounts that never activated, and be able to show the saving",
    "Establish the review route for connector requests so it stops being decided in chat",
  ],
  seniority: [
    {
      band: "Entry / junior",
      looksLike: "You action requests correctly and escalate the ones that need judgement.",
    },
    {
      band: "Mid",
      looksLike: "You own the configuration baseline and can defend each choice in a review.",
    },
    {
      band: "Senior / lead",
      looksLike:
        "You set the standard other administrators follow, and the security and privacy teams come to you before they write policy rather than after.",
    },
  ],
  interview: [
    {
      id: "pa-1",
      question: "Walk me through how you would roll out an AI assistant to 2,000 people.",
      testing:
        "Whether you think in phases and controls or in switches. Almost everyone answers with features; the strong answer is about sequence and what you configure before anyone signs in.",
      strongAnswer: [
        "Configure before licences activate — defaults are set for adoption, not for policy",
        "Identity first: enforce sign-in through the company directory and wire up automatic deactivation for leavers",
        "Connectors from a reviewed allowlist, with admin approval rather than self-service",
        "Audit logs streamed somewhere you control, because vendor console retention is shorter than your investigation window",
        "Pilot with a cohort who will report problems honestly, then expand in measured tranches",
        "Budget alerts per workload, because AI spend scales with use rather than headcount",
      ],
      weakAnswer:
        "Starting with training and communications. Those matter, but they are what you do after the configuration decisions, and leading with them signals you have not made those decisions.",
      difficulty: "core",
    },
    {
      id: "pa-2",
      question:
        "A senior executive is blocked by a device policy and wants an exception today. What do you do?",
      testing:
        "Whether you can hold a control without becoming an obstacle. They are checking for both spine and pragmatism.",
      strongAnswer: [
        "Name the risk specifically rather than citing policy",
        "Point out that senior accounts have the widest access, so an exception there carries more risk than it removes",
        "Offer a lower-trust session — browser only, no download — instead of a bypass",
        "Give a decision today rather than deferring, because deferral reads as obstruction",
      ],
      weakAnswer:
        "Either granting the exception because of who asked, or refusing on the grounds that policy is policy. Both answers end the conversation without solving the problem.",
      difficulty: "core",
    },
    {
      id: "pa-3",
      question: "How would you know if the AI rollout was working?",
      testing: "Whether you measure adoption or value. Most candidates answer with licence counts.",
      strongAnswer: [
        "Activation is a floor, not a measure — count weekly active use, not assigned seats",
        "Look at concentration: if 4% of users drive most of the consumption, something is either very good or broken",
        "Track reclaimed licences as a real saving",
        "Ask the pilot cohort's manager, not the enthusiasts who volunteered",
      ],
      weakAnswer:
        '"We assigned 2,000 licences and got 90% activation." Activation means someone logged in once.',
      difficulty: "opening",
    },
  ],
};

const securityArchitect: CareerProfile = {
  roleId: "security-architect",
  alsoAdvertisedAs: [
    "AI Security Architect",
    "Security Architect (AI/ML)",
    "Cloud Security Architect",
    "Application Security Architect",
    "AI Red Team / AI Security Engineer",
  ],
  whatTheJobIs:
    "You decide whether an AI system is safe enough to run, and you write down why. The distinctive part is that AI systems fail in ways traditional ones do not — a document can carry instructions that hijack the system, and a search can return something the person asking was never allowed to see. You review designs before they are built and you are the person who has to say what would have to change.",
  typicalDay: [
    "Reading a design document and writing the five questions that decide whether it is approvable",
    "Explaining prompt injection to a team who think their input validation covers it",
    "Working out whose permissions actually apply when the assistant fetches a document",
    "Negotiating what has to be fixed before launch versus what can be a condition",
    "Being asked to approve something on Friday for a Monday launch",
  ],
  transfersFrom: [
    {
      from: "Application or cloud security",
      why: "The method is identical — threat model, trust boundaries, least privilege. The AI-specific attacks are a reading list, not a new discipline.",
    },
    {
      from: "Penetration testing",
      why: "You already think adversarially, which is the hard part to teach. Prompt injection will feel immediately familiar as an injection class.",
    },
    {
      from: "Identity and access engineering",
      why: "The central question in AI security is whose identity reaches the data. You have been answering that question your whole career.",
    },
    {
      from: "Software engineering with a security interest",
      why: "Reviewing designs requires being able to read one. Engineers who move into this role are usually the strongest at spotting what a diagram is not showing.",
    },
  ],
  entryReality:
    "Harder to enter cold than the platform role — most people arrive with a security background rather than starting here. But the AI-specific portion is genuinely new to everyone, including senior people, so the gap between a strong candidate and a great one is smaller in this niche than in mature security fields.",
  decodeTheAd: [
    {
      phrase: "Experience with LLM security / OWASP Top 10 for LLM",
      means:
        "They want to hear prompt injection, insecure output handling and excessive agency discussed concretely, with the mitigations. Naming the list is not enough.",
    },
    {
      phrase: "Threat modelling",
      means:
        "They will ask you to threat model something live in the interview. Practise doing it out loud.",
    },
    {
      phrase: "Partner with engineering teams",
      means:
        "The last person in the role was seen as a blocker. They want someone who says what to change, not only what is wrong.",
    },
    {
      phrase: "Zero Trust",
      means:
        "Identity-bound access, device conditions, private networking and default-deny egress. Have a position on each.",
    },
  ],
  firstNinetyDays: [
    "Find out where the AI systems already are, including the ones nobody registered",
    "Trace one real request end to end and document which identity touches which system",
    "Establish what a review of an AI system actually asks, so teams can prepare rather than guess",
    "Fix the highest-leverage thing you find, so the function is seen to deliver rather than only assess",
  ],
  seniority: [
    {
      band: "Entry / junior",
      looksLike: "You can run a review against a checklist and escalate the unusual.",
    },
    {
      band: "Mid",
      looksLike: "You can threat model something you have never seen and defend the findings.",
    },
    {
      band: "Senior / principal",
      looksLike:
        "You change how systems get built, because teams design differently knowing what you will ask.",
    },
  ],
  interview: [
    {
      id: "sa-1",
      question: "How would you secure a retrieval-based assistant over confidential documents?",
      testing:
        "Whether you know where authorisation actually happens. This is the single most common AI security interview question and most candidates answer about the model.",
      strongAnswer: [
        "Authorisation runs at retrieval time, against the caller's live permissions, not the ingest job's",
        "Filtering after generation is too late — a model that has read the text will paraphrase it",
        "Permissions drift, so re-sync on a schedule and on change events, and check at query time",
        "Retrieved content is untrusted input: neutralise instructions inside it and do not let it trigger tool calls",
        "Test with two accounts at different clearance asking the same question",
      ],
      weakAnswer:
        "Talking about encryption, network controls and the vendor's certifications. All true, none of it stops the assistant quoting a document the user cannot open.",
      difficulty: "core",
    },
    {
      id: "sa-2",
      question: "What is prompt injection and why can you not just filter for it?",
      testing:
        "Whether you understand it as a trust-boundary problem or as a string-matching problem.",
      strongAnswer: [
        "Instructions hidden in content the system reads — a document, a web page, a supplier PDF",
        "The attacker never touches your system; they put text where it will eventually be read",
        "Filtering fails because there is no syntax to match — it is ordinary language",
        "Mitigation is a set of boundaries: treat retrieved content as data not instructions, scope tool-call authority to the user turn, least-privilege the agent identity, and constrain egress",
        "The damage is set by what the agent is allowed to do, so blast radius is the real control",
      ],
      weakAnswer:
        '"We sanitise inputs." There is nothing to sanitise — the payload is a normal English sentence.',
      difficulty: "core",
    },
    {
      id: "sa-3",
      question:
        "You find a serious issue two days before a launch that the business has announced. What happens next?",
      testing: "Judgement under pressure. They want to know if you are absolutist or negotiable.",
      strongAnswer: [
        "Separate the risk that is concentrated in one feature from the rest of the system",
        "Look for the narrowest constraint that removes the risk — often reducing autonomy rather than blocking release",
        'Be specific about what is wrong; "insufficient assurance" invites negotiation, a named exposure does not',
        "Know when conditions do not work: if it cannot be verified before the date, a condition is a wish",
        "Give a recommendation, not a question, if it escalates",
      ],
      weakAnswer:
        '"I would block it." Sometimes correct, but as a reflex it is why security teams get routed around.',
      difficulty: "senior",
    },
  ],
};

const governanceOperator: CareerProfile = {
  roleId: "governance-operator",
  alsoAdvertisedAs: [
    "AI Governance Analyst",
    "AI Risk Analyst",
    "Responsible AI Programme Manager",
    "Technology Governance Officer",
    "AI Compliance Specialist",
  ],
  whatTheJobIs:
    "You run the process that decides which AI systems are allowed and on what terms. That means maintaining the register of what exists, tiering each system by how much harm it could do, routing it to the right reviewers, and making sure the decision and its evidence are written down. It is an organisational job more than a technical one, and it is the fastest-growing of these roles because regulation is arriving.",
  typicalDay: [
    "Chasing a team who deployed something without telling anyone",
    "Deciding whether a proposed use case is a tier 1 or a tier 3, and defending the choice",
    "Finding out that a referral to Legal was sent five weeks ago and never answered",
    "Preparing the pack for an approval meeting and noticing what is missing from it",
    "Explaining to a frustrated engineer why the process exists",
  ],
  transfersFrom: [
    {
      from: "Audit, compliance or risk",
      why: "The discipline is identical: evidence, tiering, registers, sign-off, expiry. AI is a new subject area, not a new method.",
    },
    {
      from: "Project or programme management",
      why: "Most of this job is chasing, sequencing and getting decisions made by the right person. That is the same job.",
    },
    {
      from: "Data protection or privacy",
      why: "You already run impact assessments and know how to argue necessity and proportionality. AI adds the delta.",
    },
    {
      from: "Business analysis",
      why: "Intake is where this role lives, and turning a vague request into an assessable description is a business analyst's core skill.",
    },
  ],
  entryReality:
    "The most accessible of these roles for someone from outside technology entirely. It does not require you to build anything. It does require you to be organised, to be comfortable being unpopular occasionally, and to understand enough of how these systems work to know which questions to ask — which is exactly what this platform teaches.",
  decodeTheAd: [
    {
      phrase: "Familiarity with the EU AI Act / NIST AI RMF / ISO 42001",
      means:
        "They want the shape — risk tiering, documentation, human oversight, post-market monitoring — not memorised article numbers.",
    },
    {
      phrase: "Build and maintain the AI inventory",
      means:
        "They do not currently know what AI they have. Expect discovery to be most of your first quarter.",
    },
    {
      phrase: "Cross-functional collaboration",
      means:
        "Security, legal, privacy and engineering all have a view and none of them report to you. Influence without authority is the actual skill being tested.",
    },
    {
      phrase: "Drive adoption of the governance framework",
      means:
        "A framework exists on paper and nobody follows it. Your job is to make it usable enough that they do.",
    },
  ],
  firstNinetyDays: [
    "Build the inventory, including shadow usage — you cannot govern what you have not found",
    "Get a tiering method agreed that is based on harm and autonomy rather than vendor",
    "Make intake take minutes rather than weeks, or teams will route around it",
    "Close one long-open referral, so the process is seen to finish things",
  ],
  seniority: [
    { band: "Entry / junior", looksLike: "You run intake accurately and keep the register true." },
    {
      band: "Mid",
      looksLike: "You tier independently and your packs are complete when they reach a board.",
    },
    {
      band: "Senior / lead",
      looksLike:
        "You design the process, and teams come to you early because doing so is faster than not.",
    },
  ],
  interview: [
    {
      id: "go-1",
      question: "How would you decide how much scrutiny an AI system needs?",
      testing:
        "Whether you tier on the right axis. Most candidates answer with data sensitivity alone.",
      strongAnswer: [
        "Potential harm combined with how much the system decides without a human",
        "Autonomy is what turns a wrong output into a wrong outcome",
        "Data classification is an input, not the whole test",
        "Vendor reputation reduces supplier risk, not inherent risk",
        "Scale the controls to the tier, or the high-risk case is under-controlled and the low-risk one is stalled",
      ],
      weakAnswer:
        '"If it touches personal data it is high risk." A marketing copy tool on personal data is not the same risk as an unsupervised claims decision.',
      difficulty: "core",
    },
    {
      id: "go-2",
      question:
        "You discover a high-risk system has been live for six weeks without review. What now?",
      testing: "Whether you can be effective without being either punitive or a rubber stamp.",
      strongAnswer: [
        "Reduce autonomy immediately rather than shutting the service down — that removes most of the harm at a fraction of the cost",
        "Open a time-boxed exception with a named owner so the assessment happens under a deadline",
        "Look back at the decisions already made while it was unreviewed",
        "Do not issue a retrospective approval — it launders the failure and teaches everyone that shipping first works",
      ],
      weakAnswer:
        "Escalating it as a breach and stopping there. It may well be one, but the immediate question is how to reduce harm today.",
      difficulty: "senior",
    },
    {
      id: "go-3",
      question: "How do you get engineering teams to actually use the process?",
      testing: "Whether you understand that governance fails on friction, not on rules.",
      strongAnswer: [
        "Make intake fast — a form that takes twenty minutes gets filled in, one that takes a week gets avoided",
        "Tier so that low-risk work is genuinely quick, which buys credibility for the cases where you hold firm",
        "Give teams the questions in advance so review is preparable rather than a surprise",
        "Be seen to finish things: close referrals, publish decisions, expire old approvals",
      ],
      weakAnswer:
        "Mandate and escalation. It produces compliance theatre and drives usage underground.",
      difficulty: "core",
    },
  ],
};

const solutionArchitect: CareerProfile = {
  roleId: "solution-architect",
  alsoAdvertisedAs: [
    "AI Solution Architect",
    "AI Engineer",
    "Machine Learning Engineer (applied)",
    "Enterprise Architect (AI)",
    "GenAI Engineer",
  ],
  whatTheJobIs:
    "You design the AI system and are accountable for it working in production — not in a demo. That means retrieval quality, evaluation, cost per request, what happens when the provider degrades, and whether anyone can explain a decision six months later. It is the most technical of these roles and the one where the gap between a demo and a product is widest.",
  typicalDay: [
    "Working out why quality dropped after a prompt change nobody reviewed",
    "Deciding whether the problem is the model or the retrieval, which is usually the retrieval",
    "Defending a design in architecture review",
    "Reducing cost per request without losing quality",
    "Explaining to a stakeholder why 'it worked in the demo' and 'it works' are different claims",
  ],
  transfersFrom: [
    {
      from: "Backend or full-stack engineering",
      why: "This is a systems integration job. Timeouts, retries, circuit breakers and caching matter more here than model theory, and you already have them.",
    },
    {
      from: "Data engineering",
      why: "Ingestion, chunking, indexing and freshness are pipeline problems. That is your existing job with a different sink.",
    },
    {
      from: "Search or information retrieval",
      why: "Unusually direct transfer. Hybrid search, reranking and recall@k are the skills that most improve these systems, and almost nobody entering from an AI angle has them.",
    },
    {
      from: "Data science",
      why: "Evaluation design is the highest-leverage skill in the role and it is the one data scientists already have. The gap is production engineering.",
    },
  ],
  entryReality:
    "Requires programming. It does not require a machine learning PhD, and in most enterprise roles it does not require training models at all — you are integrating hosted ones. The people who do best are strong engineers who take measurement seriously, not people with the deepest model knowledge.",
  decodeTheAd: [
    {
      phrase: "Experience with RAG / vector databases",
      means:
        "They want to hear about chunking strategy, hybrid search and reranking, with numbers. Naming a vector database is not experience.",
    },
    {
      phrase: "Evaluation / LLMOps",
      means:
        "They have been burned by an unmeasurable system. Talk about golden sets, baselines and regression gates.",
    },
    {
      phrase: "Production experience",
      means:
        "They want failure modes: what you do when the provider degrades without failing, and how you roll back a prompt.",
    },
    {
      phrase: "Cost optimisation",
      means:
        "Someone got an invoice. Know your cost per resolved query and how you would halve it.",
    },
  ],
  firstNinetyDays: [
    "Build an evaluation set from real traffic and establish a baseline — without it nothing else is arguable",
    "Split retrieval quality from generation quality, because they get fixed by different work",
    "Put prompts under version control and behind a release gate",
    "Define what the product does when the model is unavailable",
  ],
  seniority: [
    { band: "Entry / junior", looksLike: "You implement a design and can debug it." },
    {
      band: "Mid",
      looksLike: "You design a system that survives production and can justify each trade-off.",
    },
    {
      band: "Senior / principal",
      looksLike:
        "You are trusted to say what should not be built, and your evaluation approach becomes how the organisation measures everything.",
    },
  ],
  interview: [
    {
      id: "sla-1",
      question: "Users say the assistant is often wrong. How do you find out why?",
      testing:
        "Whether you decompose or guess. The reflex answer is to upgrade the model, and it is usually wrong.",
      strongAnswer: [
        "Build or take a fixed evaluation set from real traffic, stratified by intent and difficulty",
        "Measure retrieval and generation separately — recall of the right document versus quality given the right document",
        "If generation is strong given correct context, the problem is retrieval and a bigger model will not help",
        "Fix retrieval first: hybrid search, reranking, chunking that matches document structure",
        "Store a baseline so the next change is comparable",
      ],
      weakAnswer:
        "Proposing a stronger model or more prompt engineering before measuring which stage fails.",
      difficulty: "core",
    },
    {
      id: "sla-2",
      question: "The model provider gets slow but does not fail. What happens to your product?",
      testing:
        "Whether you have thought about partial failure. Most candidates have only considered outages.",
      strongAnswer: [
        "Aggressive timeout on the model call — without one, requests queue and exhaust the pool",
        "Bulkhead so the AI feature cannot consume the resources the rest of the product needs",
        "Circuit breaker with a defined degraded mode, so the product still works without the model",
        "Alert on latency distribution, not just on errors — this failure returns HTTP 200 throughout",
      ],
      weakAnswer:
        '"We would fail over to a second provider." Without a timeout, the primary exhausts your connection pool before failover ever triggers.',
      difficulty: "senior",
    },
    {
      id: "sla-3",
      question: "How do you stop a prompt change from silently making things worse?",
      testing:
        "Whether you treat prompts as code. A prompt is the highest-leverage untracked change in most AI systems — one word alters behaviour — and candidates who describe it as configuration have not been burned by it yet.",
      strongAnswer: [
        "Prompts in the repository, reviewed and released as versioned artifacts, not edited in a console",
        "Golden-set evaluation gate that can block a release, not a report nobody reads",
        "Gate on groundedness, not only accuracy — accuracy can hold on the test set while grounding collapses",
        "Watch refusal rate: a model that stops saying 'I don't know' has stopped checking",
        "Pin the model version — a floating alias lets the provider change your system without a release",
      ],
      weakAnswer:
        "Peer review of the prompt text. Necessary, and it will not catch a 13-point grounding drop.",
      difficulty: "core",
    },
  ],
};

const grcLead: CareerProfile = {
  roleId: "grc-lead",
  alsoAdvertisedAs: [
    "AI Assurance Lead",
    "Head of AI Governance",
    "Technology Risk Lead",
    "Responsible AI Lead",
    "AI Audit Manager",
  ],
  whatTheJobIs:
    "You own whether the organisation can demonstrate — to a regulator, a client, or a board — that its AI is under control. That is a different job from making individual decisions: you design the framework, decide what evidence is required, and are accountable when someone asks for proof. It is a senior role and the one most exposed when something goes publicly wrong.",
  typicalDay: [
    "Deciding what evidence is sufficient for a control to be considered operating",
    "Briefing an executive who wants a one-line answer to a question that does not have one",
    "Reconciling three teams' conflicting views on whether something is approved",
    "Preparing for an external audit or a client's due-diligence questionnaire",
    "Deciding which risks to escalate and which to hold",
  ],
  transfersFrom: [
    {
      from: "Internal audit",
      why: "Evidence sufficiency is the core of both jobs, and it is the thing most AI governance functions get wrong.",
    },
    {
      from: "Operational or technology risk",
      why: "Framework design, appetite, escalation and reporting transfer directly. AI is a new risk domain within a familiar structure.",
    },
    {
      from: "Legal or regulatory compliance",
      why: "You already read obligations and translate them into requirements, which is most of what the emerging AI regulation demands.",
    },
    {
      from: "Consulting",
      why: "Structuring an ambiguous problem and getting senior people to a decision is the daily work.",
    },
  ],
  entryReality:
    "Genuinely senior — usually reached after years in risk, audit or compliance rather than entered directly. The AI-specific knowledge is the smallest part of the gap and the easiest to close; the harder requirement is the credibility to hold a position against commercial pressure.",
  decodeTheAd: [
    {
      phrase: "Establish the AI assurance framework",
      means:
        "There isn't one. You are building it, which is an opportunity and a lot of unglamorous work.",
    },
    {
      phrase: "Board-level reporting",
      means:
        "You will write things executives act on. Precision and brevity matter more than completeness.",
    },
    {
      phrase: "Regulatory horizon scanning",
      means:
        "Translating incoming regulation into what has to change here, before it is mandatory.",
    },
    {
      phrase: "Second line of defence",
      means:
        "You challenge and assure; you do not build and you do not accept the risk. Know the distinction and defend it.",
    },
  ],
  firstNinetyDays: [
    "Establish what evidence exists today versus what is asserted — usually a large gap",
    "Agree the tiering method and the approval route so decisions stop being ad hoc",
    "Put expiry and material-change triggers on every acceptance, so none becomes permanent",
    "Produce one honest report to the board, including what is not yet known",
  ],
  seniority: [
    {
      band: "Mid",
      looksLike: "You run assurance against an existing framework and report reliably.",
    },
    {
      band: "Senior",
      looksLike: "You design the framework and defend it against both regulators and the business.",
    },
    {
      band: "Head of / Director",
      looksLike:
        "You set risk appetite for AI and are the person the board asks when it goes wrong.",
    },
  ],
  interview: [
    {
      id: "grc-1",
      question: "What would you accept as evidence that a control is working?",
      testing:
        "Evidence sufficiency. This separates people who have been audited from people who have not.",
      strongAnswer: [
        "Not a policy — a policy is an intention",
        "Records showing the control operated: job run history with dates, sampled decisions, sign-offs with names",
        "Coverage and exceptions, because a control that ran on 60% of cases is a different control",
        "Something a third party could re-perform without asking you",
      ],
      weakAnswer:
        '"We have a documented process and staff are trained on it." That is evidence a process exists, not that it operated.',
      difficulty: "core",
    },
    {
      id: "grc-2",
      question: "How do you set risk appetite for AI when nobody has a baseline?",
      testing: "Whether you can act under genuine uncertainty rather than waiting for certainty.",
      strongAnswer: [
        "Anchor to existing appetite for equivalent harms — an AI decision that declines a customer is a customer-detriment risk you already have a position on",
        "Set it by autonomy and reversibility rather than by technology",
        "Start narrow and widen with evidence, rather than starting broad and retreating after an incident",
        "Make appetite reviewable on a short cycle while the technology is moving",
      ],
      weakAnswer:
        "Waiting for regulation or an industry standard to define it. The systems are being built now.",
      difficulty: "senior",
    },
    {
      id: "grc-3",
      question: "The business says your process is slowing them down. How do you respond?",
      testing:
        "Whether you can hear a legitimate complaint without either capitulating or dismissing it.",
      strongAnswer: [
        "Treat it as data — if low-risk work is slow, the tiering is wrong and that is your problem to fix",
        "Measure your own cycle time and publish it",
        "Concede the valid part; a function that cannot concede anything is not believed on the things that matter",
        "Hold the line where the risk is real, and be specific about which cases those are",
      ],
      weakAnswer:
        "Defending the process on principle. It is usually partly true, and refusing to hear it is how governance gets routed around.",
      difficulty: "core",
    },
  ],
};

export const careerProfiles: CareerProfile[] = [
  platformAdmin,
  governanceOperator,
  securityArchitect,
  solutionArchitect,
  grcLead,
];

export const careerByRole: Record<string, CareerProfile> = Object.fromEntries(
  careerProfiles.map((c) => [c.roleId, c]),
);

export const allInterviewQuestions = careerProfiles.flatMap((c) =>
  c.interview.map((q) => ({ ...q, roleId: c.roleId })),
);
