import { chromium } from "playwright";

/**
 * The auth gate.
 *
 * Checks both directions, because a gate that only blocks is half a feature:
 * signed-out learners must be redirected and told why, and signed-in learners
 * must reach the portal without a flicker or a loop.
 */

const B = process.env.BASE_URL ?? "http://127.0.0.1:5199";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

let pass = 0,
  fail = 0;
const ok = (c, label, extra = "") => {
  c ? pass++ : fail++;
  console.log(c ? "PASS" : "FAIL", label, extra);
};

// ── Signed out: every portal route redirects to sign-in ───────────────────
console.log("--- signed out ---");
const ctx = await b.newContext();
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 140)));
p.on("console", (m) => {
  if (m.type() === "error") errs.push(m.text().slice(0, 140));
});

const GATED = [
  "/app",
  "/app/start",
  "/app/glossary",
  "/app/careers",
  "/app/portfolio",
  "/app/labs/rag",
  "/app/lab-engine/zero-trust-access",
  "/app/flashcards",
  "/app/exams",
  "/app/artifacts",
  "/app/notes",
  "/app/simulators/go-no-go/claims-triage-agent",
];
// Warm the dev server first: a cold route spends its first second compiling,
// which reads as "not gated" without being anything of the sort.
await p.goto(B + "/app", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
await p.waitForTimeout(2500);

let redirected = 0;
for (const route of GATED) {
  await p.goto(B + route, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(1800);
  if (new URL(p.url()).pathname === "/auth") redirected++;
  else console.log("   not gated:", route, "->", p.url());
}
ok(redirected === GATED.length, `every portal route is gated (${redirected}/${GATED.length})`);

// The redirect is not instant — the session check is async — so the window
// before it lands must show a holding state, never portal content.
await p
  .goto(B + "/app/labs/rag", { waitUntil: "domcontentloaded", timeout: 30000 })
  .catch(() => {});
await p.waitForTimeout(150);
const midFlight = await p
  .locator("body")
  .innerText()
  .catch(() => "");
ok(
  !/RAG Architecture Lab|Technical deep dive|Module 1/i.test(midFlight),
  "no portal content is visible while the session is still being checked",
  midFlight.slice(0, 60).replace(/\n/g, " "),
);

// The deep link must survive so sign-in returns you where you were going.
await p
  .goto(B + "/app/labs/iam", { waitUntil: "domcontentloaded", timeout: 20000 })
  .catch(() => {});
await p.waitForTimeout(800);
const u = new URL(p.url());
ok(u.pathname === "/auth", "deep link into a lab redirects to sign-in");
ok(
  (u.searchParams.get("next") ?? "").includes("/app/labs/iam"),
  "the destination is preserved for after sign-in",
  `(next=${u.searchParams.get("next")})`,
);
// The loop this replaced produced next=/auth?next=/auth?next=…
ok(!(u.searchParams.get("next") ?? "").includes("/auth"), "no self-referential redirect");

const authText = await p.locator("body").innerText();
ok(/sign in/i.test(authText), "sign-in page renders");
ok(/continue with google/i.test(authText), "Google sign-in is offered");
ok(/create account/i.test(authText), "creating an account is offered");
ok(errs.length === 0, "no render loop or console errors", errs.slice(0, 2).join(" | "));

// ── Public pages stay open ────────────────────────────────────────────────
console.log("\n--- public pages remain reachable signed out ---");
let open = 0;
const PUBLIC = ["/", "/about", "/paths", "/paths/ai-security-architecture", "/for/leaders"];
for (const route of PUBLIC) {
  await p.goto(B + route, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(400);
  const t = await p
    .locator("body")
    .innerText()
    .catch(() => "");
  if (new URL(p.url()).pathname === route && t.length > 300) open++;
  else console.log("   blocked or thin:", route, t.length);
}
ok(open === PUBLIC.length, `public pages open without an account (${open}/${PUBLIC.length})`);

const home = await (async () => {
  await p.goto(B + "/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(300);
  return p.locator("body").innerText();
})();
ok(!/no account required/i.test(home), "the site no longer promises no account is required");

// ── Signed in: the portal renders, once, with no loop ─────────────────────
console.log("\n--- signed in (stubbed session) ---");
const ctx2 = await b.newContext();
const p2 = await ctx2.newPage();
const errs2 = [];
p2.on("pageerror", (e) => errs2.push(String(e).slice(0, 140)));
p2.on("console", (m) => {
  if (m.type() === "error") errs2.push(m.text().slice(0, 140));
});

// Supabase keeps its session in localStorage under sb-<ref>-auth-token. Writing
// a far-future token makes getSession() resolve to a user without a network
// round trip, which is what the gate reads.
await p2.goto(B + "/", { waitUntil: "domcontentloaded" });
await p2.evaluate(() => {
  const key = Object.keys(localStorage).find(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
  );
  const ref = key ?? "sb-kbxeefyitsgurcldzxgs-auth-token";
  const user = {
    id: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "learner@example.com",
    app_metadata: {},
    user_metadata: { display_name: "Test Learner" },
    created_at: new Date(0).toISOString(),
  };
  localStorage.setItem(
    ref,
    JSON.stringify({
      access_token: "stub",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "stub",
      user,
    }),
  );
});

let reached = 0;
for (const route of ["/app", "/app/glossary", "/app/careers", "/app/labs/rag", "/app/flashcards"]) {
  await p2.goto(B + route, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await p2.waitForTimeout(900);
  const t = await p2
    .locator("body")
    .innerText()
    .catch(() => "");
  if (new URL(p2.url()).pathname === route && t.length > 500) reached++;
  else console.log("   not reached:", route, new URL(p2.url()).pathname, t.length);
}
ok(reached === 5, `a signed-in learner reaches the portal (${reached}/5)`);
ok(
  !errs2.some((e) => /Maximum update depth/i.test(e)),
  "no render loop when signed in",
  errs2.filter((e) => /Maximum update/i.test(e))[0] ?? "",
);
ok(errs2.length === 0, "no console errors signed in", errs2.slice(0, 2).join(" | "));

console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail > 0 ? 1 : 0);
