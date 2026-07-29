import { describe, expect, it } from "vitest";

import { allInterviewQuestions, careerByRole, careerProfiles } from "./careers";
import { roles } from "./roles";
import { buildPortfolio, portfolioMarkdown } from "@/lib/portfolio";
import type { ProgressState } from "@/lib/progress";

/**
 * Career and evidence integrity.
 *
 * Two failure modes are specific to this material and both actively harm a
 * learner rather than merely disappointing them:
 *
 *  - a confident salary figure that is wrong for their country sends them into
 *    a negotiation badly informed;
 *  - a practice record that reads like employment history collapses in the
 *    first interview and leaves them worse off than having nothing.
 *
 * These tests hold both lines mechanically, because both are the kind of thing
 * that creeps back in during a well-meaning content edit.
 */

const CURRENCY = /[£$€¥₹]\s?\d|(\d{2,3}[,.]?\d{3})\s*(per year|pa|p\.a\.|annually|salary)/i;
const OUTCOME_PROMISE =
  /\b(guarantee[ds]?|you will (get|land|earn)|certain to|assured of|promise[ds]? you)\b/i;

describe("career content does not mislead", () => {
  it("quotes no salary figures anywhere", () => {
    const hits: string[] = [];
    for (const c of careerProfiles) {
      const text = [
        c.whatTheJobIs,
        c.entryReality,
        ...c.typicalDay,
        ...c.firstNinetyDays,
        ...c.transfersFrom.map((t) => t.why),
        ...c.decodeTheAd.map((d) => d.means),
        ...c.seniority.map((s) => s.looksLike),
      ].join(" ");
      if (CURRENCY.test(text)) hits.push(c.roleId);
    }
    expect(hits).toEqual([]);
  });

  it("promises no outcomes", () => {
    const hits: string[] = [];
    for (const c of careerProfiles) {
      const text = [c.whatTheJobIs, c.entryReality, ...c.transfersFrom.map((t) => t.why)].join(" ");
      if (OUTCOME_PROMISE.test(text)) hits.push(c.roleId);
    }
    expect(hits).toEqual([]);
  });

  it("covers every role the platform teaches", () => {
    const missing = roles.filter((r) => !careerByRole[r.id]).map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it("gives every role real search terms, since the wrong words find nothing", () => {
    for (const c of careerProfiles) {
      expect(c.alsoAdvertisedAs.length, c.roleId).toBeGreaterThanOrEqual(3);
      // The platform's own role name is not necessarily what the market calls it,
      // so an entry that only repeats it is not useful.
      const distinct = new Set(c.alsoAdvertisedAs.map((t) => t.toLowerCase()));
      expect(distinct.size, c.roleId).toBe(c.alsoAdvertisedAs.length);
    }
  });

  it("names concrete backgrounds that transfer, with a reason each", () => {
    for (const c of careerProfiles) {
      expect(c.transfersFrom.length, c.roleId).toBeGreaterThanOrEqual(3);
      for (const t of c.transfersFrom) {
        expect(t.why.trim().split(/\s+/).length, `${c.roleId}/${t.from}`).toBeGreaterThan(12);
      }
    }
  });

  it("is honest about the bar rather than uniformly encouraging", () => {
    // If every role reads "anyone can do this", the page is marketing. At least
    // one has to say plainly that it is hard to enter cold.
    const honest = careerProfiles.filter((c) =>
      /harder|senior|requires programming|not.*enter|years in/i.test(c.entryReality),
    );
    expect(honest.length).toBeGreaterThan(0);
  });
});

describe("interview questions are practice, not trivia", () => {
  it("every question says what it is really testing", () => {
    for (const q of allInterviewQuestions) {
      expect(q.testing.trim().split(/\s+/).length, q.id).toBeGreaterThan(8);
    }
  });

  it("every question has a multi-point strong answer and a named weak one", () => {
    for (const q of allInterviewQuestions) {
      expect(q.strongAnswer.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.weakAnswer.trim().split(/\s+/).length, q.id).toBeGreaterThan(8);
    }
  });

  it("covers more than one difficulty per role", () => {
    for (const c of careerProfiles) {
      expect(c.interview.length, c.roleId).toBeGreaterThanOrEqual(3);
    }
  });

  it("has unique question ids", () => {
    const ids = allInterviewQuestions.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

// ── Portfolio ─────────────────────────────────────────────────────────────

const emptyProgress = (): ProgressState =>
  ({
    schemaVersion: 1,
    completedLessons: {},
    quizResults: {},
    scenarioAttempts: {},
    notes: [],
    artifacts: [],
    currentRole: "platform-admin",
    masteryPoints: {},
    lastVisited: [],
    competencies: {},
    incidentAttempts: {},
    capstoneAttempts: {},
  }) as unknown as ProgressState;

describe("the practice record never overclaims", () => {
  it("says it is simulation, in the export itself", () => {
    // The wording has to travel with the document. A caveat that only exists on
    // the page is not present when the Markdown is pasted into an application.
    const md = portfolioMarkdown(buildPortfolio(emptyProgress()));
    expect(md).toMatch(/record of practice, not of employment/i);
    expect(md).toMatch(/simulation/i);
    expect(md).toMatch(/none of it is real client work/i);
  });

  it("never describes practice as experience or employment", () => {
    const md = portfolioMarkdown(buildPortfolio(emptyProgress()), "Test Learner");
    expect(md).not.toMatch(/\byears of experience\b/i);
    expect(md).not.toMatch(/\bworked at\b/i);
    expect(md).not.toMatch(/\bcertified\b/i);
  });

  it("is empty when nothing has been done", () => {
    const d = buildPortfolio(emptyProgress());
    expect(d.evidence).toEqual([]);
    expect(d.counts.simulators).toBe(0);
    expect(d.counts.demonstrated).toBe(0);
  });

  it("records a completed simulator run with its score", () => {
    const p = emptyProgress();
    p.competencies = {
      "sec.zero_trust": {
        status: "demonstrated",
        evidence: [
          {
            kind: "lab_completed",
            ts: 1_700_000_000_000,
            ref: "lab:zero-trust-access",
            score: 0.85,
          },
        ],
        demonstrations: 2,
        demonstrationRefs: ["lab:zero-trust-access"],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const d = buildPortfolio(p);
    const run = d.evidence.find((e) => e.kind === "simulator");
    expect(run).toBeDefined();
    expect(run!.score).toBe(0.85);
    expect(run!.detail).toMatch(/scored controls/);
    expect(d.counts.demonstrated).toBe(1);
  });

  it("counts a competency as demonstrated only at the top of the evidence ladder", () => {
    const p = emptyProgress();

    p.competencies = {
      "sec.zero_trust": {
        status: "practiced",
        evidence: [],
        demonstrations: 1,
        demonstrationRefs: [],
      },
      "arch.rag": { status: "introduced", evidence: [], demonstrations: 0, demonstrationRefs: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const d = buildPortfolio(p);
    expect(d.counts.demonstrated).toBe(0);
    expect(d.counts.practised).toBe(1);
    // Introduced still appears — it is honest progress — but it is not counted
    // as something to claim.
    expect(d.competencies.map((c) => c.id).sort()).toEqual(["arch.rag", "sec.zero_trust"]);
  });

  it("exports Markdown so it survives outside this site", () => {
    const p = emptyProgress();
    p.quizResults = { "exam:platform-admin": { correct: 9, total: 10, ts: 1_700_000_000_000 } };
    const md = portfolioMarkdown(buildPortfolio(p), "Ada");
    expect(md.startsWith("# AI practice record — Ada")).toBe(true);
    expect(md).toMatch(/9 of 10 correct/);
    // Headings, not HTML — this gets pasted into places that do not render HTML.
    expect(md).not.toMatch(/<[a-z]+>/i);
  });
});

describe("the entry-level route is genuinely entry-level", () => {
  const entry = careerProfiles.filter((c) => c.entryLevel);

  it("exists, and leads the list", () => {
    expect(entry.length).toBeGreaterThanOrEqual(2);
    expect(careerProfiles[0].entryLevel).toBe(true);
  });

  it("names backgrounds outside technology that transfer in", () => {
    // The whole point is reaching people who assume this is closed to them. If
    // every transfer route is another IT job, the door has not been opened.
    const OUTSIDE_TECH =
      /customer service|contact centre|claims|teaching|tutor|marking|healthcare|legal|financial admin|editing|proofread|translat|retail|hospitality|research|librarian|linguist|publishing|assessment/i;
    for (const c of entry) {
      const outside = c.transfersFrom.filter((t) => OUTSIDE_TECH.test(t.from));
      expect(
        outside.length,
        `${c.roleId} has only technology transfer routes`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("says plainly that no technology background is required", () => {
    for (const c of entry) {
      expect(
        /no (prior )?(technology|technical|it) background|without a technology background|does not require programming/i.test(
          c.entryReality,
        ),
        c.roleId,
      ).toBe(true);
    }
  });

  it("is still honest about what each role demands", () => {
    // Accessible must not mean oversold. Each entry profile has to name
    // something the role genuinely asks of you.
    for (const c of entry) {
      expect(
        /harder|requires|demand|discipline|asks more|is not|hard to fill|rarer/i.test(
          c.entryReality,
        ),
        `${c.roleId} reads as pure encouragement`,
      ).toBe(true);
    }
  });

  it("points at a lab that teaches the work", () => {
    for (const c of entry) expect(c.labId, c.roleId).toBeTruthy();
  });
});
