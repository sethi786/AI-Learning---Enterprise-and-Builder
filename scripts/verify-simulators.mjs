import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });

const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + String(e).slice(0, 200)));
p.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text().slice(0, 200));
});
p.on("dialog", async (d) => {
  errs.push("DIALOG: " + d.message().slice(0, 80));
  await d.dismiss();
});

let pass = 0;
let fail = 0;
const ok = (cond, label, extra = "") => {
  if (cond) pass++;
  else fail++;
  console.log(cond ? "PASS" : "FAIL", label, extra);
};

// ── Every lab offers a runnable simulator, and it runs ────────────────────
const LABS = [
  "rag",
  "agent",
  "connector",
  "zero-trust",
  "privacy",
  "legal",
  "qrm",
  "data-governance",
  "iam",
  "devsecops",
  "ai-engineering",
  "saas-onboarding",
  "in-house-app",
];
console.log("--- every lab exposes a runnable simulator ---");
for (const labId of LABS) {
  await p.goto(`${B}/app/labs/${labId}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(250);
  const cta = p.getByRole("link", { name: /open the simulator/i });
  ok((await cta.count()) > 0, `lab ${labId} offers a simulator`);
}

// ── Run one blueprint twice, asserting the scoring discriminates ─────────
// A rubric that scores the same however you configure it is decoration. This
// runs zero-trust-access with deliberately weak choices and then with the
// defensible ones, and requires the second to beat the first.
console.log("\n--- a lab blueprint runs to a scored artifact ---");

const setSelect = async (index, optionText) => {
  const combo = p.getByRole("combobox").nth(index);
  await combo.click();
  await p.waitForTimeout(120);
  await p.getByRole("option", { name: optionText }).click();
  await p.waitForTimeout(120);
};

async function runLab({ strong }) {
  await p.goto(`${B}/app/lab-engine/zero-trust-access`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);

  const before = await p.locator("body").innerText();
  const comboCount = await p.getByRole("combobox").count();

  if (strong) {
    await setSelect(0, /On-behalf-of/);
    await setSelect(1, /compliant\/managed device/);
    await setSelect(2, /Private endpoint/);
    await setSelect(3, /^60$/);
    const switches = p.locator('[role="switch"]');
    for (let i = 0; i < (await switches.count()); i++) {
      if ((await switches.nth(i).getAttribute("data-state")) !== "checked") {
        await switches.nth(i).click();
        await p.waitForTimeout(80);
      }
    }
  }

  const after = await p.locator("body").innerText();
  await p.getByRole("button", { name: /^start lab$/i }).click();
  await p.waitForTimeout(600);

  // The considered response to each injected incident, by label.
  const strongAnswers = [/app-protection policy/i, /allowlist of approved hosts/i];
  const weakAnswers = [/Exclude the executive group/i, /DLP blocklist/i];
  const wanted = strong ? strongAnswers : weakAnswers;

  let blocked = false;
  let answered = 0;
  for (let guard = 0; guard < 14; guard++) {
    const body = await p.locator("body").innerText();
    if (/Scoring rubric/.test(body)) break;

    const radios = p.locator('[role="radio"]:not([disabled])');
    const advance = p.getByRole("button", { name: /^(advance|finish run)$/i }).first();
    const advanceEnabled = (await advance.count()) > 0 && (await advance.isEnabled());

    if ((await radios.count()) > 0) {
      if (!advanceEnabled) blocked = true;
      // Radios are unlabelled inputs; click the label row that contains the text.
      const target = p.locator("label, div").filter({ hasText: wanted[answered % wanted.length] });
      const row = p.locator('[role="radio"]:not([disabled])');
      let clicked = false;
      for (let i = 0; i < (await row.count()); i++) {
        const container = row
          .nth(i)
          .locator("xpath=ancestor::div[contains(@class,'rounded-md')][1]");
        const txt = await container.innerText().catch(() => "");
        if (wanted[answered % wanted.length].test(txt)) {
          await row.nth(i).click();
          clicked = true;
          break;
        }
      }
      if (!clicked) await row.first().click();
      void target;
      answered++;
      await p.waitForTimeout(350);
      continue;
    }
    if (advanceEnabled) {
      await advance.click();
      await p.waitForTimeout(500);
      continue;
    }
    break;
  }

  const text = await p.locator("body").innerText();
  const cfg = text.match(/Configuration score: (-?\d+) \/ (\d+)/);
  const inc = text.match(/Incident score: (-?\d+) \/ (\d+)/);
  // The artifact renders into a textarea, so it is a value not page text.
  const artifact = await p
    .locator("textarea")
    .first()
    .inputValue()
    .catch(() => "");
  return {
    comboCount,
    configChanged: before !== after,
    blocked,
    answered,
    text,
    cfgScore: cfg ? Number(cfg[1]) : null,
    cfgMax: cfg ? Number(cfg[2]) : null,
    incScore: inc ? Number(inc[1]) : null,
    incMax: inc ? Number(inc[2]) : null,
    artifact,
  };
}

const weak = await runLab({ strong: false });
ok(weak.comboCount > 0, `config panel exposes ${weak.comboCount} selects`);
ok(weak.blocked, "an unresolved incident blocks the run from advancing");
ok(weak.answered >= 2, `both injected incidents fired (${weak.answered})`);
ok(weak.cfgScore !== null && weak.incScore !== null, "run reached the scoring rubric");
ok(/Debrief/.test(weak.text), "debrief rendered");
ok(/What good looks like/.test(weak.text), "debrief carries authored guidance");
ok(weak.artifact.length > 200, `artifact generated (${weak.artifact.length} chars)`);

const strong = await runLab({ strong: true });
ok(strong.configChanged, "changing configuration changes the page");
ok(
  strong.cfgScore > weak.cfgScore,
  "a defensible configuration outscores a weak one",
  `(${strong.cfgScore} vs ${weak.cfgScore} of ${strong.cfgMax})`,
);
ok(
  strong.incScore > weak.incScore,
  "correct incident responses outscore wrong ones",
  `(${strong.incScore} vs ${weak.incScore} of ${strong.incMax})`,
);
ok(
  strong.cfgScore === strong.cfgMax,
  `a fully correct configuration scores full marks (${strong.cfgScore}/${strong.cfgMax})`,
);
ok(weak.incScore < 0, `wrong incident responses cost points (${weak.incScore})`);
ok(
  /Zero Trust Access Review/.test(strong.artifact),
  "artifact is the document this work produces in the real job",
);
ok(
  strong.artifact.includes("obo") || /On-behalf|identityFlow: obo/.test(strong.artifact),
  "artifact reflects the configuration that was actually run",
);

// ── Go / No-Go board: full four-phase walk ────────────────────────────────
console.log("\n--- go / no-go board runs four phases to a scored outcome ---");
await p.goto(`${B}/app/simulators/go-no-go`, { waitUntil: "networkidle" });
await p.waitForTimeout(300);
const idxText = await p.locator("body").innerText();
ok(/take the chair/i.test(idxText), "board index lists cases");
ok(!/^\s*$/.test(idxText) && /critical gaps/i.test(idxText), "cases show their shape");

await p.goto(`${B}/app/simulators/go-no-go/claims-triage-agent`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
await p.getByRole("button", { name: /review the evidence pack/i }).click();
await p.waitForTimeout(300);

// Request the three critical items.
const reqButtons = p.getByRole("button", { name: /^request$/i });
const reqCount = await reqButtons.count();
ok(reqCount > 3, `evidence pack offers ${reqCount} requestable items`);
for (let i = 0; i < 3; i++) {
  const btns = p.getByRole("button", { name: /^request$/i });
  if (!(await btns.count())) break;
  await btns.first().click();
  await p.waitForTimeout(150);
}
const afterReq = await p.locator("body").innerText();
ok(/Requests used: 3 \/ 3/.test(afterReq), "request budget enforced");
ok(
  (await p
    .getByRole("button", { name: /^request$/i })
    .first()
    .isDisabled()
    .catch(() => true)) !== false,
  "further requests blocked once the budget is spent",
);

await p.getByRole("button", { name: /take the decision/i }).click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: /go with conditions/i }).click();
await p.waitForTimeout(300);

const condText = await p.locator("body").innerText();
ok(/attach your conditions/i.test(condText), "conditions phase reached");
const condButtons = p
  .locator("button")
  .filter({ hasText: /Auto-decline disabled|Retrospective sample|Written Legal position/ });
for (let i = 0; i < (await condButtons.count()); i++) await condButtons.nth(i).click();
await p.getByRole("button", { name: /put it to the board/i }).click();
await p.waitForTimeout(300);

// Two challenges.
for (let i = 0; i < 2; i++) {
  const body = await p.locator("body").innerText();
  if (!/challenge \d of \d/i.test(body)) break;
  const opts = p
    .locator("button")
    .filter({ hasText: /Hold:|No — a low-value|Agree|Accept|Offer|Note that/ });
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

const boardText = await p.locator("body").innerText();
ok(/board outcome/i.test(boardText), "board reached an outcome");
ok(/\d+ \/ \d+ \(\d+%\)/.test(boardText), "outcome carries a score");
ok(
  /evidence/i.test(boardText) && /conditions/i.test(boardText) && /challenge/i.test(boardText),
  "outcome breaks the score down by dimension",
);
ok(/debrief/i.test(boardText), "debrief rendered");

// ── Flashcards: spaced repetition, not prev/next ──────────────────────────
console.log("\n--- flashcards schedule rather than paginate ---");
await p.goto(`${B}/app/flashcards`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
const fcText = await p.locator("body").innerText();
ok(/due now/i.test(fcText) && /not seen yet/i.test(fcText), "deck shows scheduling state");
ok(!/prev/i.test(fcText), "no prev/next pagination");

await p.getByRole("button", { name: /start \d+ new cards|review \d+ cards/i }).click();
await p.waitForTimeout(400);
ok(/card 1 of \d+/i.test(await p.locator("body").innerText()), "session started");

await p.getByRole("button", { name: /show answer/i }).click();
await p.waitForTimeout(250);
const revealed = await p.locator("body").innerText();
ok(/answer/i.test(revealed), "answer revealed");
const grades = ["Again", "Hard", "Good", "Easy"];
let gradesPresent = 0;
for (const g of grades) {
  if (await p.getByRole("button", { name: new RegExp(`^${g}`) }).count()) gradesPresent++;
}
ok(gradesPresent === 4, `all four grade buttons present (${gradesPresent}/4)`);

await p.getByRole("button", { name: /^Good/ }).click();
await p.waitForTimeout(300);
ok(/card 2 of \d+/i.test(await p.locator("body").innerText()), "grading advances the session");

// Scheduling must survive a reload — that is the whole point.
const persisted = await p.evaluate(() => localStorage.getItem("eai.srs.v1"));
ok(!!persisted && Object.keys(JSON.parse(persisted)).length > 0, "review state persisted");

// ── The two rebuilt simulators are simulators ─────────────────────────────
console.log("\n--- rebuilt simulator routes actually simulate ---");
for (const [url, mustHave] of [
  ["/app/simulators/saas-onboarding", /configuration|config/i],
  ["/app/simulators/in-house-app", /architecture review/i],
]) {
  await p.goto(B + url, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  const t = await p.locator("body").innerText();
  const hasRunner = (await p.getByRole("button", { name: /start|run|begin/i }).count()) > 0;
  ok(mustHave.test(t) && hasRunner, `${url} renders a runner`);
}

console.log("\n--- errors ---");
console.log(errs.length ? errs.slice(0, 6) : "none");
console.log(`\n${pass} passed, ${fail} failed, ${errs.length} console/page errors`);
await b.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
