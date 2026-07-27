/**
 * Captures real product screenshots for the marketing site.
 *
 * The landing page's whole claim is "every surface here is interactive and
 * scored" — so it should show the actual product rather than stock graphics.
 * These are generated from the running app, which also means they can never
 * drift into showing something the product doesn't do.
 *
 * Usage: start the dev server, then `node scripts/capture-shots.mjs`
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const OUT = "public/shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2, // retina — these get displayed at ~700px wide
});

// Viewport-sized crops, not full-page: several of these surfaces are 7000px+
// tall, which is unusable as an inline marketing image.
const shoot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("captured", name);
};

// 1. The flagship simulator, canvas populated so the topology is legible.
await page.goto(`${BASE}/app/scenarios/rag-ticket-agent`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
for (const kind of ["idp", "monitoring", "firewall", "secretvault"]) {
  const btn = page.getByRole("button", { name: new RegExp(`^\\+ ${kind}$`) });
  if (await btn.count()) {
    await btn.first().click();
    await page.waitForTimeout(120);
  }
}
await page.waitForTimeout(600);
await shoot("simulator");

// 2. Lab engine mid-run: config on the left, live rubric on the right.
await page.goto(`${BASE}/app/lab-engine/rag-onboarding`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await shoot("lab-engine");

// 3. Artifact builder with the markdown preview populated.
await page.goto(`${BASE}/app/artifacts/sar`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const inputs = page.locator("main input[type=text], main textarea");
const n = Math.min(await inputs.count(), 4);
for (let i = 0; i < n; i++) {
  await inputs
    .nth(i)
    .fill(
      [
        "RAG assistant over Legal SharePoint",
        "Indirect prompt injection via ingested documents",
        "Query-time ACL enforcement, retrieval sanitisation, tool-call isolation",
        "Residual risk accepted for UAT with reviewer sign-off",
      ][i] ?? "Practice entry",
    )
    .catch(() => {});
  await page.waitForTimeout(120);
}
await page.waitForTimeout(500);
await shoot("artifacts");

// 4. Scenario decision flow.
await page.goto(`${BASE}/app/scenarios/sc-prompt-injection-rag`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await shoot("scenario");

// 5. Competency heatmap.
await page.goto(`${BASE}/app/competencies`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await shoot("competencies");

await browser.close();
console.log("done →", OUT);
