import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext();
const p = await ctx.newPage();

const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
p.on("console", (m) => {
  if (m.type() === "error") errs.push(m.text().slice(0, 160));
});

let pass = 0,
  fail = 0;
const ok = (c, l, x = "") => {
  c ? pass++ : fail++;
  console.log(c ? "PASS" : "FAIL", l, x);
};

// The portal is gated now, so the crawl needs a session.
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
  localStorage.setItem(
    "eai.prefs.v1",
    JSON.stringify({ level: "deep", oriented: true, goal: "starting-out" }),
  );
});

console.log("--- the two entry-level labs teach, at depth ---");
for (const [labId, phrase] of [
  ["ai-operations", "unsupported claim"],
  ["ai-evaluation", "inter-rater"],
]) {
  await p.goto(`${B}/app/labs/${labId}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForTimeout(1200);
  const t = await p.locator("body").innerText();
  const modules = await p.locator("h2").count();
  const quizzes = await p.$$('[role="radiogroup"]');
  const layers = [
    "in plain english",
    "what it means in an organisation",
    "technical deep dive",
  ].every((l) => t.toLowerCase().includes(l));
  ok(modules >= 3, `${labId}: ${modules} modules`);
  ok(layers, `${labId}: all three teaching layers render`);
  ok(quizzes.length >= 3, `${labId}: ${quizzes.length} quizzes`);
  ok(t.length > 4000, `${labId}: ${t.length} chars of content — not a one-liner`);
  ok(/open the simulator/i.test(t), `${labId}: offers a runnable simulator`);
  void phrase;
}

console.log("\n--- their simulators run and score ---");
for (const bp of ["ai-operations-queue", "ai-evaluation-design"]) {
  await p.goto(`${B}/app/lab-engine/${bp}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForTimeout(1200);
  const combos = await p.getByRole("combobox").count();
  ok(combos > 0, `${bp}: ${combos} configuration decisions`);
  await p.getByRole("button", { name: /^start lab$/i }).click();
  await p.waitForTimeout(800);
  let blocked = false,
    answered = 0;
  for (let g = 0; g < 14; g++) {
    const body = await p.locator("body").innerText();
    if (/Scoring rubric/.test(body)) break;
    const radios = p.locator('[role="radio"]:not([disabled])');
    const adv = p.getByRole("button", { name: /^(advance|finish run)$/i }).first();
    const advOn = (await adv.count()) > 0 && (await adv.isEnabled());
    if (await radios.count()) {
      if (!advOn) blocked = true;
      await radios.first().click();
      answered++;
      await p.waitForTimeout(400);
      continue;
    }
    if (advOn) {
      await adv.click();
      await p.waitForTimeout(600);
      continue;
    }
    break;
  }
  const t = await p.locator("body").innerText();
  ok(blocked, `${bp}: an unresolved incident blocks the run`);
  ok(answered >= 2, `${bp}: both incidents fired (${answered})`);
  ok(/Scoring rubric/.test(t), `${bp}: reached a scored rubric`);
  ok(/Debrief/.test(t), `${bp}: debrief rendered`);
  const art = await p
    .locator("textarea")
    .first()
    .inputValue()
    .catch(() => "");
  ok(art.length > 200, `${bp}: exported an artifact (${art.length} chars)`);
}

console.log("\n--- careers page leads with the open door ---");
await p.goto(`${B}/app/careers`, { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(900);
let t = await p.locator("body").innerText();
ok(/no prior technology career needed/i.test(t), "entry-level roles are separated and named");
ok(/AI Operations Specialist/i.test(t), "the operations role is listed");
ok(/customer service|contact centre/i.test(t), "names a non-technical background that transfers");
ok(/teaching|tutor/i.test(t), "names another one");
ok(!/[£$€]\s?\d{2,}/.test(t), "still quotes no salary figures");
await p
  .getByRole("button", { name: /AI Evaluation/i })
  .first()
  .click();
await p.waitForTimeout(600);
t = await p.locator("body").innerText();
ok(/research|editing|librarian/i.test(t), "evaluation role names its own transfer routes");
ok(/open the lab/i.test(t), "links to the lab that teaches the work");

console.log("\n--- the beginner plan routes correctly ---");
// Clear the orientation flag: an already-oriented learner correctly sees their
// plan rather than the questions, so the questions have to be checked fresh.
await p.goto(`${B}/app/start`, { waitUntil: "domcontentloaded", timeout: 30000 });
await p.evaluate(() =>
  localStorage.setItem("eai.prefs.v1", JSON.stringify({ level: "new", oriented: false })),
);
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(1000);
t = await p.locator("body").innerText();
ok(/trying to get into ai work at all/i.test(t), "orientation offers a complete-beginner goal");
ok(/you do not work in technology/i.test(t), "and says plainly who it is for");

// Build the plan through the real UI.
await p.getByRole("button", { name: /new to this/i }).click();
await p.getByRole("button", { name: /trying to get into ai work at all/i }).click();
await p.getByRole("button", { name: /build my plan/i }).click();
await p.waitForTimeout(900);
t = await p.locator("body").innerText();
ok(/your plan/i.test(t), "a beginner plan is produced");
ok(/AI Operations Lab|reviewing what an AI produced/i.test(t), "it includes the entry-level work");
ok(/export what you have done/i.test(t), "and ends with something to show");

await p.evaluate(() =>
  localStorage.setItem(
    "eai.prefs.v1",
    JSON.stringify({ level: "new", oriented: true, goal: "starting-out" }),
  ),
);

await p.goto(`${B}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(1200);
t = await p.locator("body").innerText();
const stepLine = t.match(/next — step (\d+) of (\d+)/i);
ok(
  !!stepLine && stepLine[1] === "1",
  "dashboard leads a beginner with step 1 of their plan",
  stepLine?.[0] ?? "",
);
ok(/twenty words/i.test(t), "and that first step is vocabulary");

console.log("\n--- errors ---");
console.log(errs.length ? errs.slice(0, 5) : "none");
console.log(`\n${pass} passed, ${fail} failed, ${errs.length} console/page errors`);
await b.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
