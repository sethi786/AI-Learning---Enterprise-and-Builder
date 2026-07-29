import { chromium } from "playwright";

/**
 * Full-application audit.
 *
 * Crawls every route, checks each one renders real content, has a title and a
 * description, exposes no dead links, and contains no leftover placeholder
 * language. Reports rather than asserts — this is a survey, not a gate.
 */

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });

// The portal is gated. Without a session every /app row would report as an
// auth redirect rather than as the page being audited.
await p.goto(B + "/", { waitUntil: "domcontentloaded" });
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
});

const errs = [];
p.on("pageerror", (e) => errs.push(`${page}: pageerror ${String(e).slice(0, 120)}`));
p.on("console", (m) => {
  if (m.type() === "error") errs.push(`${page}: console ${m.text().slice(0, 120)}`);
});
let page = "";

const ROUTES = [
  "/",
  "/about",
  "/paths",
  "/paths/ai-security-architecture",
  "/for/career-changers",
  "/auth",
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
  "/app/platforms/m365-copilot",
  "/app/labs/rag",
  "/app/labs/iam",
  "/app/labs/devsecops",
  "/app/lab-engine",
  "/app/lab-engine/zero-trust-access",
  "/app/scenarios/rag-ticket-agent",
  "/app/scenarios/sc-prompt-injection-rag",
  "/app/simulators/saas-onboarding",
  "/app/simulators/in-house-app",
  "/app/simulators/env",
  "/app/simulators/go-no-go",
  "/app/simulators/go-no-go/claims-triage-agent",
  "/app/flashcards",
  "/app/exams",
  "/app/exams/security-architect",
  "/app/artifacts",
  "/app/artifacts/sar",
  "/app/notes",
  "/app/my-runs",
];

const PLACEHOLDER = [
  "coming soon",
  "lorem ipsum",
  "TODO",
  "TBD",
  "placeholder",
  "not yet implemented",
  "under construction",
  "sample exam",
  "fill in identity",
];

const rows = [];
const allLinks = new Map();

for (const route of ROUTES) {
  page = route;
  const res = await p
    .goto(B + route, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => null);
  await p.waitForTimeout(400);
  const text = await p
    .locator("body")
    .innerText()
    .catch(() => "");
  const title = await p.title();
  const desc = await p
    .locator('meta[name="description"]')
    .getAttribute("content")
    .catch(() => null);
  const h1 = await p.locator("h1").count();
  const found = PLACEHOLDER.filter((ph) => text.toLowerCase().includes(ph.toLowerCase()));

  const links = await p.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")));
  for (const l of links) {
    const clean = l.split("#")[0];
    if (clean) allLinks.set(clean, (allLinks.get(clean) ?? 0) + 1);
  }

  rows.push({
    route,
    status: res?.status() ?? 0,
    chars: text.length,
    title: title.length > 0 && title !== "EAI Career Sim" ? "ok" : "GENERIC",
    desc: desc ? "ok" : "MISSING",
    h1: h1 > 0 ? "ok" : "NONE",
    placeholder: found.length ? found.join(",") : "",
  });
}

console.log(
  "route".padEnd(46),
  "chars".padStart(6),
  "title".padStart(8),
  "desc".padStart(8),
  "h1".padStart(5),
  " placeholder",
);
for (const r of rows) {
  const flag = r.chars < 400 ? " ← THIN" : "";
  console.log(
    r.route.padEnd(46),
    String(r.chars).padStart(6),
    r.title.padStart(8),
    r.desc.padStart(8),
    r.h1.padStart(5),
    " " + r.placeholder + flag,
  );
}

console.log("\n--- link targets that 404 ---");
let dead = 0;
for (const href of [...allLinks.keys()].sort()) {
  if (href.startsWith("//") || href.includes("$")) continue;
  const r = await p
    .goto(B + href, { waitUntil: "domcontentloaded", timeout: 10000 })
    .catch(() => null);
  const t = await p
    .locator("body")
    .innerText()
    .catch(() => "");
  if (!r || r.status() >= 400 || /not found/i.test(t.slice(0, 400))) {
    console.log("DEAD", href, `(linked ${allLinks.get(href)}×)`);
    dead++;
  }
}
console.log(dead === 0 ? "none" : `${dead} dead link targets`);

console.log("\n--- summary ---");
console.log(`routes crawled: ${rows.length}`);
console.log(
  `thin (<400 chars): ${
    rows
      .filter((r) => r.chars < 400)
      .map((r) => r.route)
      .join(", ") || "none"
  }`,
);
console.log(
  `missing description: ${
    rows
      .filter((r) => r.desc === "MISSING")
      .map((r) => r.route)
      .join(", ") || "none"
  }`,
);
console.log(
  `generic title: ${
    rows
      .filter((r) => r.title === "GENERIC")
      .map((r) => r.route)
      .join(", ") || "none"
  }`,
);
console.log(
  `no h1: ${
    rows
      .filter((r) => r.h1 === "NONE")
      .map((r) => r.route)
      .join(", ") || "none"
  }`,
);
console.log(
  `placeholder text: ${
    rows
      .filter((r) => r.placeholder)
      .map((r) => r.route)
      .join(", ") || "none"
  }`,
);
console.log(`console/page errors: ${errs.length ? errs.slice(0, 8).join(" | ") : "none"}`);

await b.close();
