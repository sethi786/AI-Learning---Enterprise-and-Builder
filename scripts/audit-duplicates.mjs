import { chromium } from "playwright";

/**
 * Duplicate content detector.
 *
 * Looks for the same visible text rendered more than once on a page — repeated
 * headings, repeated cards, repeated list items. These are almost always a data
 * problem (the same id mapped twice) or a layout problem (a section rendered by
 * both a parent and a child), and both read to a user as "this site is buggy".
 */

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext();
const p = await ctx.newPage();

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
        email: "auditor@example.com",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date(0).toISOString(),
      },
    }),
  );
  localStorage.setItem(
    "eai.prefs.v1",
    JSON.stringify({ level: "deep", oriented: true, goal: "building" }),
  );
});

const ROUTES = [
  "/",
  "/about",
  "/paths",
  "/paths/ai-solution-architecture",
  "/for/career-changers",
  "/app",
  "/app/start",
  "/app/glossary",
  "/app/careers",
  "/app/portfolio",
  "/app/career-path",
  "/app/competencies",
  "/app/learn/role",
  "/app/learn/platform",
  "/app/learn/scenario",
  "/app/roles/platform-admin",
  "/app/roles/solution-architect",
  "/app/roles/security-architect",
  "/app/roles/governance-operator",
  "/app/roles/grc-lead",
  "/app/platforms/m365-copilot",
  "/app/labs/rag",
  "/app/labs/iam",
  "/app/labs/ai-operations",
  "/app/lab-engine",
  "/app/lab-engine/zero-trust-access",
  "/app/simulators/go-no-go",
  "/app/simulators/in-house-app",
  "/app/simulators/saas-onboarding",
  "/app/exams",
  "/app/artifacts",
  "/app/flashcards",
  "/app/notes",
  "/app/my-runs",
];

let total = 0;
for (const route of ROUTES) {
  await p.goto(B + route, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(600);

  const dupes = await p.evaluate(() => {
    const out = [];

    // Repeated headings — the clearest signal a section renders twice.
    const heads = [...document.querySelectorAll("h1,h2,h3")]
      .map((e) => e.textContent?.trim())
      .filter((t) => t && t.length > 3);
    // A lab renders the same section labels once per module, which is correct.
    const PER_MODULE =
      /^(In plain English|What it means in an organisation|Technical deep dive|Common mistakes|Risks|Fixes|Evidence expected|Diagram|Configuration example|Insecure vs secure pattern|Quiz)/;
    const hc = {};
    for (const h of heads) if (!PER_MODULE.test(h)) hc[h] = (hc[h] ?? 0) + 1;
    for (const [text, n] of Object.entries(hc)) if (n > 1) out.push({ kind: "heading", text, n });

    // Repeated list items inside the same list — a data duplicate.
    for (const list of document.querySelectorAll("ul,ol")) {
      const items = [...list.querySelectorAll(":scope > li")]
        .map((e) => e.textContent?.trim())
        .filter((t) => t && t.length > 8);
      const lc = {};
      for (const i of items) lc[i] = (lc[i] ?? 0) + 1;
      for (const [text, n] of Object.entries(lc))
        if (n > 1) out.push({ kind: "list-item", text, n });
    }

    // Repeated card titles within one page.
    const cards = [...document.querySelectorAll("[data-slot=card]")]
      .map((c) => c.querySelector("[data-slot=card-title], h2, h3")?.textContent?.trim())
      .filter((t) => t && t.length > 3);
    const cc = {};
    for (const c of cards) cc[c] = (cc[c] ?? 0) + 1;
    for (const [text, n] of Object.entries(cc)) if (n > 1) out.push({ kind: "card", text, n });

    // The same text repeated immediately next to itself — the signature of a
    // visually-hidden label duplicating the visible one, which a screen reader
    // reads out twice.
    for (const el of document.querySelectorAll("dl, section, aside, header")) {
      const parts = (el.innerText ?? "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
      for (let i = 0; i + 2 < parts.length; i++) {
        if (parts[i].length > 4 && parts[i] === parts[i + 2]) {
          out.push({ kind: "echoed-label", text: parts[i], n: 2 });
        }
      }
    }

    // Repeated links to the same destination with the same label.
    const links = [...document.querySelectorAll("a[href]")]
      .map((a) => `${a.getAttribute("href")} :: ${a.textContent?.trim()}`)
      .filter((t) => t.split("::")[1]?.trim().length > 3);
    const kc = {};
    for (const l of links) kc[l] = (kc[l] ?? 0) + 1;
    // Several glossary terms legitimately point at the same lab, so only flag
    // a label repeated more than three times.
    for (const [text, n] of Object.entries(kc)) if (n > 3) out.push({ kind: "link", text, n });

    return out;
  });

  if (dupes.length) {
    console.log(`\n${route}`);
    for (const d of dupes) {
      console.log(`  [${d.kind} ×${d.n}] ${d.text.slice(0, 100).replace(/\s+/g, " ")}`);
      total++;
    }
  }
}

console.log(`\n${total} duplicate render(s) across ${ROUTES.length} routes`);
await b.close();
process.exit(total > 0 ? 1 : 0);
