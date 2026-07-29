import { chromium } from "playwright";

/**
 * Every role, audited the way one persona was.
 *
 * The architect walk found three problems that all turned out to be systemic —
 * thin plans, one-line career ladders, three interview questions. Auditing the
 * single persona that surfaced them would have left the same gaps in place for
 * every other learner, so this checks all of them and fails on any finding.
 */

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";

const ROLES = [
  { id: "platform-admin", goal: /rolling a tool out to people/i, exam: "platform-admin" },
  { id: "governance-operator", goal: /deciding what gets approved/i, exam: "governance-operator" },
  { id: "solution-architect", goal: /building an ai system/i, exam: "solution-architect" },
  {
    id: "security-architect",
    goal: /securing something already built/i,
    exam: "security-architect",
  },
  { id: "grc-lead", goal: /deciding what gets approved/i, exam: "grc-lead" },
];

const MIN_PLAN_STEPS = 8;
const MIN_LADDER = 12;
const MIN_INTERVIEW = 6;
const MIN_SCENARIOS = 3;

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext();
const p = await ctx.newPage();

const errs = [];
p.on("pageerror", (e) => errs.push(`${where}: ${String(e).slice(0, 110)}`));
p.on("console", (m) => {
  if (m.type() === "error") errs.push(`${where}: ${m.text().slice(0, 110)}`);
});
let where = "";

await p.goto(B + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
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
        email: "learner@example.com",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date(0).toISOString(),
      },
    }),
  );
});

const findings = [];
const rows = [];

for (const role of ROLES) {
  // Plan length, built through the real orientation UI.
  where = `${role.id}/plan`;
  await p.goto(B + "/app/start", { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.evaluate(() =>
    localStorage.setItem("eai.prefs.v1", JSON.stringify({ level: "working", oriented: false })),
  );
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  await p.getByRole("button", { name: /i work around it/i }).click();
  await p.getByRole("button", { name: role.goal }).first().click();
  await p.getByRole("button", { name: /build my plan/i }).click();
  await p.waitForTimeout(900);
  const planSteps = await p.locator("ol > li").count();
  const planHours = (await p.locator("body").innerText()).match(/about ([\d.]+) hours/)?.[1] ?? "?";
  if (planSteps < MIN_PLAN_STEPS) {
    findings.push(
      `${role.id}: plan is ${planSteps} steps (~${planHours}h) — below ${MIN_PLAN_STEPS}`,
    );
  }

  // Career ladder depth on the role page.
  where = `${role.id}/role`;
  await p.goto(B + `/app/roles/${role.id}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForTimeout(900);
  const ladder = await p.evaluate(() => {
    const h = [...document.querySelectorAll("*")].find((e) => e.textContent?.trim() === "Stages");
    const card = h?.closest("[data-slot=card]") ?? h?.parentElement?.parentElement;
    return card ? card.querySelectorAll("li").length : 0;
  });
  if (ladder < MIN_LADDER)
    findings.push(`${role.id}: career ladder has ${ladder} items — below ${MIN_LADDER}`);

  const roleText = await p.locator("body").innerText();
  const scenarioLinks = await p.locator('a[href*="/app/scenarios/"]').count();
  if (scenarioLinks < MIN_SCENARIOS) {
    findings.push(`${role.id}: only ${scenarioLinks} scenarios reachable from the role page`);
  }

  // Exam completes to a score.
  where = `${role.id}/exam`;
  await p.goto(B + `/app/exams/${role.exam}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForTimeout(900);
  const groups = p.locator('[role="radiogroup"]');
  const qCount = await groups.count();
  for (let i = 0; i < qCount; i++) await groups.nth(i).locator('[role="radio"]').first().click();
  const sub = p.getByRole("button", { name: /^submit$/i }).first();
  const submitted = (await sub.count()) > 0 && (await sub.isEnabled());
  if (submitted) {
    await sub.click();
    await p.waitForTimeout(600);
  }
  const examText = await p.locator("body").innerText();
  const scored = /Score:\s*\d+\s*\/\s*\d+/i.test(examText);
  if (qCount < 10) findings.push(`${role.id}: exam has only ${qCount} questions`);
  if (!scored) findings.push(`${role.id}: exam did not produce a score`);

  // Interview depth.
  where = `${role.id}/careers`;
  await p.goto(B + "/app/careers", { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForTimeout(800);
  const btn = p
    .locator("button")
    .filter({ hasText: new RegExp(role.id.replace(/-/g, "[ -]"), "i") })
    .first();
  if (await btn.count()) {
    await btn.click();
    await p.waitForTimeout(700);
  }
  const iq = await p.getByRole("button", { name: /I have answered/i }).count();
  if (iq < MIN_INTERVIEW)
    findings.push(`${role.id}: ${iq} interview questions — below ${MIN_INTERVIEW}`);

  rows.push({
    role: role.id,
    planSteps,
    planHours,
    ladder,
    scenarios: scenarioLinks,
    exam: qCount,
    interview: iq,
    roleChars: roleText.length,
  });
}

console.log(
  "role".padEnd(24),
  "plan".padStart(6),
  "hours".padStart(6),
  "ladder".padStart(7),
  "scen".padStart(5),
  "exam".padStart(5),
  "intvw".padStart(6),
);
for (const r of rows) {
  console.log(
    r.role.padEnd(24),
    String(r.planSteps).padStart(6),
    String(r.planHours).padStart(6),
    String(r.ladder).padStart(7),
    String(r.scenarios).padStart(5),
    String(r.exam).padStart(5),
    String(r.interview).padStart(6),
  );
}

console.log("\nconsole/page errors:", errs.length ? errs.slice(0, 5) : "none");
console.log("\nFINDINGS:", findings.length ? "" : "none");
for (const f of findings) console.log("  -", f);

await b.close();
process.exit(findings.length || errs.length ? 1 : 0);
