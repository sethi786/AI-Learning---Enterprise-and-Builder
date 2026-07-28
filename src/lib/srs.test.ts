import { describe, expect, it } from "vitest";

import { NEW_CARD, schedule, type CardState } from "./srs";

const DAY = 86_400_000;
const T0 = 1_700_000_000_000;

const days = (a: CardState) => Math.round((a.due - T0) / DAY);

describe("spaced repetition scheduling", () => {
  it("brings a failed card back inside the same session", () => {
    const s = schedule(NEW_CARD, "again", T0);
    expect(s.due - T0).toBe(10 * 60_000);
    expect(s.interval).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.lapses).toBe(1);
  });

  it("uses fixed first intervals rather than the original formula", () => {
    // SM-2's derived second interval is 6 days regardless of performance, which
    // is why every modern implementation pins the early steps instead.
    const first = schedule(NEW_CARD, "good", T0);
    expect(days(first)).toBe(1);
    const second = schedule(first, "good", T0);
    expect(days(second)).toBe(3);
  });

  it("grows the interval by the ease factor once a card is established", () => {
    let card = schedule(NEW_CARD, "good", T0);
    card = schedule(card, "good", T0);
    const third = schedule(card, "good", T0);
    expect(third.interval).toBe(Math.round(3 * card.ease));
    expect(third.interval).toBeGreaterThan(card.interval);
  });

  it("never lets a hard card jump to a long interval", () => {
    // The failure this guards against: answering "hard" on a card you barely
    // knew and not seeing it again for a week.
    let card = schedule(NEW_CARD, "good", T0);
    card = schedule(card, "good", T0);
    card = schedule(card, "good", T0);
    const hard = schedule(card, "hard", T0);
    expect(hard.interval).toBeLessThanOrEqual(Math.round(card.interval * 1.2));
    expect(hard.ease).toBeLessThan(card.ease);
  });

  it("keeps ease inside SM-2's bounds however it is graded", () => {
    let card = NEW_CARD;
    for (let i = 0; i < 30; i++) card = schedule(card, "again", T0);
    expect(card.ease).toBe(1.3);

    let easy = NEW_CARD;
    for (let i = 0; i < 30; i++) easy = schedule(easy, "easy", T0);
    expect(easy.ease).toBeLessThanOrEqual(3.0);
  });

  it("caps the interval so a card cannot disappear for years", () => {
    let card = schedule(NEW_CARD, "easy", T0);
    for (let i = 0; i < 40; i++) card = schedule(card, "easy", T0);
    expect(card.interval).toBeLessThanOrEqual(365);
  });

  it("resets progress on a lapse without wiping the review count", () => {
    let card = schedule(NEW_CARD, "good", T0);
    card = schedule(card, "good", T0);
    const lapsed = schedule(card, "again", T0);
    expect(lapsed.streak).toBe(0);
    expect(lapsed.reviews).toBe(card.reviews + 1);
  });
});
