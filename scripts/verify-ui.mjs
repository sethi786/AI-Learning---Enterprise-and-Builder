import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });

const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + String(e).slice(0, 160)));
p.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text().slice(0, 160));
});
// A stray alert() would otherwise hang the whole run.
const dialogs = [];
p.on("dialog", async (d) => {
  dialogs.push(d.message().slice(0, 80));
  await d.dismiss();
});

const check = async (url, mustContain, mustNotContain) => {
  await p.goto(B + url, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  // Case-insensitive: CSS `text-transform: uppercase` changes innerText.
  const t = (await p.locator("body").innerText()).toLowerCase();
  const has = (x) => t.includes(x.toLowerCase());
  const ok = has(mustContain) && (!mustNotContain || !has(mustNotContain));
  console.log(ok ? "PASS" : "FAIL", url, ok ? "" : `— expected "${mustContain}"`);
  return ok;
};

console.log("--- content assertions (not status codes) ---");
// Bug 1: the path detail page must render, not the listing.
await check("/paths/ai-security-architecture", "Break a RAG system");
await check("/paths", "AI Security Architecture");
// Bug 4: direct URL load exercises the SSR serializer.
await check("/app/lab-engine/rag-onboarding", "Live rubric");
await check("/app/artifacts/sar", "Practice artifact");
await check("/app/exams/security-architect", "Question 1");
await check("/auth", "EAI Career Sim", "Assurance Platform");

console.log("\n--- bug 2: architecture canvas node fills ---");
await p.goto(B + "/app/scenarios/rag-ticket-agent", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const fills = await p.$$eval("svg rect", (rs) =>
  rs.map((r) => r.getAttribute("fill")).filter(Boolean),
);
const bad = fills.filter((f) => f.startsWith("hsl(var("));
console.log(
  bad.length === 0 ? "PASS" : "FAIL",
  `node fills: ${fills.length}, invalid hsl(var()): ${bad.length}`,
);
const computed = await p.$$eval("svg g rect", (rs) =>
  rs.slice(0, 3).map((r) => getComputedStyle(r).fill),
);
console.log(
  "  computed fills:",
  computed.join(" | "),
  computed.every((c) => c !== "rgb(0, 0, 0)") ? "(not black — PASS)" : "(BLACK — FAIL)",
);

console.log("\n--- bug 6: env simulator reset + score ---");
await p.goto(B + "/app/simulators/env", { waitUntil: "networkidle" });
await p.waitForTimeout(600);
// Each case card offers the 6 stage buttons; pick one per card.
const cards = p.locator("[data-slot=card], .rounded-xl.border").filter({ hasText: /Case \d/ });
const cardCount = await cards.count();
for (let i = 0; i < cardCount; i++) {
  await cards
    .nth(i)
    .locator("button")
    .first()
    .click()
    .catch(() => {});
  await p.waitForTimeout(80);
}
await p.waitForTimeout(300);
const checkBtn = p.getByRole("button", { name: /check answers/i });
if ((await checkBtn.count()) && (await checkBtn.isEnabled().catch(() => false))) {
  await checkBtn.click();
  await p.waitForTimeout(500);
} else {
  console.log("  note: check button not enabled; answered", cardCount, "cards");
}
let t = await p.locator("body").innerText();
const scored = /\d+\/\d+/.test(t);
console.log(scored ? "PASS" : "FAIL", "env simulator produces a score:", scored);
const resetBtn = p.getByRole("button", { name: /^Reset$/ });
if (await resetBtn.count()) {
  await resetBtn.first().click();
  await p.waitForTimeout(400);
  t = await p.locator("body").innerText();
  console.log(!/Ideal:/.test(t) ? "PASS" : "FAIL", "reset actually clears picks");
}

console.log("\n--- bug 5: saas-onboarding module anchors ---");
await p.goto(B + "/app/labs/saas-onboarding", { waitUntil: "networkidle" });
await p.waitForTimeout(600);
const anchorCount = await p.$$eval(
  "#sso-scim-rbac, #features-connectors, #offboarding",
  (e) => e.length,
);
console.log(anchorCount >= 3 ? "PASS" : "FAIL", `module anchors present: ${anchorCount}`);

console.log("\n--- newly authored labs actually render lessons and quizzes ---");
// A regression guard: the lab page once rendered its header and mission and
// silently dropped every module, and a status-code check would not have caught it.
// The phrases below come from the deep-dive layer only, so a page that renders
// nothing but module titles fails this. The reading level is forced to "deep"
// first, because at the default level that layer is collapsed and unmounted.
await p.goto(B + "/app/labs/rag", { waitUntil: "networkidle" });
await p.evaluate(() =>
  localStorage.setItem("eai.prefs.v1", JSON.stringify({ level: "deep", oriented: true })),
);
for (const [labId, moduleId, phrase] of [
  ["data-governance", "classification-trimming", "re-sync permissions on a schedule"],
  ["iam", "sso-federation", "phishing-resistant mfa"],
  ["devsecops", "secure-ai-sdlc", "unpinned package is a supply chain path"],
]) {
  await p.goto(B + `/app/labs/${labId}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const anchor = await p.$(`#${moduleId}`);
  const quiz = (await p.$$('[role="radiogroup"]')).length > 0;
  const body = (await p.locator("body").innerText()).toLowerCase();
  const layers = [
    "in plain english",
    "what it means in an organisation",
    "technical deep dive",
  ].every((l) => body.includes(l));
  const ok = !!anchor && layers && quiz && body.includes(phrase);
  console.log(
    ok ? "PASS" : "FAIL",
    `${labId}: anchor=${!!anchor} layers=${layers} quiz=${quiz} deepDive=${body.includes(phrase)}`,
  );
}

console.log("\n--- an exam runs end to end to a score ---");
await p.goto(B + "/app/exams/solution-architect", { waitUntil: "networkidle" });
await p.waitForTimeout(600);
// Every question is on one page and Submit only enables once all are answered,
// so answering one and looking for "Next" would hang on a disabled button.
const groups = p.locator('[role="radiogroup"]');
const questionCount = await groups.count();
for (let i = 0; i < questionCount; i++) {
  await groups.nth(i).locator('[role="radio"]').first().click();
}
const submit = p.getByRole("button", { name: /^submit$/i }).first();
const enabled = await submit.isEnabled();
if (enabled) {
  await submit.click();
  await p.waitForTimeout(500);
}
const examBody = await p.locator("body").innerText();
// "Score: n/10" plus a per-question rationale is what a finished exam looks like.
const m = examBody.match(/Score:\s*(\d+)\s*\/\s*(\d+)/i);
const examOk =
  !!m && Number(m[2]) === questionCount && questionCount >= 10 && /Why:/.test(examBody);
console.log(
  examOk ? "PASS" : "FAIL",
  `exam: ${questionCount} questions answered, submit enabled=${enabled}, result="${m ? m[0] : "none"}", rationales shown=${/Why:/.test(examBody)}`,
);

console.log("\n--- a platform page shows authored prose, not filler ---");
await p.goto(B + "/app/platforms/azure-ai-foundry", { waitUntil: "networkidle" });
await p.waitForTimeout(400);
const plat = (await p.locator("body").innerText()).toLowerCase();
const platOk =
  !plat.includes("enterprise use cases for") &&
  !plat.includes("fill in identity") &&
  plat.length > 1500;
console.log(platOk ? "PASS" : "FAIL", `platform page: ${plat.length} chars, no filler markers`);

console.log("\n--- errors / dialogs ---");
console.log("page+console errors:", errs.length ? errs.slice(0, 5) : "none");
console.log("native dialogs triggered:", dialogs.length ? dialogs : "none");

await b.close();
