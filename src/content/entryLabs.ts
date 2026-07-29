import type { LabDef } from "./types";

/**
 * Entry-level labs.
 *
 * The rest of the catalogue assumes an existing technology career — it teaches
 * a security architect to secure AI, and an M365 administrator to administer
 * it. That excludes almost everyone. These two labs teach roles that are real,
 * advertised, growing, and reachable with no prior IT background at all:
 *
 *   ai-operations — the person who reviews what the AI produced before it has
 *                   effect, handles the escalations, and spots the pattern in
 *                   the failures. Transfers from customer service, healthcare
 *                   admin, teaching, claims handling, retail management.
 *
 *   ai-evaluation — the person who builds the question set that says whether
 *                   the system is any good, labels the data behind it, and
 *                   measures quality honestly. Transfers from research,
 *                   editing, translation, librarianship, QA testing.
 *
 * They are written to the same depth as everything else. An "entry level" lab
 * that teaches less is how you produce candidates who interview badly.
 */

const aiOperations: LabDef = {
  id: "ai-operations",
  name: "AI Operations Lab",
  tagline: "You are the human in the loop. Learn to be a good one.",
  mission:
    "An insurer runs an AI assistant that drafts customer responses and flags claims for review. You sit on the review queue. By the end of this lab you can tell a wrong answer from an unlucky one, escalate the right things, and turn a pile of individual mistakes into a pattern someone can fix.",
  domain: "ops",
  modules: [
    {
      id: "ops-reviewing",
      title: "Reviewing AI output without rubber-stamping it",
      lesson: {
        objective:
          "Judge an AI-drafted response for correctness rather than for tone, and know which of the four failure types you are looking at.",
        simple:
          "When a person checks what an AI wrote before it goes to a customer, that check is the last thing standing between a mistake and a real consequence. The difficulty is that AI output is fluent — it reads well whether or not it is true — so the natural reaction is to skim it, see nothing obviously wrong, and approve. That reaction is what the whole role exists to resist.",
        enterprise:
          "Organisations put a human in the loop because a regulator, a contract or a nasty incident required one. The value of that control depends entirely on whether the human is genuinely checking or has become a click. Review queues degrade predictably: volume rises, time per item falls, approval rates climb toward 100%, and nobody notices until an audit samples the decisions. A review function that approves 99% of what it sees is not evidence of a good model — it is usually evidence that the review has stopped happening.",
        deepDive:
          "Separate four failure types, because they need different responses. A factual error is a claim contradicted by the source. An unsupported claim is one the source simply does not address — the most common and the hardest to spot, because nothing looks wrong. A tone or policy failure is correct content delivered in a way the organisation would not stand behind. A scope failure is the system answering something it should have refused. Check the last one first: if the request was out of scope, the quality of the answer is irrelevant. Then read the cited source before the answer, not after, so you are testing the answer against the source rather than searching the source for confirmation of an answer you have already accepted.",
        mistakes: [
          "Reading the AI's answer first and the source second, which turns review into confirmation",
          "Approving anything that reads well, because fluency is the one thing the model is guaranteed to get right",
          "Treating a high approval rate as a quality signal rather than as a warning about the review",
          "Fixing the individual response and never reporting the pattern",
        ],
        risks: [
          "Unsupported claims reaching customers with an organisation's name on them",
          "The human-in-the-loop control existing on paper while approving everything in practice",
          "Reviewer fatigue concentrating errors at the end of shifts and at volume peaks",
        ],
        fixes: [
          "Read the cited source before the drafted answer",
          "Check scope first: was this something the system should have answered at all",
          "Track your own approval rate and treat a rising one as a question about yourself",
          "Log the failure type, not just the correction, so patterns become visible",
        ],
        evidence: [
          "Review log with failure type recorded per item",
          "Approval rate over time, by reviewer and by hour",
          "Sample re-review of approved items by a second reviewer",
        ],
        guidedExercise:
          "Take ten drafted responses. For each, note the failure type before deciding whether to approve. Count how many were unsupported rather than wrong — in most real queues it is the largest category and the one reviewers report least.",
        reflection:
          "If your approval rate is above 95%, is the system that good, or has your reading changed?",
        competencyIds: ["plr.hitl", "eng.groundedness", "sec.monitoring"],
      },
      quiz: [
        {
          id: "q-ops-review-1",
          type: "mc",
          prompt:
            "An AI-drafted reply to a customer is well written, on-brand, and states a policy detail that does not appear in any of the cited documents. What is it?",
          options: [
            { id: "a", label: "A factual error", correct: false },
            { id: "b", label: "An unsupported claim", correct: true },
            { id: "c", label: "A tone failure", correct: false },
            { id: "d", label: "Acceptable — it reads correctly", correct: false },
          ],
          explanation:
            "Nothing contradicts it, which is exactly what makes it hard: the source is silent. Unsupported claims are the most common failure in review queues and the least reported, because there is nothing that looks wrong to catch your eye.",
          competencyIds: ["eng.groundedness", "plr.hitl"],
        },
        {
          id: "q-ops-review-2",
          type: "mc",
          prompt:
            "Your team's approval rate has risen from 82% to 98% over three months while volume doubled. What is the most likely explanation?",
          options: [
            { id: "a", label: "The model improved substantially", correct: false },
            { id: "b", label: "The review has degraded under volume", correct: true },
            { id: "c", label: "Customers are asking easier questions", correct: false },
            { id: "d", label: "Nothing — 98% is a healthy target", correct: false },
          ],
          explanation:
            "Model quality rarely moves 16 points without a release. Rising approval alongside rising volume is the standard signature of review turning into clicking, and it is why approval rate is monitored as a control-health metric rather than as a quality metric.",
          competencyIds: ["plr.hitl", "sec.monitoring"],
        },
      ],
    },
    {
      id: "ops-escalation",
      title: "Escalating well: what to raise, to whom, and how",
      lesson: {
        objective:
          "Decide what deserves escalation, route it to the function that can act, and write it so it can be acted on without a follow-up conversation.",
        simple:
          "Most things you find, you fix and move on. Some things you must hand to someone else — because they will keep happening, because they affect more people than the one in front of you, or because they are somebody else's decision to make. Knowing which is which is most of the value of an experienced reviewer, and it is learnable quickly.",
        enterprise:
          "Escalation fails in two directions and both are costly. Under-escalation means a systemic fault is absorbed silently by reviewers who are quietly correcting the same thing forty times a week, so it never reaches anyone who could fix it. Over-escalation means the queue becomes noise and real issues wait behind trivia. The distinction is not severity — it is whether the fix is inside your control. A wrong answer you can correct is work. A wrong answer you will correct again tomorrow, for the same reason, is a report.",
        deepDive:
          "Route by what has to change. If the model produced a bad answer from good source material, that is a quality issue for whoever owns the prompts and evaluation. If the source material itself was wrong or out of date, that is a content owner problem and the fix is upstream of the AI entirely. If the system answered someone who should not have been able to ask, that is a security or access issue and it goes immediately, not at the end of your shift. If the output was correct but the organisation would not stand behind it, that is policy. Write the report as: what was asked, what came back, what should have come back, how many times you have seen it, and what you think has to change. That last part is what turns a complaint into something actionable, and it is the thing reviewers most often leave out because they assume it is not their place to say.",
        mistakes: [
          "Correcting the same category of error repeatedly without ever reporting it",
          "Escalating individual incidents rather than the pattern they belong to",
          "Sending everything to one channel, so access issues queue behind wording complaints",
          "Reporting what went wrong without saying what should have happened instead",
        ],
        risks: [
          "Systemic faults absorbed invisibly by reviewers and never fixed",
          "An access or disclosure problem sitting in a quality queue for days",
          "Escalation channels becoming noise, so real issues are missed",
        ],
        fixes: [
          "Count occurrences before escalating: frequency is what makes it systemic",
          "Route by what has to change — prompt, source content, access, or policy",
          "Send anything involving someone seeing data they should not immediately",
          "Include the expected output, not only the actual one",
        ],
        evidence: [
          "Escalation log with category, frequency and routing",
          "Time from first observation to escalation",
          "Closure record showing what changed as a result",
        ],
        guidedExercise:
          "Take a week of your own corrections. Group them by cause rather than by customer. Anything appearing three or more times is a report, not a correction.",
        reflection:
          "Which correction have you made most often this month, and who has never heard about it?",
        competencyIds: ["sec.ir", "gov.evidence_management", "sec.monitoring"],
      },
      quiz: [
        {
          id: "q-ops-esc-1",
          type: "mc",
          prompt:
            "A reviewer notices the assistant quoting a discount policy that was withdrawn last quarter. They correct the response. What should happen next?",
          options: [
            {
              id: "a",
              label: "Nothing — the response was corrected before it went out",
              correct: false,
            },
            {
              id: "b",
              label:
                "Report it to whoever owns the source content, because the withdrawn policy is still in the material the system reads",
              correct: true,
            },
            { id: "c", label: "Escalate to security as a data issue", correct: false },
            { id: "d", label: "Raise a bug against the model", correct: false },
          ],
          explanation:
            "The model faithfully reported what its source said. The fault is upstream in the content, so correcting the output fixes one customer and leaves the cause in place for everyone else.",
          competencyIds: ["gov.evidence_management"],
        },
        {
          id: "q-ops-esc-2",
          type: "mc",
          prompt:
            "Mid-shift, a reviewer sees a drafted reply containing another customer's claim reference and partial address. What is the correct action?",
          options: [
            {
              id: "a",
              label: "Remove the detail, approve the corrected reply, note it in the daily summary",
              correct: false,
            },
            {
              id: "b",
              label: "Stop, do not approve, and escalate immediately as a possible data disclosure",
              correct: true,
            },
            {
              id: "c",
              label: "Log it as a quality issue for the weekly pattern review",
              correct: false,
            },
            {
              id: "d",
              label: "Ask a colleague whether they have seen the same thing",
              correct: false,
            },
          ],
          explanation:
            "One customer's data appearing in another's response is a disclosure question, not a quality one, and the important issue is whether it has already happened elsewhere. That determination is time-sensitive and is not yours to make alone.",
          competencyIds: ["sec.ir", "plr.pii"],
        },
      ],
    },
    {
      id: "ops-patterns",
      title: "Turning a queue into a signal",
      lesson: {
        objective:
          "Convert individual review decisions into evidence that changes the system, and present it to people who did not sit in the queue.",
        simple:
          "The most valuable thing a reviewer produces is not corrected answers. It is the sentence that says: this specific thing goes wrong this often, for this reason, and here is what would fix it. Nobody else in the organisation can produce that sentence, because nobody else has read a thousand outputs.",
        enterprise:
          "Reviewers are the only people with direct visibility of how a live AI system behaves against real inputs, and that visibility is routinely wasted because nothing collects it. The engineering team measures the system against a test set that reviewers never see, and reviewers see failures the test set does not contain. Closing that gap is the highest-leverage contribution the role makes, and the people who do it are the ones who get promoted out of the queue — into evaluation, into governance, into product.",
        deepDive:
          "Categorise every correction with a short, fixed set of causes. Fixed matters more than perfect: five stable categories used consistently beat twenty precise ones used differently by each reviewer. Count by cause, not by volume, and always express it as a rate rather than a total, because a rise from 40 to 60 errors means nothing if traffic doubled. Then bring the examples. A rate persuades an analyst; a real transcript persuades a room, and the strongest report has both — the rate that shows it matters, and the two examples that show what it looks like. Where you can, hand the examples over as test cases: a failure with a known correct answer is exactly what an evaluation set is made of, and it is the fastest route from your queue into how the system is measured.",
        mistakes: [
          "Free-text categories that no two reviewers use the same way",
          "Reporting totals when traffic is changing, which hides and invents trends alike",
          "Bringing only anecdotes, so it reads as complaint rather than measurement",
          "Bringing only numbers, so nobody in the room can picture the failure",
        ],
        risks: [
          "The organisation improving what it can measure while the real failures stay invisible",
          "Reviewer knowledge leaving when the reviewer does",
          "Decisions about the system made entirely from data that excludes live behaviour",
        ],
        fixes: [
          "Agree a fixed, small set of failure categories and hold to it",
          "Report rates per thousand responses, not raw counts",
          "Pair every rate with two real examples",
          "Convert recurring failures into test cases with known correct answers",
        ],
        evidence: [
          "Weekly failure-rate report by category",
          "Test cases contributed to the evaluation set, with source review items",
          "Record of changes made in response",
        ],
        guidedExercise:
          "Write one paragraph a product manager could act on: the category, the rate, two examples, and what you think should change. Under 150 words.",
        independentChallenge:
          "Take your three most frequent failures and write them as evaluation items — question, correct answer, and why it is correct. That artifact is the bridge from this role into the evaluation role.",
        reflection:
          "If you left tomorrow, what would the organisation stop knowing about its own system?",
        competencyIds: ["eng.eval_datasets", "sec.monitoring", "eng.observability"],
      },
      quiz: [
        {
          id: "q-ops-pat-1",
          type: "mc",
          prompt:
            "Corrections rose from 40 to 62 a week. Traffic rose from 4,000 to 7,000 responses. What do you report?",
          options: [
            { id: "a", label: "Errors are up 55% and rising", correct: false },
            {
              id: "b",
              label: "The error rate fell from 10 to 8.9 per thousand — quality improved slightly",
              correct: true,
            },
            { id: "c", label: "No change worth reporting", correct: false },
            { id: "d", label: "Quality is degrading under load", correct: false },
          ],
          explanation:
            "Raw counts track traffic. Reporting the 55% rise would have sent a team to investigate a regression that did not happen, which is how a review function loses credibility.",
          competencyIds: ["sec.monitoring", "eng.observability"],
        },
        {
          id: "q-ops-pat-2",
          type: "mc",
          prompt:
            "Which contribution from a review queue is most useful to the team improving the system?",
          options: [
            { id: "a", label: "A count of corrections made", correct: false },
            { id: "b", label: "A list of the customers affected", correct: false },
            {
              id: "c",
              label: "Recurring failures written up as test cases with the correct answer stated",
              correct: true,
            },
            { id: "d", label: "A satisfaction score for the drafted responses", correct: false },
          ],
          explanation:
            "A test case with a known correct answer can be run automatically on every future release. It converts one reviewer's observation into a permanent regression check — the only contribution here that keeps working after you stop making it.",
          competencyIds: ["eng.eval_datasets"],
        },
      ],
    },
  ],
};

const aiEvaluation: LabDef = {
  id: "ai-evaluation",
  name: "AI Evaluation & Data Lab",
  tagline: "Decide what 'good' means, then prove whether it is.",
  mission:
    "A support assistant is about to ship and nobody can say whether it works. You build the evaluation: a question set drawn from real traffic, answers labelled by people who agree with each other, and a measurement that separates a retrieval problem from a writing problem. By the end you can tell a team whether their change made things better.",
  domain: "architecture",
  modules: [
    {
      id: "eval-what-good-means",
      title: "Defining 'good' before measuring it",
      lesson: {
        objective:
          "Turn a vague quality goal into criteria two different people would score the same way.",
        simple:
          "Everyone agrees the AI should give good answers. Almost nobody agrees on what that means, and until they do, no measurement is possible. Does a good answer have to be short? Does it have to say where the information came from? Is refusing to answer a failure, or is it sometimes the best possible response? Getting those written down is the whole first job, and it is more argument than arithmetic.",
        enterprise:
          "This is where evaluation projects fail, and the failure is social rather than technical. Support wants deflection, legal wants caution, product wants speed, and the model cannot maximise all three. If nobody forces the trade-off into the open, each group scores the same output differently, agreement is low, and the measurement is quietly worthless. The person who runs a good evaluation is the person who got four teams to sign one page describing what a good answer looks like — that page is worth more than any dashboard built on top of it.",
        deepDive:
          "Write criteria as observable properties rather than as adjectives. 'Helpful' cannot be scored consistently; 'answers the question asked, using only the supplied documents, and states when it cannot' can. Separate the dimensions that move independently: correctness, groundedness, completeness, tone, and appropriate refusal are five different questions and collapsing them into one score destroys the information you needed. Decide explicitly how refusal is treated — a system that refuses everything is safe and useless, so refusal must be right or wrong depending on whether the answer was available. Then test the criteria before trusting them: give the same twenty items to two people and measure how often they agree. Below roughly 70% agreement the criteria are ambiguous, and no amount of data collected under them will be reliable.",
        mistakes: [
          "Adjectives as criteria — 'helpful', 'clear', 'professional' — which two people score differently",
          "One overall score, which hides whether the problem is accuracy or writing",
          "Leaving refusal undefined, so a cautious system scores as a good one",
          "Trusting criteria that were never tested for agreement between labellers",
        ],
        risks: [
          "A measurement everyone quotes and nobody can reproduce",
          "Optimising toward whatever the criteria accidentally rewarded, usually length and confidence",
          "Teams disputing the evaluation instead of acting on it",
        ],
        fixes: [
          "State criteria as observable properties, testable against the output",
          "Score dimensions separately and report them separately",
          "Define when refusal is correct and when it is a failure",
          "Run a two-person agreement check before collecting at scale",
        ],
        evidence: [
          "Signed one-page definition of a good answer",
          "Inter-rater agreement measured on a sample",
          "Scoring guide with worked examples at each level",
        ],
        guidedExercise:
          "Take five real answers and score them against your criteria. Then hand the same five to someone else. Every disagreement points at an ambiguous criterion, not at a careless colleague.",
        reflection:
          "If two people on your team scored the same answer differently, which word in your criteria caused it?",
        competencyIds: ["eng.eval_datasets", "eng.groundedness", "plr.responsible_ai"],
      },
      quiz: [
        {
          id: "q-eval-good-1",
          type: "mc",
          prompt: "Which of these is usable as a scoring criterion?",
          options: [
            { id: "a", label: "The answer is helpful and professional", correct: false },
            {
              id: "b",
              label: "Every factual claim in the answer appears in one of the supplied documents",
              correct: true,
            },
            { id: "c", label: "The answer feels trustworthy", correct: false },
            { id: "d", label: "The customer would be satisfied", correct: false },
          ],
          explanation:
            "It is checkable by looking at the answer and the documents, and two people applying it will usually reach the same verdict. The others require a judgement about someone's inner state.",
          competencyIds: ["eng.eval_datasets", "eng.groundedness"],
        },
        {
          id: "q-eval-good-2",
          type: "mc",
          prompt: "Two labellers agree on only 55% of a 40-item sample. What does that mean?",
          options: [
            { id: "a", label: "One labeller needs retraining", correct: false },
            { id: "b", label: "The criteria are ambiguous and must be rewritten", correct: true },
            { id: "c", label: "The sample is too small to interpret", correct: false },
            { id: "d", label: "The model output is inconsistent", correct: false },
          ],
          explanation:
            "Low agreement is a property of the instrument, not of the people. Collecting more data under ambiguous criteria produces more unreliable data, so the criteria get fixed before anything is scaled.",
          competencyIds: ["eng.eval_datasets"],
        },
      ],
    },
    {
      id: "eval-building-the-set",
      title: "Building a question set that reflects reality",
      lesson: {
        objective:
          "Assemble an evaluation set that surfaces the failures a team has not already thought of.",
        simple:
          "To find out whether a system works you need a fixed list of questions with known good answers, run every time something changes. The temptation is to write those questions yourself. The problem is that you will write the questions you expect, and the system already handles those — the questions that break it are the ones a real person asked at 4pm on a Friday in words nobody on the team would use.",
        enterprise:
          "Team-written sets systematically over-represent the happy path, so quality looks high right up until launch. A set drawn from real traffic contains the actual distribution: the ambiguity, the local phrasing, the follow-up questions that depend on a previous turn, the requests that should be refused. It also contains the boring middle, which matters more than it sounds — an evaluation made only of hard cases tells you nothing about the ordinary volume where most of the value and most of the damage lives.",
        deepDive:
          "Sample in strata rather than at random. Group real queries by intent, then sample within each group so a rare but important intent is not lost to a common one. Deliberately include: multi-turn follow-ups, which break systems that treat each question independently; queries that should be refused, so refusal is measurable; near-duplicates that differ in one significant word, which catch systems matching on surface similarity; and questions whose answer changed recently, which catch stale indexes. Size is usually over-thought — a carefully stratified 200 beats a careless 2,000, because every item has to be labelled and a set nobody can afford to re-label is a set that rots. Freeze it, version it, and keep a held-out portion that is never used for tuning, or you will eventually be measuring how well the system was fitted to your test.",
        mistakes: [
          "Writing the questions from the team's own imagination",
          "Random sampling, which buries rare and important intents",
          "Omitting queries that should be refused, making over-caution invisible",
          "Letting the set be used for tuning until it measures nothing but itself",
        ],
        risks: [
          "Quality looking strong on the set and poor in production",
          "Regressions in rare intents passing unnoticed",
          "A set so large it is never re-labelled and slowly stops matching the product",
        ],
        fixes: [
          "Stratify by intent, difficulty and expected outcome",
          "Include multi-turn, refusal-worthy and near-duplicate items deliberately",
          "Prefer a smaller set that is genuinely maintained",
          "Version it and hold out a portion that never informs tuning",
        ],
        evidence: [
          "Sampling method documented, with intent distribution",
          "Versioned evaluation set with a changelog",
          "Held-out split recorded and access-controlled",
        ],
        guidedExercise:
          "Take 50 real queries. Group them into intents. Note which intents your set would have missed if you had sampled 20 at random — that gap is the argument for stratification.",
        independentChallenge:
          "Build a 30-item set for a domain you know well, including at least three items that should be refused and three multi-turn follow-ups.",
        reflection:
          "Which question would a real user ask that nobody on the build team would ever phrase that way?",
        competencyIds: ["eng.eval_datasets", "eng.retrieval_eval", "eng.testing"],
      },
      quiz: [
        {
          id: "q-eval-set-1",
          type: "mc",
          prompt: "Why include queries the system is supposed to refuse in an evaluation set?",
          options: [
            { id: "a", label: "To increase the size of the set", correct: false },
            {
              id: "b",
              label:
                "Because without them, a system that refuses too much scores as a safe, good system",
              correct: true,
            },
            { id: "c", label: "To test the error handling", correct: false },
            { id: "d", label: "Regulators require it", correct: false },
          ],
          explanation:
            "Refusal has to be right or wrong depending on whether an answer was available. With only answerable questions in the set, over-caution is invisible — and over-caution is the most common way a safety change quietly destroys a product's usefulness.",
          competencyIds: ["eng.eval_datasets"],
        },
        {
          id: "q-eval-set-2",
          type: "mc",
          prompt:
            "A team proposes a 5,000-item evaluation set assembled by scraping every query from last month. What is the strongest objection?",
          options: [
            { id: "a", label: "It is too expensive to run", correct: false },
            {
              id: "b",
              label:
                "Nobody will label or maintain 5,000 items, so it will drift out of date and stop reflecting the product",
              correct: true,
            },
            { id: "c", label: "It will contain personal data", correct: false },
            { id: "d", label: "The model will memorise it", correct: false },
          ],
          explanation:
            "Running it is cheap; labelling and maintaining it is not. An unmaintained set is worse than a small one, because people keep quoting its numbers after it has stopped describing the system. Personal data is a real and separate concern that also has to be handled.",
          competencyIds: ["eng.eval_datasets", "eng.testing"],
        },
      ],
    },
    {
      id: "eval-reading-results",
      title: "Reading the result and saying what it means",
      lesson: {
        objective:
          "Interpret an evaluation run well enough to tell a team what to fix, and to resist a conclusion the numbers do not support.",
        simple:
          "A number on its own does not tell anyone what to do. Going from 72% to 74% might be a real improvement, or it might be noise. Knowing which — and being willing to say 'this change did nothing' when that is the honest answer — is what makes the measurement worth having.",
        enterprise:
          "Evaluation exists to settle arguments. It only does that if the person presenting it is trusted to report a null result as readily as a win, and that trust is built by doing it once when it was inconvenient. The most valuable finding is usually not the headline score but the decomposition: whether the system failed because it could not find the right document, or because it wrote badly given the right one. Those two failures are fixed by different teams, and a single score cannot distinguish them, which is why organisations that measure only end-to-end quality tend to keep buying larger models to fix retrieval problems.",
        deepDive:
          "Report retrieval and generation separately. Retrieval asks whether the correct document appeared at all — if it did not, the model was never given a chance and no prompt change will help. Generation asks how good the answer was given the correct document. When most failures have no correct document in the retrieved set, the work is in search, chunking and reranking, and that fix is usually cheaper and larger than any model upgrade. Treat small movements with suspicion: a two-point change on 200 items is a handful of decisions and may be within labelling noise, so re-label a sample or run the comparison twice before calling it. Always compare against a stored baseline from the same set and the same criteria — 'better than last month' is meaningless if the set changed. And say plainly what you cannot conclude; an evaluation that only ever produces good news gets ignored the first time it matters.",
        mistakes: [
          "Reporting one number and letting the room infer a cause",
          "Treating a small movement as a result without checking it against noise",
          "Comparing runs across different sets or different criteria",
          "Softening a null result because a team hoped for a win",
        ],
        risks: [
          "Expensive model upgrades bought to fix retrieval problems",
          "Regressions shipped because the movement looked small",
          "The evaluation losing authority by never disagreeing with anyone",
        ],
        fixes: [
          "Always decompose retrieval from generation before diagnosing",
          "Establish the noise floor before interpreting small changes",
          "Compare only against a stored baseline on the same versioned set",
          "State the conclusion the data does not support, alongside the one it does",
        ],
        evidence: [
          "Run record: set version, criteria version, baseline compared against",
          "Retrieval and generation scores reported separately",
          "Written interpretation including what could not be concluded",
        ],
        guidedExercise:
          "Given retrieval recall of 61% and generation quality of 94% given correct context, write the two-sentence recommendation. Name the team that should act.",
        independentChallenge:
          "Write the paragraph you would send when a change you expected to help produced no measurable difference.",
        reflection:
          "What would you need to see before you would tell a team their change made things worse?",
        competencyIds: ["eng.retrieval_eval", "eng.groundedness", "eng.observability"],
      },
      quiz: [
        {
          id: "q-eval-read-1",
          type: "mc",
          prompt:
            "Retrieval recall@5 is 61%. Generation quality given the correct document is 94%. Where does the work go?",
          options: [
            { id: "a", label: "Upgrade to a stronger model", correct: false },
            {
              id: "b",
              label: "Retrieval — hybrid search, reranking and chunking",
              correct: true,
            },
            { id: "c", label: "Rewrite the prompt for clarity", correct: false },
            { id: "d", label: "Increase the response length limit", correct: false },
          ],
          explanation:
            "The model writes well when it is given the right document. Most failures are cases where it never received one, so a stronger model raises cost on every request without touching the cause.",
          competencyIds: ["eng.retrieval_eval"],
        },
        {
          id: "q-eval-read-2",
          type: "mc",
          prompt:
            "A change moves the score from 72% to 74% on a 200-item set. What is the responsible report?",
          options: [
            { id: "a", label: "A 2-point improvement — ship it", correct: false },
            {
              id: "b",
              label:
                "Four items changed verdict, which is within labelling noise; re-run or re-label before concluding",
              correct: true,
            },
            { id: "c", label: "No change — reject it", correct: false },
            { id: "d", label: "Extend the set to 2,000 items and re-run", correct: false },
          ],
          explanation:
            "Two points of 200 is four decisions. That is comfortably inside the disagreement rate of most labelling, so the honest report says the result is not distinguishable from noise yet, and says what would settle it.",
          competencyIds: ["eng.eval_datasets", "eng.testing"],
        },
      ],
    },
  ],
};

export const entryLabs: LabDef[] = [aiOperations, aiEvaluation];
