import { describe, expect, it } from "vitest";

import { artifactTemplates } from "./artifacts";
import { competencies } from "./competencies";
import { exams } from "./exams";
import { labs } from "./labs";
import { paths } from "./paths";
import { platforms, platformsById } from "./platforms";
import { roles, rolesById } from "./roles";
import { scenarios, scenariosById } from "./scenarios";
import { labsById } from "./labs";

/**
 * Content integrity.
 *
 * The product previously shipped generated filler that a learner read verbatim —
 * placeholder architecture text repeated across 13 platforms, authoring
 * instructions rendered under "Technical deep dive", one-question exams labelled
 * "(Sample)". These tests make "nothing says coming soon" something the build
 * enforces rather than something anyone has to remember.
 */

const known = new Set(competencies.map((c) => c.id));

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Strings that only ever appeared in generated placeholder content. */
const FILLER = [
  "Fill in identity",
  "Deep dive: expand this module",
  "add real cases as you learn",
  "Sample exam",
  "No modules seeded yet",
  "Enterprise use cases for",
];

describe("no placeholder content reaches a learner", () => {
  const surfaces: { where: string; text: string }[] = [
    ...platforms.flatMap((p) => [
      { where: `platform:${p.id}/what`, text: p.what },
      { where: `platform:${p.id}/architecture`, text: p.architecture },
      { where: `platform:${p.id}/useCases`, text: p.useCases.join(" ") },
    ]),
    ...labs.flatMap((lab) =>
      lab.modules.map((m) => ({
        where: `lab:${lab.id}/${m.id}`,
        text: [m.lesson.simple, m.lesson.enterprise, m.lesson.deepDive].join(" "),
      })),
    ),
    ...exams.map((e) => ({ where: `exam:${e.id}`, text: `${e.name} ${e.description}` })),
  ];

  it.each(FILLER)("no surface contains %j", (marker) => {
    const hits = surfaces.filter((s) => s.text.includes(marker)).map((s) => s.where);
    expect(hits).toEqual([]);
  });

  it("no lesson uses the acronym-lowercasing template", () => {
    // `In an enterprise, ${body.toLowerCase()}` produced text like
    // "map every pii field" and "golden q&a".
    const bad = labs
      .flatMap((lab) => lab.modules.map((m) => ({ id: `${lab.id}/${m.id}`, m })))
      .filter(({ m }) => /In an enterprise, [a-z]/.test(m.lesson.enterprise))
      .map(({ id }) => id);
    expect(bad).toEqual([]);
  });
});

describe("every surface meets the depth bar", () => {
  // There used to be a `depth: "deep" | "scaffold"` flag that content declared
  // about itself, which is worth nothing — filler can call itself deep. These
  // measure the content instead.
  it("every lab teaches more than a single module", () => {
    expect(
      labs.filter((l) => l.modules.length < 2).map((l) => `${l.id}:${l.modules.length}`),
    ).toEqual([]);
  });

  it("every lab module teaches at all three layers, and teaches something", () => {
    // Per-layer floor catches an empty or one-clause layer; the whole-lesson
    // floor catches a module that is three thin lines with nothing behind it.
    // The bar is deliberately on the lesson as a whole, because the dense
    // modules carry a lot of their substance in mistakes/risks/fixes.
    const thin = labs
      .flatMap((lab) => lab.modules.map((m) => ({ id: `${lab.id}/${m.id}`, m })))
      .filter(({ m }) => {
        const { simple, enterprise, deepDive, mistakes, risks, fixes } = m.lesson;
        const perLayer = [simple, enterprise, deepDive].some((l) => words(l) < 8);
        const whole = words(
          [simple, enterprise, deepDive, ...mistakes, ...risks, ...fixes].join(" "),
        );
        return perLayer || whole < 80;
      })
      .map(({ id }) => id);
    expect(thin).toEqual([]);
  });

  it("every role explains itself in more than a tagline", () => {
    const thin = roles
      .filter(
        (r) =>
          words(
            [
              r.short,
              r.mission,
              ...r.owns,
              ...r.daily,
              ...r.meetings,
              ...r.documents,
              ...r.questions,
              ...r.risks,
              ...r.technicalSkills,
              ...r.governanceSkills,
              ...r.securitySkills,
              ...r.artifacts,
              ...r.coach,
            ].join(" "),
          ) < 200,
      )
      .map((r) => r.id);
    expect(thin).toEqual([]);
  });

  it("every platform carries at least one quiz question", () => {
    expect(platforms.filter((p) => p.quiz.length === 0).map((p) => p.id)).toEqual([]);
  });

  it("every lab module carries at least one quiz question", () => {
    const empty = labs
      .flatMap((lab) => lab.modules.map((m) => ({ id: `${lab.id}/${m.id}`, m })))
      .filter(({ m }) => m.quiz.length === 0)
      .map(({ id }) => id);
    expect(empty).toEqual([]);
  });

  it("every exam has at least 10 questions", () => {
    const thin = exams
      .filter((e) => e.questions.length < 10)
      .map((e) => `${e.id}:${e.questions.length}`);
    expect(thin).toEqual([]);
  });

  it("every path is live", () => {
    expect(paths.filter((p) => p.status !== "live").map((p) => p.id)).toEqual([]);
  });
});

describe("cross-references resolve", () => {
  it("role references point at real labs, scenarios and platforms", () => {
    const broken: string[] = [];
    for (const r of roles) {
      for (const id of r.labIds) if (!labsById[id]) broken.push(`role:${r.id} -> lab:${id}`);
      for (const id of r.scenarioIds)
        if (!scenariosById[id]) broken.push(`role:${r.id} -> scenario:${id}`);
      for (const id of r.platformIds)
        if (!platformsById[id]) broken.push(`role:${r.id} -> platform:${id}`);
    }
    expect(broken).toEqual([]);
  });

  it("path references point at real roles, labs and scenarios", () => {
    const broken: string[] = [];
    for (const p of paths) {
      for (const id of p.roleIds) if (!rolesById[id]) broken.push(`path:${p.id} -> role:${id}`);
      for (const id of p.labIds) if (!labsById[id]) broken.push(`path:${p.id} -> lab:${id}`);
      for (const id of p.scenarioIds)
        if (!scenariosById[id]) broken.push(`path:${p.id} -> scenario:${id}`);
    }
    expect(broken).toEqual([]);
  });

  it("platform scenarioId links resolve", () => {
    const broken = platforms
      .filter((p) => p.scenarioId && !scenariosById[p.scenarioId])
      .map((p) => `${p.id} -> ${p.scenarioId}`);
    expect(broken).toEqual([]);
  });

  it("platform and exam quiz competency ids resolve", () => {
    const refs = [
      ...platforms.flatMap((p) =>
        p.quiz.flatMap((q) =>
          (q.competencyIds ?? []).map((id) => ({ where: `platform:${p.id}`, id })),
        ),
      ),
      ...exams.flatMap((e) =>
        e.questions.flatMap((q) =>
          (q.competencyIds ?? []).map((id) => ({ where: `exam:${e.id}`, id })),
        ),
      ),
    ];
    const unknown = refs.filter((r) => !known.has(r.id)).map((r) => `${r.where} -> ${r.id}`);
    expect(unknown).toEqual([]);
  });

  it("artifact templates all render markdown from empty input", () => {
    // The builder calls markdown() before any field is filled in.
    for (const t of artifactTemplates) {
      expect(() => t.markdown({})).not.toThrow();
    }
  });
});

describe("scenarios are meaningfully distinct", () => {
  it("no two scenarios share an identical step set", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const s of scenarios) {
      const shape = JSON.stringify(
        s.steps.map((st) => [st.id, st.ideal, st.options.map((o) => o.label)]),
      );
      const prev = seen.get(shape);
      if (prev) dupes.push(`${prev} == ${s.id}`);
      else seen.set(shape, s.id);
    }
    expect(dupes).toEqual([]);
  });

  it("no finalDecision option explains itself with a placeholder", () => {
    const bad = scenarios
      .flatMap((s) => s.finalDecision.options.map((o) => ({ s: s.id, o })))
      .filter(({ o }) => o.why.trim().length < 8 || o.why.trim() === "N/A")
      .map(({ s, o }) => `${s}/${o.id}`);
    expect(bad).toEqual([]);
  });
});
