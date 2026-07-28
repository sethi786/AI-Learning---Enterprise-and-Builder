import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });

const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + String(e).slice(0, 200)));
p.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text().slice(0, 200));
});

let pass = 0,
  fail = 0;
const ok = (c, label, extra = "") => {
  c ? pass++ : fail++;
  console.log(c ? "PASS" : "FAIL", label, extra);
};

// ── A newcomer with no idea where to start ────────────────────────────────
console.log("--- the front door ---");
await p.goto(`${B}/app`, { waitUntil: "networkidle" });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(400);
let t = await p.locator("body").innerText();
ok(/not sure where to start/i.test(t), "dashboard offers a way in before anything else");
ok(/start here/i.test(t), "the invitation is named plainly");

await p
  .getByRole("link", { name: /^start here$/i })
  .first()
  .click();
await p.waitForTimeout(500);
t = await p.locator("body").innerText();
ok(/where are you starting from/i.test(t), "orientation asks about the learner, not the content");
ok(/nothing here can be failed/i.test(t), "orientation says it cannot be failed");

// Answer as an absolute newcomer.
await p.getByRole("button", { name: /new to this/i }).click();
await p.getByRole("button", { name: /working out whether to use ai/i }).click();
await p.waitForTimeout(200);
const buildBtn = p.getByRole("button", { name: /build my plan/i });
ok(await buildBtn.isEnabled(), "plan is buildable once both questions are answered");
await buildBtn.click();
await p.waitForTimeout(500);

t = await p.locator("body").innerText();
ok(/your plan/i.test(t), "a plan is produced");
ok(/learn the twenty words/i.test(t), "a newcomer gets vocabulary before anything else");
ok(/because|assumes/i.test(t), "steps carry reasons");
const stepCount = await p.locator("ol > li").count();
ok(stepCount >= 5, `plan has ${stepCount} ordered steps`);
ok(/hours/.test(t), "the plan states how long it takes");

// ── The dashboard now answers "what now" with one thing ───────────────────
console.log("\n--- what now ---");
await p.goto(`${B}/app`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
t = await p.locator("body").innerText();
ok(/next — step 1 of \d+/i.test(t), "dashboard leads with the single next step");
ok(/learn the twenty words/i.test(t), "next step matches the plan");
ok(!/not sure where to start/i.test(t), "the orientation prompt is gone once oriented");

// ── Vocabulary is defined where it is used ────────────────────────────────
console.log("\n--- just-in-time vocabulary ---");
await p.goto(`${B}/app/labs/iam`, { waitUntil: "networkidle" });
await p.waitForTimeout(600);

// Measured at deep level on purpose: the plain-English layer is written to
// avoid jargon entirely, so it is the organisation and technical layers where
// inline definitions earn their place.
await p
  .getByRole("button", { name: /^deep$/i })
  .first()
  .click();
await p.waitForTimeout(600);
const marked = p.locator('button[aria-label^="What does"]');
const markedCount = await marked.count();
ok(markedCount >= 5, `glossary terms marked inline in the lesson (${markedCount})`);

const firstLabel = await marked.first().getAttribute("aria-label");
await marked.first().click();
await p.waitForTimeout(400);
const pop = await p
  .locator('[data-slot="popover-content"], [role="dialog"]')
  .first()
  .innerText()
  .catch(() => "");
ok(pop.length > 60, `definition opens in place (${firstLabel})`);
ok(/why it matters/i.test(pop), "definition says why it matters, not just what it is");
await p.keyboard.press("Escape");

// A term must not be marked twenty times in one paragraph.
const dupes = await p.evaluate(() => {
  const labels = [...document.querySelectorAll('button[aria-label^="What does"]')].map((b) =>
    b.getAttribute("aria-label"),
  );
  const counts = {};
  for (const l of labels) counts[l] = (counts[l] ?? 0) + 1;
  return Object.entries(counts).filter(([, n]) => n > 4).length;
});
ok(dupes === 0, "no term is marked so often it becomes noise");

// ── Reading level actually changes what a learner meets ───────────────────
console.log("\n--- reading level ---");
const openLayers = async () =>
  p.evaluate(
    () =>
      [...document.querySelectorAll("[data-state]")].filter(
        (e) => e.getAttribute("data-state") === "open" && e.tagName === "DIV",
      ).length,
  );

await p
  .getByRole("button", { name: /^newcomer$/i })
  .first()
  .click();
await p.waitForTimeout(500);
const newcomerText = await p.locator("body").innerText();
await p
  .getByRole("button", { name: /^deep$/i })
  .first()
  .click();
await p.waitForTimeout(500);
const deepText = await p.locator("body").innerText();

ok(
  deepText.length > newcomerText.length,
  "deep level shows more than newcomer level",
  `(${newcomerText.length} -> ${deepText.length} chars)`,
);
ok(/in plain english/i.test(newcomerText), "the beginner layer is named in plain language");
ok(!/simple explanation/i.test(newcomerText), "the old jargon-y layer labels are gone");

// Level persists across a reload — otherwise it is a toy.
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(500);
const persisted = await p.evaluate(() => JSON.parse(localStorage.getItem("eai.prefs.v1") ?? "{}"));
ok(persisted.level === "deep", `reading level persists (${persisted.level})`);

// Nothing is ever hidden — every layer is still reachable at every level.
await p
  .getByRole("button", { name: /^newcomer$/i })
  .first()
  .click();
await p.waitForTimeout(400);
const triggers = await p
  .locator("button")
  .filter({ hasText: /technical deep dive/i })
  .count();
ok(triggers > 0, "the deep layer still exists for a newcomer, just collapsed");

// ── The glossary page stands on its own ───────────────────────────────────
console.log("\n--- glossary page ---");
await p.goto(`${B}/app/glossary`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
t = await p.locator("body").innerText();
ok(/\d+ terms/.test(t), "glossary states its size");
ok(/why it matters/i.test(t), "every entry carries a stake");

const search = p.locator('input[placeholder*="Search"]');
await search.fill("scim");
await p.waitForTimeout(400);
t = await p.locator("body").innerText();
ok(/SCIM/.test(t) && /when they join/i.test(t), "search finds a term by acronym");
await search.fill("groundedness");
await p.waitForTimeout(400);
ok(
  /supported by the documents/i.test(await p.locator("body").innerText()),
  "search finds a term by concept",
);

console.log("\n--- definitions reach the non-technical surfaces too ---");
for (const [url, label] of [
  ["/app/platforms/m365-copilot", "platform page"],
  ["/app/simulators/go-no-go/claims-triage-agent", "board case brief"],
]) {
  await p.goto(B + url, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  const n = await p.locator('button[aria-label^="What does"]').count();
  ok(n > 0, `${label} defines its terms in place (${n})`);
}

console.log("\n--- errors ---");
console.log(errs.length ? errs.slice(0, 6) : "none");
console.log(`\n${pass} passed, ${fail} failed, ${errs.length} console/page errors`);
await b.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
