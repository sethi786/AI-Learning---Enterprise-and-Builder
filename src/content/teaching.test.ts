import { describe, expect, it } from "vitest";

import { glossary, glossaryLookup } from "./glossary";
import { labs } from "./labs";
import { GOALS, isStepComplete, planFor, plansByGoal, stepHref } from "./plans";
import { goNoGoCasesById } from "./goNoGo";
import { getLabBlueprint } from "./labEngine";
import { labsById } from "./labs";
import { platformsById } from "./platforms";
import { scenariosById } from "./scenarios";
import { exams } from "./exams";
import { LEVELS, openLayersFor } from "@/lib/prefs";

/**
 * Teaching integrity.
 *
 * The content tests check nothing a learner reads is filler; the simulator
 * tests check everything they are invited to do actually runs. These check the
 * part that decides whether a non-technical person can get started at all:
 * that the vocabulary is defined before it is used, that there is an ordered
 * path rather than a catalogue, and that every step in that path points
 * somewhere real.
 */

/** Terms that must never appear undefined in the beginner-facing layer. */
const HARD_JARGON =
  /\b(SCIM|RBAC|SIEM|RAG|LLM|OBO|ACLs?|OIDC|SAML|DLP|SBOM|SAST|SSDLC|PIA|DPIA|DPA|MFA|FIDO2|PIM|BM25)\b/;

describe("the beginner layer assumes nothing", () => {
  it("never uses an acronym it has not just defined", () => {
    // "…that is SSO" and "…is called RAG" are fine — the reader met the idea
    // first and the label second. A bare acronym in the plain-English layer is
    // not, because that layer is the one promise made to a newcomer.
    const bare = labs
      .flatMap((l) => l.modules.map((m) => ({ id: `${l.id}/${m.id}`, s: m.lesson.simple })))
      .filter(({ s }) => HARD_JARGON.test(s) && !/that is |is called |called /.test(s))
      .map(({ id }) => id);
    expect(bare).toEqual([]);
  });

  it("plain-English definitions do not lean on other jargon", () => {
    // A definition that needs a second lookup has not defined anything.
    const circular = glossary
      .filter((t) => HARD_JARGON.test(t.plain))
      .map((t) => `${t.id}: ${t.plain.slice(0, 60)}`);
    expect(circular).toEqual([]);
  });

  it("every term explains why it matters, not just what it is", () => {
    const thin = glossary.filter((t) => t.matters.trim().split(/\s+/).length < 15).map((t) => t.id);
    expect(thin).toEqual([]);
  });

  it("has no duplicate terms or aliases that would fight over the same word", () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const { needle, term } of glossaryLookup) {
      const key = needle.toLowerCase();
      const prev = seen.get(key);
      if (prev && prev !== term.id) clashes.push(`"${needle}" claimed by ${prev} and ${term.id}`);
      else seen.set(key, term.id);
    }
    expect(clashes).toEqual([]);
  });

  it("covers the acronyms the content actually uses", () => {
    // A glossary is only worth having if it contains the words that stopped
    // someone. These are drawn from the lesson text, not from a wish list.
    const known = new Set(
      glossary.flatMap((t) => [t.term, ...(t.aliases ?? [])].map((x) => x.toLowerCase())),
    );
    const used = new Set<string>();
    for (const l of labs) {
      for (const m of l.modules) {
        const text = [m.lesson.simple, m.lesson.enterprise, m.lesson.deepDive].join(" ");
        for (const hit of text.match(new RegExp(HARD_JARGON, "g")) ?? []) {
          used.add(hit.toLowerCase());
        }
      }
    }
    const missing = [...used].filter((u) => !known.has(u) && !known.has(u.replace(/s$/, "")));
    expect(missing).toEqual([]);
  });
});

describe("there is a path, not just a catalogue", () => {
  it("every goal has a plan", () => {
    for (const g of GOALS) expect(plansByGoal[g.id], g.id).toBeDefined();
  });

  it("every plan step points at something that exists", () => {
    const broken: string[] = [];
    for (const g of GOALS) {
      for (const level of LEVELS) {
        for (const s of planFor(g.id, level.id)) {
          const t = s.target;
          const exists =
            t.kind === "lab"
              ? !!labsById[t.id]
              : t.kind === "simulator"
                ? !!getLabBlueprint(t.id)
                : t.kind === "board"
                  ? !!goNoGoCasesById[t.id]
                  : t.kind === "scenario"
                    ? !!scenariosById[t.id]
                    : t.kind === "platform"
                      ? !!platformsById[t.id]
                      : t.kind === "exam"
                        ? exams.some((e) => e.id === t.id)
                        : true;
          if (!exists)
            broken.push(`${g.id}/${level.id}/${s.id} -> ${t.kind}:${"id" in t ? t.id : ""}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("every step explains why it comes where it does", () => {
    // "Do this next" is an instruction. "Do this next because…" is teaching,
    // and the reason is the only part a learner can disagree with usefully.
    const thin: string[] = [];
    for (const g of GOALS) {
      for (const s of plansByGoal[g.id].steps) {
        if (s.because.trim().split(/\s+/).length < 15) thin.push(`${g.id}/${s.id}`);
      }
    }
    expect(thin).toEqual([]);
  });

  it("beginners get orientation before the role-specific work", () => {
    for (const g of GOALS) {
      const newPlan = planFor(g.id, "new");
      const workingPlan = planFor(g.id, "working");
      expect(newPlan.length).toBeGreaterThan(workingPlan.length);
      // Vocabulary first, always.
      expect(newPlan[0].target.kind).toBe("glossary");
    }
  });

  it("every plan target resolves to a route shape the router can build", () => {
    for (const g of GOALS) {
      for (const s of planFor(g.id, "new")) {
        const href = stepHref(s.target);
        expect(href.to.startsWith("/app"), `${g.id}/${s.id}`).toBe(true);
        // Any $param in the path must be supplied.
        const params = href.to.match(/\$(\w+)/g) ?? [];
        for (const raw of params) {
          expect(href.params?.[raw.slice(1)], `${g.id}/${s.id} missing ${raw}`).toBeTruthy();
        }
      }
    }
  });

  it("unmeasurable steps are never marked complete", () => {
    // Reading a glossary leaves no trace. Ticking it anyway would put a false
    // completion in front of a learner who had not done it.
    const empty = {
      completedLessons: {},
      quizResults: {},
      scenarioAttempts: {},
      evidenceRefs: new Set<string>(),
    };
    expect(isStepComplete({ kind: "glossary" }, empty)).toBe(false);
    expect(isStepComplete({ kind: "flashcards" }, empty)).toBe(false);
  });

  it("a finished simulator run marks its step complete", () => {
    const signals = {
      completedLessons: {},
      quizResults: {},
      scenarioAttempts: {},
      evidenceRefs: new Set(["lab:zero-trust-access"]),
    };
    expect(isStepComplete({ kind: "simulator", id: "zero-trust-access" }, signals)).toBe(true);
    expect(isStepComplete({ kind: "simulator", id: "privacy-impact" }, signals)).toBe(false);
  });
});

describe("reading level changes what opens, never what exists", () => {
  it("each level opens a different set of layers", () => {
    const sets = LEVELS.map((l) => openLayersFor(l.id).join(","));
    expect(new Set(sets).size).toBe(LEVELS.length);
  });

  it("a newcomer opens on plain English and nothing heavier", () => {
    expect(openLayersFor("new")).toEqual(["simple"]);
  });

  it("no level hides a layer that has no other way in", () => {
    // Collapsed is fine; absent is not. Every layer must appear in at least one
    // level's open set so a learner can discover it exists.
    const union = new Set(LEVELS.flatMap((l) => openLayersFor(l.id)));
    for (const layer of ["simple", "enterprise", "deep"]) {
      expect(union.has(layer), layer).toBe(true);
    }
  });
});
