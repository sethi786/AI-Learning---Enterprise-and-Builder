import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Shipped marketing images.
 *
 * The landing page claims to show the real product. It once shipped five
 * "different" screenshots that were five byte-identical pictures of the sign-in
 * page: gating the portal made the capture script redirect, and nobody looked
 * at the output. These assert the files on disk are what they claim to be.
 */

const SHOTS = "public/shots";

describe("marketing screenshots", () => {
  const files = readdirSync(SHOTS).filter((f) => f.endsWith(".png"));

  it("exist for every image the landing page references", () => {
    const site = readFileSync("src/routes/_site.index.tsx", "utf8");
    const referenced = [...site.matchAll(/\/shots\/([\w-]+\.png)/g)].map((m) => m[1]);
    expect(referenced.length).toBeGreaterThan(0);
    for (const r of referenced) {
      expect(files, `${r} is referenced but not in ${SHOTS}`).toContain(r);
    }
  });

  it("are all different images", () => {
    const byHash = new Map<string, string>();
    const dupes: string[] = [];
    for (const f of files) {
      const hash = createHash("sha256")
        .update(readFileSync(join(SHOTS, f)))
        .digest("hex");
      const prev = byHash.get(hash);
      if (prev) dupes.push(`${f} is byte-identical to ${prev}`);
      else byHash.set(hash, f);
    }
    expect(dupes).toEqual([]);
  });

  it("are large enough to be a real screenshot rather than an error page", () => {
    // A redirect to the sign-in form produced a much smaller, near-empty image.
    for (const f of files) {
      expect(statSync(join(SHOTS, f)).size, `${f} looks too small`).toBeGreaterThan(150_000);
    }
  });
});
