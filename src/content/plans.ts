import type { Level } from "@/lib/prefs";

/**
 * Learning plans.
 *
 * The catalogue is a library: thirteen labs, sixteen platforms, eight
 * scenarios, three board cases, all presented flat. A library is the correct
 * shape for someone who already knows what they need and the wrong shape for
 * everyone else — which is why the first thing this platform lacked was an
 * answer to "where do I start".
 *
 * A plan is an ordered list with a reason attached to each step. The reason is
 * the part that matters: "do this next" is an instruction, "do this next
 * because you cannot judge the connector question until you know how retrieval
 * decides what to show" is teaching.
 */

export type Goal =
  "starting-out" | "evaluating" | "deploying" | "securing" | "governing" | "building";

export type StepTarget =
  | { kind: "lab"; id: string }
  | { kind: "simulator"; id: string }
  | { kind: "board"; id: string }
  | { kind: "scenario"; id: string }
  /** The 16-stage vertical slice, which has its own route rather than a param. */
  | { kind: "flagship" }
  | { kind: "platform"; id: string }
  | { kind: "exam"; id: string }
  | { kind: "flashcards" }
  | { kind: "careers" }
  | { kind: "portfolio" }
  | { kind: "glossary" };

export interface PlanStep {
  id: string;
  title: string;
  /** Why this, and why now. Shown under the step, always. */
  because: string;
  target: StepTarget;
  /** Rough minutes, so a learner can decide whether they have time now. */
  minutes: number;
}

export interface Plan {
  goal: Goal;
  label: string;
  /** Second person, present tense — this is the situation they told us about. */
  situation: string;
  steps: PlanStep[];
}

export const GOALS: { id: Goal; label: string; blurb: string }[] = [
  {
    id: "starting-out",
    label: "Trying to get into AI work at all",
    blurb:
      "You do not work in technology and you are not sure you are allowed to want this. Start here.",
  },
  {
    id: "evaluating",
    label: "Working out whether to use AI at all",
    blurb: "A tool has been proposed, or leadership is asking, and you need to form a view.",
  },
  {
    id: "deploying",
    label: "Rolling a tool out to people",
    blurb: "Licences are coming and you own making it work without creating a mess.",
  },
  {
    id: "securing",
    label: "Securing something already built",
    blurb: "It exists, it works, and now someone has to make it safe.",
  },
  {
    id: "governing",
    label: "Deciding what gets approved",
    blurb: "You sit on the review side and have to say yes, no, or yes-but.",
  },
  {
    id: "building",
    label: "Building an AI system",
    blurb: "You are writing it, and you want it to survive review and production.",
  },
];

/** Steps everyone starts with when they told us they are new. */
const orientationSteps: PlanStep[] = [
  {
    id: "vocab",
    title: "Learn the twenty words everything else assumes",
    because:
      "Almost nothing here is conceptually hard. What makes it feel hard is that the first paragraph uses six acronyms nobody defined. Fifteen minutes here saves you rereading everything twice.",
    target: { kind: "glossary" },
    minutes: 15,
  },
  {
    id: "how-it-works",
    title: "See how an enterprise AI assistant actually works",
    because:
      "Every risk in this platform comes from one design: the system searches your documents and hands what it finds to a model. Understand that and the security, privacy and governance questions stop being arbitrary rules.",
    target: { kind: "lab", id: "rag" },
    minutes: 25,
  },
];

const plans: Plan[] = [
  {
    goal: "starting-out",
    label: "Trying to get into AI work at all",
    situation:
      "You have no technology background and no idea whether any of this is open to you. Some of it is, and the fastest route in is not the one people assume.",
    steps: [
      {
        id: "start-vocab",
        title: "Learn the twenty words everything else assumes",
        because:
          "None of this is conceptually hard. It feels hard because the first paragraph anyone writes uses six acronyms nobody defined. Fifteen minutes here changes how every other page reads.",
        target: { kind: "glossary" },
        minutes: 15,
      },
      {
        id: "start-jobs",
        title: "Find out which of these jobs you could already do",
        because:
          "Customer service, teaching, healthcare admin, editing and claims handling all transfer directly into AI operations work — and almost nobody in those jobs knows it. Read the transfer routes before you decide you are unqualified.",
        target: { kind: "careers" },
        minutes: 20,
      },
      {
        id: "start-ops",
        title: "Learn the work: reviewing what an AI produced",
        because:
          "This is the most reachable AI job there is and it teaches you how these systems actually fail, which is the knowledge every other role on this platform is built on.",
        target: { kind: "lab", id: "ai-operations" },
        minutes: 45,
      },
      {
        id: "start-ops-sim",
        title: "Design a review queue and watch it degrade",
        because:
          "Knowing the job is not the same as being able to discuss it. This puts you in charge of the decisions that determine whether the control is real, then tests them against live traffic.",
        target: { kind: "simulator", id: "ai-operations-queue" },
        minutes: 30,
      },
      {
        id: "start-how-ai-works",
        title: "See how an enterprise AI assistant actually works",
        because:
          "Everything you reviewed came out of one design: the system searches documents and hands what it finds to a model. Once that is concrete, the security and governance questions stop being arbitrary.",
        target: { kind: "lab", id: "rag" },
        minutes: 25,
      },
      {
        id: "start-eval",
        title: "Learn to measure whether an AI system is any good",
        because:
          "This is the natural step up from review work, it pays better, and research, editing and teaching backgrounds transfer into it unusually well. It is also the skill that makes you useful to an engineering team.",
        target: { kind: "lab", id: "ai-evaluation" },
        minutes: 45,
      },
      {
        id: "start-eval-sim",
        title: "Build an evaluation and report an unwelcome result",
        because:
          "The authority of this role comes from being willing to say a change did nothing. Practise that once here and you will recognise the moment when it happens for real.",
        target: { kind: "simulator", id: "ai-evaluation-design" },
        minutes: 30,
      },
      {
        id: "start-record",
        title: "Export what you have done",
        because:
          "You now have scored work in two roles. Turn it into the record you attach to an application — honestly framed as practice, which is what makes it credible.",
        target: { kind: "portfolio" },
        minutes: 10,
      },
    ],
  },
  {
    goal: "evaluating",
    label: "Working out whether to use AI at all",
    situation: "You need a view you can defend, without becoming an engineer to get there.",
    steps: [
      {
        id: "eval-platforms",
        title: "See what the actual products do",
        because:
          "Vendor material describes capability; this describes what each product does to your data, which is the part that decides whether you can use it.",
        target: { kind: "platform", id: "m365-copilot" },
        minutes: 15,
      },
      {
        id: "eval-legal",
        title: "Find the constraint that is usually already binding",
        because:
          "In most organisations the blocker is not security — it is a contract you already signed with a client or a regulator. That is the thing to check before anything else.",
        target: { kind: "lab", id: "legal" },
        minutes: 30,
      },
      {
        id: "eval-board",
        title: "Sit in the chair and make the call",
        because:
          "You will be asked for a recommendation with an incomplete pack and someone senior pushing for a yes. This is that meeting, scored.",
        target: { kind: "board", id: "vendor-copilot-rollout" },
        minutes: 25,
      },
      {
        id: "eval-risk",
        title: "Learn to tier risk instead of treating everything the same",
        because:
          "The failure mode on both sides is uniform treatment — approving everything or blocking everything. Tiering is what lets you be fast on the low-risk cases and firm on the rest.",
        target: { kind: "lab", id: "qrm" },
        minutes: 30,
      },
    ],
  },
  {
    goal: "deploying",
    label: "Rolling a tool out to people",
    situation: "Licences are landing and the defaults are not your policy.",
    steps: [
      {
        id: "dep-identity",
        title: "Get identity right before anyone signs in",
        because:
          "Sign-in and account lifecycle are separate problems, and the second one is the one that leaves ex-employees with working access. It is far cheaper to fix now than after 2,000 people have accounts.",
        target: { kind: "lab", id: "iam" },
        minutes: 30,
      },
      {
        id: "dep-tenant",
        title: "Configure the tenant against the clock",
        because:
          "Four days before licences activate is the cheapest time you will ever have to tighten this. Afterwards you are taking things away from people who have built habits.",
        target: { kind: "simulator", id: "saas-tenant-onboarding" },
        minutes: 25,
      },
      {
        id: "dep-connectors",
        title: "Understand what a connector actually opens up",
        because:
          "Connectors are where a controlled rollout quietly becomes an uncontrolled one, because anyone can add one and each is a fresh path for data to leave.",
        target: { kind: "lab", id: "connector" },
        minutes: 30,
      },
      {
        id: "dep-governance",
        title: "Decide what may be indexed, and who says so",
        because:
          "The crawler will reach more than you intended. Establishing ownership per source before the first crawl is what prevents the board papers ending up searchable.",
        target: { kind: "lab", id: "data-governance" },
        minutes: 30,
      },
    ],
  },
  {
    goal: "securing",
    label: "Securing something already built",
    situation: "It works, it is popular, and now it has to be defensible.",
    steps: [
      {
        id: "sec-rag",
        title: "Understand how retrieval decides what someone can see",
        because:
          "You cannot secure the system without knowing where authorisation actually happens. In a retrieval system it is at search time, against the caller's identity, or it is nowhere.",
        target: { kind: "lab", id: "rag" },
        minutes: 25,
      },
      {
        id: "sec-zt",
        title: "Bring it under Zero Trust",
        because:
          "Identity, device, network and egress, in that order. This is the review you will be asked to pass, run as an exercise with the failures already injected.",
        target: { kind: "simulator", id: "zero-trust-access" },
        minutes: 25,
      },
      {
        id: "sec-agent",
        title: "Contain an agent that has been taken over",
        because:
          "Prompt injection is the attack that has no equivalent in traditional systems, and the damage is set by what the agent's identity is allowed to do.",
        target: { kind: "simulator", id: "agent-killswitch" },
        minutes: 25,
      },
      {
        id: "sec-scenario",
        title: "Run the full vertical slice end to end",
        because:
          "Individual controls are easy to agree with in isolation. This is sixteen stages where each decision constrains the next, which is how it actually feels.",
        target: { kind: "flagship" },
        minutes: 45,
      },
    ],
  },
  {
    goal: "governing",
    label: "Deciding what gets approved",
    situation: "People want answers today and the pack in front of you is incomplete.",
    steps: [
      {
        id: "gov-tier",
        title: "Tier by harm and autonomy, not by vendor",
        because:
          "Every bad governance decision starts with the wrong tiering basis. Autonomy is what turns a wrong output into a wrong outcome, and it is the axis most frameworks under-weight.",
        target: { kind: "simulator", id: "qrm-risk-acceptance" },
        minutes: 25,
      },
      {
        id: "gov-board-hard",
        title: "Take a case where the conditional approval is wrong",
        because:
          "Conditions are the reviewer's favourite instrument and they only work when you can verify them before the date. Knowing when they cannot is what separates a real no from an obstructive one.",
        target: { kind: "board", id: "public-support-chatbot" },
        minutes: 25,
      },
      {
        id: "gov-privacy",
        title: "Run a privacy assessment on something genuinely difficult",
        because:
          "The AI does not add new data, it adds a new copy, a new access path and a new inference capability. Assessing the delta rather than the system is the skill.",
        target: { kind: "simulator", id: "privacy-impact" },
        minutes: 30,
      },
      {
        id: "gov-exam",
        title: "Test yourself against the role",
        because:
          "Ten questions with written rationales. Getting one wrong and reading why is worth more than getting nine right.",
        target: { kind: "exam", id: "governance-operator" },
        minutes: 20,
      },
    ],
  },
  {
    goal: "building",
    label: "Building an AI system",
    situation: "You want it to survive both production and review.",
    steps: [
      {
        id: "build-rag",
        title: "Get the retrieval design right",
        because:
          "Most quality complaints about AI systems are retrieval failures wearing a model costume. Chunking, hybrid search and reranking move quality further than any model upgrade, and this is where the whole architecture starts.",
        target: { kind: "lab", id: "rag" },
        minutes: 25,
      },
      {
        id: "build-rag-sim",
        title: "Stand up a retrieval system over confidential documents",
        because:
          "Reading about permission trimming is not the same as deciding, under a rubric, whether to enforce it at ingest or at query time. This is the decision a reviewer will ask you about first.",
        target: { kind: "simulator", id: "rag-onboarding" },
        minutes: 25,
      },
      {
        id: "build-eval",
        title: "Build the evaluation before you tune anything",
        because:
          "Without a fixed set and a stored baseline, 'is this better?' is unanswerable and every release after this one is a guess. Nothing else on this list can be argued properly until this exists.",
        target: { kind: "simulator", id: "ai-engineering-eval" },
        minutes: 30,
      },
      {
        id: "build-eval-lab",
        title: "Go deeper on measurement",
        because:
          "The simulator makes you choose; the lab explains why those choices are the ones that matter, including how retrieval and generation get measured apart. Architects are expected to set this for other teams.",
        target: { kind: "lab", id: "ai-engineering" },
        minutes: 30,
      },
      {
        id: "build-agents",
        title: "Understand what changes when the system can act",
        because:
          "Agents turn a wrong answer into a wrong action, and the blast radius is set by the identity you gave it. Enterprise architecture reviews increasingly open with this question.",
        target: { kind: "lab", id: "agent" },
        minutes: 30,
      },
      {
        id: "build-inhouse",
        title: "Assemble the whole in-house design",
        because:
          "Six components, each a choice you now have to defend: the app, the orchestrator, identity, the model, retrieval, and the logs. This is the shape of the document you will be asked to produce.",
        target: { kind: "lab", id: "in-house-app" },
        minutes: 30,
      },
      {
        id: "build-arch",
        title: "Take your design through architecture review",
        because:
          "Two questions decide it: can this fail without taking the product down, and can you explain one decision six months later. Most first submissions answer neither.",
        target: { kind: "simulator", id: "in-house-architecture" },
        minutes: 30,
      },
      {
        id: "build-slice",
        title: "Run the full vertical slice end to end",
        because:
          "Individual controls are easy to agree with in isolation. Sixteen stages where each decision constrains the next is how architecture actually feels, and it is the closest thing here to a real engagement.",
        target: { kind: "flagship" },
        minutes: 45,
      },
      {
        id: "build-ship",
        title: "Put a gate on the release",
        because:
          "A prompt change with no code change is the release that skips review, and it is the one most likely to quietly break grounding. Owning the gate is part of owning the architecture.",
        target: { kind: "simulator", id: "devsecops-release-gate" },
        minutes: 25,
      },
      {
        id: "build-exam",
        title: "Test yourself against the role",
        because:
          "Ten questions with written rationales. Getting one wrong and reading why is worth more than getting nine right, and it tells you which of the above to revisit.",
        target: { kind: "exam", id: "solution-architect" },
        minutes: 20,
      },
      {
        id: "build-record",
        title: "Export what you have done",
        because:
          "You now have scored runs across retrieval, evaluation, architecture review and release. Turn it into the record you attach to an application — framed honestly as practice, which is what makes it credible.",
        target: { kind: "portfolio" },
        minutes: 10,
      },
    ],
  },
];

export const plansByGoal: Record<Goal, Plan> = Object.fromEntries(
  plans.map((p) => [p.goal, p]),
) as Record<Goal, Plan>;

/**
 * The plan for a learner, with orientation prepended when they told us they are
 * new. Everyone gets the same destination; beginners get the runway.
 */
export function planFor(goal: Goal, level: Level): PlanStep[] {
  const base = plansByGoal[goal].steps;
  if (level !== "new") return base;
  // The starting-out plan is already written for a newcomer and opens with the
  // same vocabulary and how-it-works steps, so prepending orientation showed
  // both of them twice.
  const seen = new Set(
    base.map((s) => ("id" in s.target ? `${s.target.kind}:${s.target.id}` : s.target.kind)),
  );
  const prefix = orientationSteps.filter(
    (s) => !seen.has("id" in s.target ? `${s.target.kind}:${s.target.id}` : s.target.kind),
  );
  return [...prefix, ...base];
}

export function stepHref(t: StepTarget): { to: string; params?: Record<string, string> } {
  switch (t.kind) {
    case "lab":
      return { to: "/app/labs/$labId", params: { labId: t.id } };
    case "simulator":
      return { to: "/app/lab-engine/$labId", params: { labId: t.id } };
    case "board":
      return { to: "/app/simulators/go-no-go/$caseId", params: { caseId: t.id } };
    case "scenario":
      return { to: "/app/scenarios/$scenarioId", params: { scenarioId: t.id } };
    case "flagship":
      return { to: "/app/scenarios/rag-ticket-agent" };
    case "platform":
      return { to: "/app/platforms/$platformId", params: { platformId: t.id } };
    case "exam":
      return { to: "/app/exams/$examId", params: { examId: t.id } };
    case "flashcards":
      return { to: "/app/flashcards" };
    case "careers":
      return { to: "/app/careers" };
    case "portfolio":
      return { to: "/app/portfolio" };
    case "glossary":
      return { to: "/app/glossary" };
  }
}

export const STEP_KIND_LABEL: Record<StepTarget["kind"], string> = {
  lab: "Read",
  simulator: "Run",
  board: "Decide",
  scenario: "Simulate",
  flagship: "Simulate",
  platform: "Read",
  exam: "Test",
  flashcards: "Recall",
  careers: "Read",
  portfolio: "Export",
  glossary: "Vocabulary",
};

/**
 * Whether a plan step has been done.
 *
 * Deliberately generous: a learner who read four of a lab's five modules and
 * moved on has not failed anything, and a "next step" that keeps re-offering
 * something they consider finished is worse than one that occasionally moves
 * on early. Progress here is a prompt, not a gate.
 */
export interface ProgressSignals {
  completedLessons: Record<string, number>;
  quizResults: Record<string, unknown>;
  scenarioAttempts: Record<string, unknown>;
  evidenceRefs: Set<string>;
}

export function isStepComplete(t: StepTarget, p: ProgressSignals): boolean {
  switch (t.kind) {
    case "lab":
      return Object.keys(p.completedLessons).some((k) => k.startsWith(`${t.id}:`));
    case "simulator":
      // A finished Lab Engine run writes competency evidence tagged with the
      // blueprint id; nothing else records under that ref.
      return p.evidenceRefs.has(`lab:${t.id}`);
    case "board":
      return `go-no-go:${t.id}` in p.quizResults;
    case "scenario":
      return t.id in p.scenarioAttempts;
    case "flagship":
      return "rag-ticket-agent" in p.scenarioAttempts;
    case "platform":
      return `platform:${t.id}:quiz` in p.quizResults;
    case "exam":
      return `exam:${t.id}` in p.quizResults;
    case "flashcards":
    case "careers":
    case "portfolio":
    case "glossary":
      // Reading is not measurable and pretending otherwise would put a false
      // tick next to it. Always offered, never marked done.
      return false;
  }
}

export function nextStep(goal: Goal, level: Level, p: ProgressSignals): PlanStep | undefined {
  return planFor(goal, level).find((s) => !isStepComplete(s.target, p));
}
