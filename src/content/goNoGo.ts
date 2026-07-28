import type { MasteryDomain } from "./types";

/**
 * Go / No-Go board cases.
 *
 * This is deliberately not the scenario runner. A scenario walks you through a
 * build; a board case drops you into the chair at the end of one, with an
 * incomplete dossier and people who want an answer today. The skill being
 * practised is not "what is the right architecture" — it is "what do you not
 * yet know, what will you sign, and can you hold the line when the operations
 * director pushes back".
 *
 * Scoring has four parts, matching how these go wrong in real life:
 *   evidence   — did you ask for the things that were actually missing
 *   decision   — is the call defensible given what you knew
 *   conditions — are the conditions enforceable rather than aspirational
 *   challenge  — did the position survive contact with the room
 */

export type EvidenceStatus = "provided" | "missing" | "stale";

export interface EvidenceItem {
  id: string;
  label: string;
  status: EvidenceStatus;
  /** What the document says, or — when missing — what it would have told you. */
  detail: string;
  /** A defensible decision cannot be made without this. Requesting it scores. */
  critical: boolean;
  /** Shown after the decision, explaining why this mattered or did not. */
  significance: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  scoreDelta: number;
  correct?: boolean;
  why: string;
}

export interface ConditionOption {
  id: string;
  label: string;
  /** Enforceable and load-bearing for this case. */
  correct: boolean;
  why: string;
}

export interface BoardChallenge {
  id: string;
  from: string;
  role: string;
  text: string;
  options: {
    id: string;
    label: string;
    scoreDelta: number;
    correct?: boolean;
    explain: string;
  }[];
}

export interface GoNoGoCase {
  id: string;
  title: string;
  domain: MasteryDomain;
  competencyIds: string[];
  tier: "Tier 1 — limited" | "Tier 2 — elevated" | "Tier 3 — high";
  summary: string;
  /** The paper in front of you when the meeting starts. */
  brief: string[];
  /** How many evidence requests the board will entertain before deciding. */
  requestBudget: number;
  evidence: EvidenceItem[];
  decisionPrompt: string;
  decisions: DecisionOption[];
  /** Offered when the learner chooses a conditional approval. */
  conditions: ConditionOption[];
  challenges: BoardChallenge[];
  debrief: { section: string; body: string }[];
}

const claimsAgent: GoNoGoCase = {
  id: "claims-triage-agent",
  title: "Claims triage agent — production release",
  domain: "governance_grc",
  competencyIds: [
    "gov.risk_classification",
    "plr.hitl",
    "plr.risk_acceptance",
    "gov.approval_workflow",
  ],
  tier: "Tier 3 — high",
  summary:
    "An agent that reads incoming claims, routes them, and auto-declines anything under £500. Operations want it live for the renewal peak in eleven days.",
  brief: [
    "The claims team receives 4,000 submissions a week and currently triages them by hand with a 6-day backlog.",
    "The proposed agent classifies each claim, routes it to a queue, and — for claims under £500 where the policy check fails — issues a decline letter without human review.",
    "Pilot ran for six weeks on a 5% sample. Operations report a 61% reduction in triage time.",
    "The operations director has asked the board for a decision today so the change can land before the renewal peak.",
  ],
  requestBudget: 3,
  evidence: [
    {
      id: "sar",
      label: "Security architecture review",
      status: "provided",
      detail:
        "Completed 3 weeks ago. Identity flows on-behalf-of to the claims database; model endpoint on a private endpoint; no findings above low.",
      critical: false,
      significance:
        "Genuinely complete and recent. Asking for this burns a request on a document already in the pack — a common way to waste the room's patience.",
    },
    {
      id: "pia",
      label: "Privacy impact assessment",
      status: "provided",
      detail:
        "Completed. Lawful basis is contract performance. Retention aligned to the claims record. Notes that automated decisions engage additional obligations and refers this to Legal.",
      critical: false,
      significance:
        "Present, and it flags the automated-decision point — which is the thread you should have pulled.",
    },
    {
      id: "decline-accuracy",
      label: "Accuracy of the auto-decline path specifically",
      status: "missing",
      detail:
        "The pilot reports aggregate triage accuracy of 94%. It does not break out the auto-decline decisions. Of 11,400 pilot claims, 380 were auto-declined and none were sampled for correctness.",
      critical: true,
      significance:
        "This is the whole case. Aggregate accuracy over routing tells you nothing about the accuracy of the one action that has an adverse effect on a customer and no human in the path.",
    },
    {
      id: "appeal",
      label: "Appeal and human review route for declined claimants",
      status: "missing",
      detail:
        "No documented route. The decline letter template gives a phone number for the general claims line, which cannot see the agent's reasoning.",
      critical: true,
      significance:
        "An automated adverse decision with no meaningful route to human review is a regulatory problem before it is a quality problem.",
    },
    {
      id: "legal-position",
      label: "Legal position on automated decision-making",
      status: "missing",
      detail:
        "The PIA referred this to Legal five weeks ago. No response has been recorded and the referral was not chased.",
      critical: true,
      significance:
        "The PIA identified the issue and the referral went unanswered. Approving over an open referral puts the board's signature on an unresolved legal question.",
    },
    {
      id: "finops",
      label: "Cost model",
      status: "provided",
      detail: "£0.031 per claim against a £0.04 target. Forecast holds at full volume.",
      critical: false,
      significance: "Fine, and not what makes this decision difficult.",
    },
    {
      id: "rollback",
      label: "Rollback plan",
      status: "stale",
      detail:
        "Written for the pilot architecture, which routed to a queue only. It does not cover reversing issued decline letters.",
      critical: false,
      significance:
        "Worth noticing — a rollback plan that cannot un-send a letter is not a rollback plan for this design — but it follows from the autonomy decision rather than driving it.",
    },
  ],
  decisionPrompt: "The room is waiting. What is your call on the claims triage agent as proposed?",
  decisions: [
    {
      id: "go",
      label: "Go — approve as proposed",
      scoreDelta: -4,
      why: "The auto-decline path has never been measured, has no appeal route, and sits on an unanswered legal referral about automated decision-making. Approving means signing for all three.",
    },
    {
      id: "conditions",
      label: "Go with conditions — approve the triage, constrain the autonomy",
      scoreDelta: 4,
      correct: true,
      why: "The triage and routing is where the benefit is and the risk is low. The auto-decline is where the risk is and the evidence is absent. Splitting them lets operations have the backlog reduction in time for the peak while the adverse path is properly evidenced.",
    },
    {
      id: "no-go",
      label: "No-Go — send it back until the pack is complete",
      scoreDelta: 1,
      why: "Defensible and safe. But it blocks a 61% triage improvement to address a risk that lives entirely in the auto-decline path, and it will be read as the board refusing to engage with the business need. The conditional approval reaches the same risk position without the cost.",
    },
  ],
  conditions: [
    {
      id: "no-auto-decline",
      label: "Auto-decline disabled; all declines route to a human queue",
      correct: true,
      why: "Removes the entire unevidenced adverse path while keeping the triage benefit. This is the load-bearing condition.",
    },
    {
      id: "sample-review",
      label: "Retrospective sample review of the 380 pilot auto-declines",
      correct: true,
      why: "Those decisions have already reached customers. You need to know whether any were wrong, and it is also the accuracy data that was missing.",
    },
    {
      id: "legal-answer",
      label: "Written Legal position on automated decision-making before autonomy is restored",
      correct: true,
      why: "Closes the open referral and ties the answer to the specific capability rather than to the system in general.",
    },
    {
      id: "appeal-route",
      label: "Documented appeal route with access to the decision record",
      correct: true,
      why: "A human reviewing an appeal has to be able to see what the system saw, or the review is theatre.",
    },
    {
      id: "expiry",
      label: "Approval expires in 6 months or on material change to capability or autonomy",
      correct: true,
      why: "Without it, this approval becomes standing permission for a system that will keep changing.",
    },
    {
      id: "training",
      label: "Claims staff trained on the new tooling",
      correct: false,
      why: "Sensible operationally and worth doing, but it is not a control on any of the risks in this pack. Conditions that are merely good practice dilute the ones that matter.",
    },
    {
      id: "monthly-report",
      label: "Monthly usage report to the board",
      correct: false,
      why: "Reporting volume is not oversight of correctness. This is the kind of condition that looks like governance and changes nothing.",
    },
    {
      id: "vendor-cert",
      label: "Vendor to provide their SOC 2 report",
      correct: false,
      why: "The system is built in-house on an already-reviewed platform. This addresses a supplier risk that is not in this case.",
    },
  ],
  challenges: [
    {
      id: "peak",
      from: "Operations Director",
      role: "Accountable for the claims backlog",
      text: "Eleven days to the peak. If we can't auto-decline, the backlog stays and my team works weekends. The pilot ran six weeks with no complaints — what exactly are you worried about?",
      options: [
        {
          id: "concede",
          label: "Agree to allow auto-decline during the peak only, reverting afterwards",
          scoreDelta: -3,
          explain:
            "A time-boxed exception on the highest-volume weeks of the year maximises exposure to the exact risk you just identified. Peak is when a wrong decline reaches the most people.",
        },
        {
          id: "hold",
          label:
            "Hold: the backlog is caused by triage, which is approved. The auto-decline saves a fraction of the time and carries all of the risk.",
          scoreDelta: 3,
          correct: true,
          explain:
            "Correct, and it is the argument that wins because it engages with their problem. The triage approval delivers the backlog reduction. The auto-decline is a small marginal saving carrying an unevidenced adverse path — say which number is which and the case makes itself.",
        },
        {
          id: "defer",
          label: "Offer to reconvene the board next week once Legal responds",
          scoreDelta: 0,
          explain:
            "Avoids the argument rather than answering it, and hands the operations director a week of delay to attribute to governance. You already have a decision that unblocks them today.",
        },
      ],
    },
    {
      id: "no-complaints",
      from: "Head of Claims Technology",
      role: "Built the system",
      text: "Six weeks, 380 auto-declines, zero complaints. Isn't the absence of complaints evidence that it works?",
      options: [
        {
          id: "accept",
          label: "Accept it as supporting evidence and note it in the record",
          scoreDelta: -2,
          explain:
            "Declined claimants under £500 frequently do not appeal — the amount is below the effort threshold. Silence from that population is the least reliable signal available.",
        },
        {
          id: "reframe",
          label:
            "No — a low-value decline is exactly the population least likely to complain. Measure the decisions, not the silence.",
          scoreDelta: 3,
          correct: true,
          explain:
            "Correct. Absence of complaint is not evidence of correctness, particularly where the claim value is below what most people will spend effort contesting. This is why the sample review is a condition rather than a suggestion.",
        },
        {
          id: "split",
          label: "Accept it partially — treat it as weak evidence pending the sample review",
          scoreDelta: 1,
          explain:
            "Better, but it still lends weight to a signal that carries none here. The sample review is not confirming a weak signal, it is producing the only real one.",
        },
      ],
    },
  ],
  debrief: [
    {
      section: "The shape of this case",
      body: "One system, two very different risk profiles. Triage and routing is reversible, supervised, and well evidenced. Auto-decline is an adverse action against a customer, unsupervised, and completely unmeasured. Boards that treat a submission as a single yes/no miss that the risk is concentrated in a fraction of the functionality.",
    },
    {
      section: "What the evidence pack told you",
      body: "The PIA had already spotted the automated-decision problem and referred it to Legal. The referral was never answered and never chased. A pack that contains its own unanswered question is the most common shape of an incomplete submission — and the referral is more informative than any of the documents that were complete.",
    },
    {
      section: "Holding the line",
      body: "The strongest position is almost never 'no'. It is the narrowest constraint that removes the risk, argued in terms of the business outcome the other side cares about. Blocking the whole release would have cost the backlog reduction and bought nothing extra.",
    },
  ],
};

const vendorCopilot: GoNoGoCase = {
  id: "vendor-copilot-rollout",
  title: "Vendor coding copilot — firm-wide rollout",
  domain: "privacy_legal_risk",
  competencyIds: ["plr.client_restrictions", "plr.ip", "gov.approval_workflow", "sec.ssdlc"],
  tier: "Tier 2 — elevated",
  summary:
    "Engineering wants a vendor coding assistant for 600 developers. Procurement is done, security is comfortable, and two client contracts are the problem nobody has read.",
  brief: [
    "600 engineers across 40 client engagements. The tool suggests code inline and can be pointed at a repository for context.",
    "Procurement has negotiated enterprise terms. Security completed their review with no high findings.",
    "A 40-person trial reported a 22% reduction in time to first commit.",
    "The CTO has budget approval and wants to move this week.",
  ],
  requestBudget: 3,
  evidence: [
    {
      id: "security",
      label: "Security review",
      status: "provided",
      detail:
        "Complete. SSO enforced, no telemetry containing source code, self-hosted proxy option available. No findings above low.",
      critical: false,
      significance: "Thorough and current. Security is not what makes this case hard.",
    },
    {
      id: "client-contracts",
      label: "Review of client contract restrictions on third-party processing",
      status: "missing",
      detail:
        "No review has been done. Of 40 engagements, 6 are under contracts with explicit restrictions on third-party services touching client material, and 2 of those are in regulated sectors requiring prior written approval.",
      critical: true,
      significance:
        "Client contracts are the binding constraint and nobody read them. Source code written for a client is client material, and a repository-context feature sends it to a third party.",
    },
    {
      id: "ip-terms",
      label: "Output IP and training terms in the vendor agreement",
      status: "stale",
      detail:
        "Procurement's summary references the vendor's standard terms from 14 months ago. The current terms grant the vendor a licence to use customer content to 'operate and improve the services', and the negotiated order form was not attached.",
      critical: true,
      significance:
        "A stale summary of the terms is not the terms. The improvement licence conflicts with confidentiality obligations you already owe clients, and the order form that supposedly fixes it is not in the pack.",
    },
    {
      id: "oss-licence",
      label: "Position on suggested code matching open-source licences",
      status: "missing",
      detail:
        "The vendor offers a filter for suggestions matching public code, disabled by default. No position has been taken on whether to enable it or what happens if copyleft-licensed code reaches a client deliverable.",
      critical: true,
      significance:
        "Copyleft code in a client deliverable is a contamination problem that surfaces years later during due diligence, and the control is a toggle nobody has turned on.",
    },
    {
      id: "trial-results",
      label: "Trial results",
      status: "provided",
      detail: "40 engineers, 6 weeks, 22% reduction in time to first commit, high satisfaction.",
      critical: false,
      significance:
        "Real and useful, but it measures speed, not the two risks that matter here. Trials rarely surface contractual problems because trial participants are volunteers on internal work.",
    },
    {
      id: "ssdlc",
      label: "How suggestions enter the SSDLC",
      status: "provided",
      detail:
        "Suggestions are subject to the same pull-request review, SAST and dependency scanning as hand-written code. No change to the merge gate.",
      critical: false,
      significance: "A good answer, and it is the reason security had few concerns.",
    },
  ],
  decisionPrompt: "What is your call on the firm-wide rollout?",
  decisions: [
    {
      id: "go",
      label: "Go — approve firm-wide",
      scoreDelta: -4,
      why: "Six engagements are under contracts that restrict this, two require prior written approval, the IP terms in the pack are 14 months out of date, and the open-source matching filter is off. None of that has been assessed.",
    },
    {
      id: "conditions",
      label: "Go with conditions — approve for engagements that permit it, exclude the rest",
      scoreDelta: 4,
      correct: true,
      why: "34 of 40 engagements have no restriction and get the tool immediately. The 6 that do are excluded at the tenant level while approval is sought. This is the answer that respects both the contracts and the business case.",
    },
    {
      id: "no-go",
      label: "No-Go — no rollout until every contract is reviewed",
      scoreDelta: 0,
      why: "Blocks 34 unaffected engagements to manage a risk confined to 6. A contract review across 40 engagements takes weeks, and the delay is attributable to governance rather than to the restriction.",
    },
  ],
  conditions: [
    {
      id: "exclude-restricted",
      label: "Restricted engagements excluded at tenant level, not by written guidance",
      correct: true,
      why: "Guidance is forgotten under deadline. If the exclusion is not enforced in configuration, it is not enforced.",
    },
    {
      id: "current-terms",
      label: "Current signed order form and DPA attached to the record before rollout",
      correct: true,
      why: "The negotiated terms either exist or they do not. A 14-month-old summary is not evidence of what you signed.",
    },
    {
      id: "oss-filter",
      label: "Public-code matching filter enabled and enforced by policy",
      correct: true,
      why: "The control already exists and is off. Turning it on costs nothing and closes the contamination path.",
    },
    {
      id: "no-repo-context",
      label: "Repository-context feature disabled until per-engagement permission is confirmed",
      correct: true,
      why: "Inline suggestion and whole-repository context are different disclosure profiles. The second sends client material to the vendor.",
    },
    {
      id: "approval-track",
      label: "Client approval sought in writing for the 6 restricted engagements",
      correct: true,
      why: "Turns a permanent exclusion into a temporary one, and it is the only route to using the tool on that work.",
    },
    {
      id: "usage-dashboard",
      label: "Adoption dashboard for the CTO",
      correct: false,
      why: "Measures uptake, not any risk in this case. A condition that produces a chart nobody acts on is governance theatre.",
    },
    {
      id: "annual-review",
      label: "Annual review of the tool",
      correct: false,
      why: "Too slow to matter and unattached to any specific trigger. Material change is the event worth reviewing on, not the calendar.",
    },
  ],
  challenges: [
    {
      id: "everyone-uses-it",
      from: "CTO",
      role: "Sponsor",
      text: "Every firm we compete with is using this. Our engineers are already using the free tier on personal accounts. Isn't a sanctioned rollout strictly safer than what's happening now?",
      options: [
        {
          id: "capitulate",
          label: "Agree — sanctioned use is safer, approve firm-wide to displace shadow usage",
          scoreDelta: -3,
          explain:
            "The shadow usage is a real and urgent problem, but it does not make an unassessed rollout compliant. It argues for moving fast on the 34 permitted engagements, not for including the 6 that are contractually restricted.",
        },
        {
          id: "use-it",
          label:
            "Agree that shadow usage is the more urgent risk — and use it to argue for approving the 34 engagements today rather than waiting for a full review",
          scoreDelta: 3,
          correct: true,
          explain:
            "Correct. Take the point and turn it. Shadow usage is unmanaged and uncontracted, so getting 34 engagements onto a sanctioned tenant this week is a genuine improvement — and it strengthens rather than weakens the case for excluding the 6.",
        },
        {
          id: "dismiss",
          label: "Note that shadow usage is a separate disciplinary matter",
          scoreDelta: -1,
          explain:
            "Technically true and strategically poor. It refuses a valid point, invites the sponsor to route around you, and leaves the shadow usage in place.",
        },
      ],
    },
    {
      id: "ip-shrug",
      from: "General Counsel's delegate",
      role: "Legal",
      text: "On the open-source matching — realistically, how likely is it that a suggestion reproduces licensed code verbatim and that anyone ever notices?",
      options: [
        {
          id: "agree-low",
          label: "Agree the likelihood is low and record it as an accepted risk",
          scoreDelta: -2,
          explain:
            "Low likelihood, but the impact lands years later in due diligence when the deliverable is being sold or audited, and by then it is unfixable. This is a classic low-probability, high-cost, cheap-to-prevent case.",
        },
        {
          id: "cost-of-control",
          label:
            "Point out the control is a toggle that is already available and currently off — the cost of prevention is zero, so likelihood is not the deciding factor",
          scoreDelta: 3,
          correct: true,
          explain:
            "Correct. Arguing probability is the wrong frame when the mitigation is free. Reserve risk-acceptance arguments for controls that actually cost something.",
        },
        {
          id: "escalate",
          label: "Refer the question back to Legal for a formal opinion",
          scoreDelta: 0,
          explain:
            "Legal is in the room asking you. Referring a question back to the person who raised it delays a decision you can make with a configuration change.",
        },
      ],
    },
  ],
  debrief: [
    {
      section: "The shape of this case",
      body: "Security was thorough and irrelevant to the decision. The binding constraints were in contracts the firm had already signed with its own clients, and nobody had read them because contract review is not on the standard technology approval checklist.",
    },
    {
      section: "Stale is worse than missing",
      body: "A 14-month-old summary of vendor terms is more dangerous than no summary, because it makes the pack look complete. Missing evidence gets asked about; stale evidence gets read and believed.",
    },
    {
      section: "Holding the line",
      body: "The shadow-usage argument was correct and the right response was to accept it, not deflect it. A governance function that cannot concede a good point loses the ability to be believed on the bad ones.",
    },
  ],
};

const publicChatbot: GoNoGoCase = {
  id: "public-support-chatbot",
  title: "Customer-facing support chatbot — public launch",
  domain: "architecture",
  competencyIds: [
    "eng.groundedness",
    "sec.prompt_injection",
    "arch.resilience",
    "plr.responsible_ai",
  ],
  tier: "Tier 3 — high",
  summary:
    "A support chatbot on the public website, answering from the product knowledge base. Marketing has booked the announcement. It answers well in demos.",
  brief: [
    "A public, unauthenticated chatbot on the support site, grounded in the published product documentation and the internal support knowledge base.",
    "Intended to deflect 30% of tier-1 contacts. Marketing has a launch announcement scheduled for the 14th.",
    "Internal demos have been strong. The team describes quality as 'very good'.",
    "This is the first customer-facing AI system the company has shipped.",
  ],
  requestBudget: 3,
  evidence: [
    {
      id: "eval",
      label: "Evaluation results against a fixed test set",
      status: "missing",
      detail:
        "No evaluation set exists. Quality is assessed by the team trying it and by demo feedback. There is no baseline and no measurement of groundedness.",
      critical: true,
      significance:
        "'Very good in demos' is the team asking questions they know the answer to. Without a fixed set there is no way to know quality now, and no way to detect a regression later.",
    },
    {
      id: "kb-scope",
      label: "What the knowledge base actually contains",
      status: "missing",
      detail:
        "The internal support KB was indexed wholesale. It includes 1,200 internal-only articles: escalation thresholds, known-defect lists with customer names, and pricing discount authority.",
      critical: true,
      significance:
        "An unauthenticated public endpoint grounded in an internal corpus. The failure here is not a wrong answer, it is a correct answer to a question no member of the public should be able to have answered.",
    },
    {
      id: "injection",
      label: "Prompt injection and jailbreak testing",
      status: "missing",
      detail:
        "None performed. The system prompt contains the deflection instructions and a list of topics to avoid, including unreleased product names.",
      critical: true,
      significance:
        "Public and unauthenticated means adversarial from day one. A system prompt containing what to avoid is a list of what to extract.",
    },
    {
      id: "sar",
      label: "Security architecture review",
      status: "provided",
      detail:
        "Complete. Rate limiting in place, no authenticated data paths, model endpoint private, WAF in front.",
      critical: false,
      significance:
        "Solid on the infrastructure. It reviewed how the system is reached, not what it will say.",
    },
    {
      id: "fallback",
      label: "Behaviour when the model is unavailable or uncertain",
      status: "stale",
      detail:
        "Design doc from an earlier version says 'fall back to the contact form'. The current implementation retries three times and then renders an error.",
      critical: false,
      significance:
        "Worth catching — a public page showing an error instead of a contact route loses the customer entirely — but it is a smaller problem than the corpus.",
    },
    {
      id: "brand",
      label: "Marketing sign-off on tone",
      status: "provided",
      detail: "Approved. Tone guidelines embedded in the system prompt.",
      critical: false,
      significance: "Not a risk control. Asking for this wastes a request.",
    },
  ],
  decisionPrompt: "Marketing has the announcement booked for the 14th. What is your call?",
  decisions: [
    {
      id: "go",
      label: "Go — launch as planned",
      scoreDelta: -5,
      why: "A public, unauthenticated endpoint grounded in an internal corpus containing customer names and discount authority, with no evaluation, no baseline, and no adversarial testing. This is the case where 'no' is correct.",
    },
    {
      id: "conditions",
      label: "Go with conditions — launch on the 14th with conditions attached",
      scoreDelta: -2,
      why: "Conditions only work when the risk can be constrained by configuration you can verify before the date. Here the corpus has to be rebuilt and the system adversarially tested, and neither can be evidenced in the time available. A condition you cannot verify before launch is a wish.",
    },
    {
      id: "no-go",
      label: "No-Go — the launch date moves",
      scoreDelta: 5,
      correct: true,
      why: "Correct. Three critical unknowns, one of which is an internal corpus exposed to the public internet. The announcement is a marketing commitment, not a constraint on the risk, and this is precisely the case a board exists to stop.",
    },
  ],
  conditions: [
    {
      id: "public-corpus",
      label: "Corpus rebuilt from published documentation only, verified article by article",
      correct: true,
      why: "The only durable fix. A public endpoint must be grounded in a public corpus.",
    },
    {
      id: "eval-set",
      label: "Evaluation set built from real support traffic with a groundedness baseline",
      correct: true,
      why: "Establishes what quality is now so a regression is detectable later.",
    },
    {
      id: "redteam",
      label: "Adversarial testing including prompt extraction, with findings closed",
      correct: true,
      why: "Public and unauthenticated means it will be attacked. Better it is attacked by you first.",
    },
    {
      id: "graceful",
      label: "Defined fallback to a human contact route on failure or low confidence",
      correct: true,
      why: "A public support surface must degrade to something useful rather than an error.",
    },
    {
      id: "soft-launch",
      label: "Launch to 5% of traffic with monitoring before the announcement",
      correct: true,
      why: "Once the corpus and testing are addressed, a staged exposure is how you find what the evaluation missed.",
    },
    {
      id: "disclaimer",
      label: "Add a disclaimer that answers may be inaccurate",
      correct: false,
      why: "A disclaimer does not prevent disclosure of an internal escalation threshold or a named customer defect. Compensating text is not a control.",
    },
    {
      id: "log-review",
      label: "Weekly review of chat transcripts",
      correct: false,
      why: "Detection after publication. On a public endpoint the disclosure has already happened by the time anyone reads the log.",
    },
  ],
  challenges: [
    {
      id: "announcement",
      from: "Chief Marketing Officer",
      role: "Owns the launch",
      text: "The announcement is booked, the press are briefed, and the CEO mentions it in the earnings call on the 16th. Moving this is not a small ask. What do I tell them?",
      options: [
        {
          id: "soften",
          label:
            "Offer a limited launch on the 14th — the announcement goes ahead with a smaller rollout",
          scoreDelta: -3,
          explain:
            "A limited public launch is still a public launch. The corpus problem does not scale down: one member of the public asking one question can retrieve a named customer defect.",
        },
        {
          id: "specific",
          label:
            "Tell them the corpus currently includes customer names and discount authority on a public endpoint — and give a date you can defend, not a date that fits the calendar",
          scoreDelta: 3,
          correct: true,
          explain:
            "Correct. Marketing can move a date; they cannot unpublish a disclosure. Being concrete about what is in the corpus converts an abstract governance objection into something the CMO can carry to the CEO themselves.",
        },
        {
          id: "escalate-only",
          label: "Escalate the decision to the CEO and let them weigh launch against risk",
          scoreDelta: 0,
          explain:
            "You may end up there, but arriving without a recommendation abdicates the board's function. Escalate with a position, not with a question.",
        },
      ],
    },
    {
      id: "demo-quality",
      from: "Head of Support Engineering",
      role: "Built the system",
      text: "We've been using it internally for a month. It's good. What would an evaluation set tell us that a month of real use hasn't?",
      options: [
        {
          id: "concede",
          label: "Accept a month of internal use as sufficient evidence of quality",
          scoreDelta: -2,
          explain:
            "Internal users ask questions in internal vocabulary and recognise a wrong answer immediately. Neither is true of the public, and neither produces a number you can compare against next month.",
        },
        {
          id: "baseline",
          label:
            "It tells you what 'good' equals as a number — so that when the prompt changes next month you can tell whether it got worse",
          scoreDelta: 3,
          correct: true,
          explain:
            "Correct, and it is the argument that lands with an engineer. The evaluation set is not there to prove the system is bad today; it is the only way to detect the regression that arrives with the next prompt edit.",
        },
        {
          id: "authority",
          label: "Point out that policy requires an evaluation for customer-facing systems",
          scoreDelta: 0,
          explain:
            "True but unpersuasive, and it teaches the team to treat governance as paperwork. Explain what the artefact is for and they will build a better one than the policy asked for.",
        },
      ],
    },
  ],
  debrief: [
    {
      section: "The shape of this case",
      body: "This is the case where the conditional approval is wrong. Conditions work when the risk can be reduced to something you verify before the date. Rebuilding a corpus and running adversarial testing cannot be evidenced in eleven days, so attaching them as conditions to a launch that proceeds anyway is a way of appearing to have controlled something.",
    },
    {
      section: "Public changes the threshold",
      body: "An unauthenticated public endpoint has no identity to trim by, no user to hold accountable, and an adversarial population from the first minute. Grounding it in an internal corpus is not a configuration mistake, it is a category error about what the system is.",
    },
    {
      section: "Holding the line",
      body: "Specificity is what makes a No-Go survive. 'Insufficient assurance' invites negotiation. 'The corpus currently contains named customer defects and discount authority, and the endpoint is public' does not.",
    },
  ],
};

export const goNoGoCases: GoNoGoCase[] = [claimsAgent, vendorCopilot, publicChatbot];

export const goNoGoCasesById: Record<string, GoNoGoCase> = Object.fromEntries(
  goNoGoCases.map((c) => [c.id, c]),
);
