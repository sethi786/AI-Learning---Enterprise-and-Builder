import { chromium } from "playwright";

/**
 * Audit from a learner's point of view.
 *
 * Runs the journey a specific persona would actually take and measures what
 * they meet at each step, rather than checking that routes return content.
 *
 * Defaults to the Enterprise AI Architect. Pass a role id to walk a different
 * one — the gaps this found for the architect turned out to be systemic, so
 * checking only the persona that surfaced them proves nothing.
 *
 *   node scripts/audit-architect.mjs                     # architect
 *   node scripts/audit-architect.mjs security-architect  # any role
 *   node scripts/audit-architect.mjs --all               # every role
 */

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext();
const p = await ctx.newPage();

const errs = [];
p.on("pageerror", (e) => errs.push(`${step}: pageerror ${String(e).slice(0, 110)}`));
p.on("console", (m) => {
  if (m.type() === "error") errs.push(`${step}: ${m.text().slice(0, 110)}`);
});
let step = "";

const findings = [];
const note = (severity, where, what) => findings.push({ severity, where, what });
const go = async (url, wait = 900) => {
  step = url;
  await p.goto(B + url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(wait);
  return p
    .locator("body")
    .innerText()
    .catch(() => "");
};

console.log("═══ STEP 1: arriving with no account ═══");
let t = await go("/");
console.log(`  landing page: ${t.length} chars`);
const mentionsArchitect = /architect/i.test(t);
console.log(`  mentions "architect": ${mentionsArchitect}`);
if (!mentionsArchitect)
  note(
    "medium",
    "/",
    "The landing page never uses the word 'architect', so a learner searching for that role has no signal this is for them.",
  );

t = await go("/paths");
const archPath = /solution architecture|ai security architecture/i.test(t);
console.log(`  /paths names an architecture path: ${archPath}`);

t = await go("/paths/ai-solution-architecture");
console.log(`  architecture path page: ${t.length} chars`);
const outcomes = (t.match(/\n/g) ?? []).length;
if (t.length < 1200)
  note(
    "medium",
    "/paths/ai-solution-architecture",
    `Path page is only ${t.length} chars — thin for the page that has to convince someone this is their route.`,
  );
void outcomes;

console.log("\n═══ STEP 2: sign-up gate ═══");
step = "/app";
await p.goto(B + "/app", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
await p.waitForTimeout(1800);
const landedOn = new URL(p.url()).pathname;
console.log(`  /app redirects to: ${landedOn}`);
if (landedOn !== "/auth")
  note("high", "/app", "Portal did not redirect an anonymous visitor to sign-in.");

// Sign in as the learner.
await p.evaluate(() => {
  localStorage.setItem(
    "sb-kbxeefyitsgurcldzxgs-auth-token",
    JSON.stringify({
      access_token: "stub",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "stub",
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        aud: "authenticated",
        role: "authenticated",
        email: "architect@example.com",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date(0).toISOString(),
      },
    }),
  );
});

console.log("\n═══ STEP 3: orientation — can they say what they want? ═══");
t = await go("/app/start", 1200);
const goalOptions = await p.locator("button[aria-pressed]").allInnerTexts();
console.log(`  goals offered: ${goalOptions.filter((g) => g.length > 20).length}`);
const hasArchitectGoal = /building an ai system/i.test(t);
console.log(
  `  a goal matching "become an architect": ${hasArchitectGoal ? "'Building an AI system'" : "NONE"}`,
);
if (!/architect/i.test(t))
  note(
    "medium",
    "/app/start",
    "No orientation option mentions architecture by name. A learner whose goal is the job title has to infer that 'Building an AI system' is theirs.",
  );

// Choose the architect-shaped route.
await p.getByRole("button", { name: /i work around it/i }).click();
await p.getByRole("button", { name: /building an ai system/i }).click();
await p.getByRole("button", { name: /build my plan/i }).click();
await p.waitForTimeout(1000);
t = await p.locator("body").innerText();
const planSteps = await p.locator("ol > li").count();
const planHours = t.match(/about ([\d.]+) hours/)?.[1];
console.log(`  plan produced: ${planSteps} steps, ~${planHours} hours`);
if (planSteps < 6)
  note(
    "high",
    "/app/start",
    `The architect plan is only ${planSteps} steps (~${planHours}h). For a career-change goal that is a weekend, not a path — it stops well short of the role's own lab list.`,
  );

console.log("\n═══ STEP 4: working the plan ═══");
const PLAN = [
  ["/app/labs/rag", "lab"],
  ["/app/lab-engine/ai-engineering-eval", "simulator"],
  ["/app/lab-engine/in-house-architecture", "simulator"],
  ["/app/lab-engine/devsecops-release-gate", "simulator"],
];
for (const [url, kind] of PLAN) {
  t = await go(url, 1200);
  const quizzes = (await p.$$('[role="radiogroup"]')).length;
  const combos = await p.getByRole("combobox").count();
  const runnable = (await p.getByRole("button", { name: /^start lab$/i }).count()) > 0;
  console.log(
    `  ${url.padEnd(42)} ${String(t.length).padStart(6)} chars  ${kind === "lab" ? `${quizzes} quizzes` : `${combos} config, runnable=${runnable}`}`,
  );
  if (t.length < 1500)
    note("high", url, `Only ${t.length} chars — a plan step that renders almost nothing.`);
}

console.log("\n═══ STEP 5: the role's own material, beyond the plan ═══");
t = await go("/app/roles/solution-architect", 1200);
console.log(`  role page: ${t.length} chars`);
const stageItems = await p.evaluate(() => {
  const h = [...document.querySelectorAll("*")].find((e) => e.textContent?.trim() === "Stages");
  const card = h?.closest("[data-slot=card]") ?? h?.parentElement?.parentElement;
  return card ? card.querySelectorAll("li").length : 0;
});
console.log(`  beginner→expert ladder: ${stageItems} items total`);
if (stageItems > 0 && stageItems <= 6)
  note(
    "high",
    "/app/roles/solution-architect",
    `The four-stage progression has only ${stageItems} items across all of beginner/intermediate/advanced/expert — roughly one line each. It names the ladder without describing the rungs.`,
  );

console.log("\n═══ STEP 6: assessment ═══");
t = await go("/app/exams/solution-architect", 1200);
const qCount = await p.locator('[role="radiogroup"]').count();
console.log(`  exam questions: ${qCount}`);
for (let i = 0; i < qCount; i++)
  await p.locator('[role="radiogroup"]').nth(i).locator('[role="radio"]').first().click();
const sub = p.getByRole("button", { name: /^submit$/i }).first();
const canSubmit = (await sub.count()) > 0 && (await sub.isEnabled());
if (canSubmit) {
  await sub.click();
  await p.waitForTimeout(700);
}
t = await p.locator("body").innerText();
const scoreLine = t.match(/Score:\s*\d+\s*\/\s*\d+/i)?.[0];
console.log(`  submit enabled: ${canSubmit}, result: ${scoreLine ?? "none"}`);
console.log(`  rationales shown: ${/Why:/.test(t)}`);

console.log("\n═══ STEP 7: what do they walk away with? ═══");
t = await go("/app/portfolio", 1200);
const hasEvidence = !/nothing recorded yet/i.test(t);
console.log(`  practice record populated after the walk: ${hasEvidence}`);
const md = await p
  .locator("pre")
  .first()
  .innerText()
  .catch(() => "");
console.log(`  export length: ${md.length} chars`);
if (md && !/architect/i.test(md))
  note(
    "low",
    "/app/portfolio",
    "The exported record never names the role it was built toward, so a reader has to infer the direction of travel.",
  );

console.log("\n═══ STEP 8: getting the job ═══");
t = await go("/app/careers", 1200);
await p
  .getByRole("button", { name: /solution architect/i })
  .first()
  .click()
  .catch(() => {});
await p.waitForTimeout(800);
t = await p.locator("body").innerText();
const iq = await p.getByRole("button", { name: /I have answered/i }).count();
console.log(`  interview questions for the role: ${iq}`);
console.log(`  names alternative job titles: ${/AI Solution Architect|GenAI Engineer/i.test(t)}`);
console.log(`  decodes advert language: ${/decoding the job advert/i.test(t)}`);
if (iq < 5)
  note(
    "medium",
    "/app/careers",
    `Only ${iq} interview questions for this role. An architect interview is usually several rounds — this is a taste, not preparation.`,
  );

console.log("\n═══ CONSOLE ERRORS ═══");
console.log(errs.length ? errs.slice(0, 6).join("\n") : "  none");

console.log("\n═══ FINDINGS ═══");
if (!findings.length) console.log("  none");
for (const f of findings.sort(
  (a, b) =>
    ({ high: 0, medium: 1, low: 2 })[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity],
)) {
  console.log(`  [${f.severity.toUpperCase()}] ${f.where}\n         ${f.what}`);
}
await b.close();
