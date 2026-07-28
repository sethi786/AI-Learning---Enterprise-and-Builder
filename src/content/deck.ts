import { exams } from "./exams";
import { labs } from "./labs";
import { rolesById } from "./roles";
import { platforms } from "./platforms";
import type { DeckCard } from "@/lib/srs";
import type { MasteryDomain } from "./types";

/**
 * The flashcard deck.
 *
 * Built from authored question-and-answer pairs rather than from lesson prose.
 * The old deck pasted a lesson's "enterprise" paragraph onto the back of a card
 * whose front was the module title, which is not a question and has no answer —
 * you could not be right or wrong, so there was nothing to schedule.
 *
 * Every quiz and exam question in the catalogue is already a written question
 * with a correct answer and a rationale, so those become the deck directly, and
 * each platform contributes its top risk-and-fix pairing.
 */

const platformDomain: MasteryDomain = "platform";

function questionCards(): DeckCard[] {
  const out: DeckCard[] = [];

  for (const lab of labs) {
    for (const m of lab.modules) {
      for (const q of m.quiz) {
        const correct = q.options.find((o) => o.correct);
        if (!correct) continue;
        out.push({
          id: `lab:${lab.id}:${m.id}:${q.id}`,
          front: q.prompt,
          back: correct.label,
          why: q.explanation,
          source: `${lab.name} — ${m.title}`,
          domain: lab.domain,
        });
      }
    }
  }

  for (const p of platforms) {
    for (const q of p.quiz) {
      const correct = q.options.find((o) => o.correct);
      if (!correct) continue;
      out.push({
        id: `platform:${p.id}:${q.id}`,
        front: q.prompt,
        back: correct.label,
        why: q.explanation,
        source: p.name,
        domain: platformDomain,
      });
    }
    // The risk/fix pairing is the thing people are actually asked in a review.
    if (p.commonRisks[0] && p.fixes[0]) {
      out.push({
        id: `platform:${p.id}:risk`,
        front: `${p.name}: what is the risk a reviewer raises first, and what closes it?`,
        back: `Risk — ${p.commonRisks[0]}\n\nFix — ${p.fixes[0]}`,
        source: p.name,
        domain: platformDomain,
      });
    }
  }

  for (const e of exams) {
    // Exams carry a role rather than a domain; take the role's primary domain
    // so exam cards land in the same heatmap column as the work they cover.
    const examDomain = rolesById[e.roleId]?.masteryDomains[0] ?? "governance_grc";
    for (const q of e.questions) {
      const correct = q.options.find((o) => o.correct);
      if (!correct) continue;
      out.push({
        id: `exam:${e.id}:${q.id}`,
        front: q.prompt,
        back: correct.label,
        why: q.explanation,
        source: e.name,
        domain: examDomain,
      });
    }
  }

  return out;
}

export const deck: DeckCard[] = questionCards();

export const deckDomains: MasteryDomain[] = Array.from(
  new Set(deck.map((c) => c.domain)),
).sort() as MasteryDomain[];
