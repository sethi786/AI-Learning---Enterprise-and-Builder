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

// ── The jobs page ─────────────────────────────────────────────────────────
// The portal is gated. Without a session every /app navigation lands on the
// sign-in page, so this script would be checking the wrong thing entirely.
async function signIn(page) {
  await page.goto(B + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => {
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
          email: "verifier@example.com",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date(0).toISOString(),
        },
      }),
    );
  });
}
await signIn(p);

console.log("--- the jobs, and how to get one ---");
await p.goto(`${B}/app/careers`, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
let t = await p.locator("body").innerText();
ok(/search these titles/i.test(t), "tells you what to search for on a job board");
ok(/could you already do this/i.test(t), "leads with whether the reader already qualifies");
ok(/decoding the job advert/i.test(t), "decodes the advert language");
ok(/first ninety days/i.test(t), "says what you would be judged on");
ok(/does not quote salaries/i.test(t), "is explicit about not quoting salaries");
ok(!/[£$€]\s?\d{2,}/.test(t), "no salary figure appears anywhere on the page");

// Interview practice must not give the answer away before you have tried.
console.log("\n--- interview practice ---");
const revealBtn = p.getByRole("button", { name: /I have answered/i }).first();
ok((await revealBtn.count()) > 0, "questions are answer-first, not answer-visible");
const before = await p.locator("body").innerText();
// "a strong answer covers" is also the button label, so checking for it here
// matches the prompt rather than the panel. The weak-answer heading only ever
// appears once the panel is open.
ok(!/sounds fine and fails/i.test(before), "model answer is hidden until asked for");
await revealBtn.click();
await p.waitForTimeout(400);
const after = await p.locator("body").innerText();
ok(/a strong answer covers/i.test(after), "revealing shows the checklist");
ok(/sounds fine and fails/i.test(after), "and the plausible wrong answer");
ok(after.length > before.length, "reveal adds content rather than replacing it");

// Every role must be reachable and distinct.
const roleBtns = await p
  .locator("button")
  .filter({ hasText: /Admin|Architect|Operator|Lead/ })
  .count();
ok(roleBtns >= 5, `all roles selectable (${roleBtns})`);
await p
  .getByRole("button", { name: /security architect/i })
  .first()
  .click();
await p.waitForTimeout(400);
t = await p.locator("body").innerText();
ok(/prompt injection/i.test(t), "security role surfaces its distinctive interview question");

// ── The practice record ───────────────────────────────────────────────────
console.log("\n--- the practice record ---");
await p.goto(`${B}/app/portfolio`, { waitUntil: "networkidle" });
await p.evaluate(() => {
  // Clear the learner's own state but keep the session — a blanket clear wipes
  // the auth token and every later navigation lands on the sign-in page.
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("eai.")) localStorage.removeItem(k);
  }
});
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(500);
t = await p.locator("body").innerText();
ok(/what this is, and what it is not/i.test(t), "leads with the honesty framing");
ok(/not job experience/i.test(t), "states plainly it is not experience");
ok(/nothing recorded yet/i.test(t), "empty state is honest rather than fabricated");

// Now do a real board case and confirm it shows up as evidence.
await p.goto(`${B}/app/simulators/go-no-go/claims-triage-agent`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
await p.getByRole("button", { name: /review the evidence pack/i }).click();
await p.waitForTimeout(300);
for (let i = 0; i < 3; i++) {
  const btns = p.getByRole("button", { name: /^request$/i });
  if (!(await btns.count())) break;
  await btns.first().click();
  await p.waitForTimeout(120);
}
await p.getByRole("button", { name: /take the decision/i }).click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: /go with conditions/i }).click();
await p.waitForTimeout(300);
const conds = p.locator("button").filter({ hasText: /Auto-decline disabled|Retrospective sample/ });
for (let i = 0; i < (await conds.count()); i++) await conds.nth(i).click();
await p.getByRole("button", { name: /put it to the board/i }).click();
await p.waitForTimeout(300);
for (let i = 0; i < 2; i++) {
  const body = await p.locator("body").innerText();
  if (!/challenge \d of \d/i.test(body)) break;
  const opts = p.locator("button").filter({ hasText: /Hold:|No — a low-value|Agree|Accept|Offer/ });
  if (await opts.count()) {
    await opts.first().click();
    await p.waitForTimeout(300);
  }
  const next = p.getByRole("button", { name: /next challenge|see the debrief/i }).first();
  if (await next.count()) {
    await next.click();
    await p.waitForTimeout(400);
  }
}
ok(/board outcome/i.test(await p.locator("body").innerText()), "board case completed");

await p.goto(`${B}/app/portfolio`, { waitUntil: "networkidle" });
await p.waitForTimeout(600);
t = await p.locator("body").innerText();
ok(!/nothing recorded yet/i.test(t), "completed work now appears in the record");
ok(/claims triage agent/i.test(t), "the specific exercise is named");
ok(/chaired the approval board/i.test(t), "with what was actually done, not just a score");

// The export is the deliverable — it has to carry its own caveat.
const md = await p.locator("pre").first().innerText();
ok(md.includes("# AI practice record"), "export is Markdown with a heading");
ok(/record of practice, not of employment/i.test(md), "export carries the caveat with it");
ok(/none of it is real client work/i.test(md), "export says it is simulation");
ok(!/years of experience|certified/i.test(md), "export never claims experience or certification");
ok(/Claims triage agent/i.test(md), "export contains the completed work");

// Naming it must flow through to the export.
await p.locator('input[placeholder*="Your name"]').fill("Ada Lovelace");
await p.waitForTimeout(400);
const named = await p.locator("pre").first().innerText();
ok(named.startsWith("# AI practice record — Ada Lovelace"), "name flows into the export heading");

const dl = await p.getByRole("button", { name: /download/i }).count();
ok(dl > 0, "record is downloadable");

console.log("\n--- errors ---");
console.log(errs.length ? errs.slice(0, 6) : "none");
console.log(`\n${pass} passed, ${fail} failed, ${errs.length} console/page errors`);
await b.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
