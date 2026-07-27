import { artifactsById } from "@/content/artifacts";
import { examsById } from "@/content/exams";
import { getLabBlueprint } from "@/content/labEngine";
import { labsById } from "@/content/labs";
import { platformsById } from "@/content/platforms";
import { rolesById } from "@/content/roles";
import { scenariosById } from "@/content/scenarios";

export type PlaceDescription = { title: string; kind: string };

const STATIC: Record<string, PlaceDescription> = {
  "/app/career-path": { title: "Career Path Map", kind: "Overview" },
  "/app/competencies": { title: "Competency Heatmap", kind: "Overview" },
  "/app/learn/role": { title: "Learn by Role", kind: "Catalogue" },
  "/app/learn/platform": { title: "Learn by Platform", kind: "Catalogue" },
  "/app/learn/scenario": { title: "Learn by Scenario", kind: "Catalogue" },
  "/app/lab-engine": { title: "Lab Engine", kind: "Simulator" },
  "/app/simulators/saas-onboarding": { title: "SaaS AI Onboarding", kind: "Simulator" },
  "/app/simulators/in-house-app": { title: "In-House AI App", kind: "Simulator" },
  "/app/simulators/env": { title: "AI Lab → Prod", kind: "Simulator" },
  "/app/simulators/go-no-go": { title: "Go / No-Go", kind: "Simulator" },
  "/app/scenarios/rag-ticket-agent": { title: "RAG + Ticket Agent", kind: "Simulator" },
  "/app/flashcards": { title: "Flashcards", kind: "Practice" },
  "/app/exams": { title: "Practice Exams", kind: "Practice" },
  "/app/artifacts": { title: "Artifact Builder", kind: "Practice" },
  "/app/notes": { title: "My Learning Notes", kind: "Practice" },
  "/app/my-runs": { title: "My Runs", kind: "Practice" },
};

const DYNAMIC: { prefix: string; kind: string; lookup: (id: string) => string | undefined }[] = [
  { prefix: "/app/labs/", kind: "Lab", lookup: (id) => labsById[id]?.name },
  { prefix: "/app/roles/", kind: "Role", lookup: (id) => rolesById[id]?.name },
  { prefix: "/app/platforms/", kind: "Platform", lookup: (id) => platformsById[id]?.name },
  { prefix: "/app/scenarios/", kind: "Scenario", lookup: (id) => scenariosById[id]?.title },
  { prefix: "/app/exams/", kind: "Exam", lookup: (id) => examsById[id]?.name },
  { prefix: "/app/artifacts/", kind: "Artifact", lookup: (id) => artifactsById[id]?.name },
  { prefix: "/app/lab-engine/", kind: "Lab", lookup: (id) => getLabBlueprint(id)?.name },
];

/**
 * Turn a stored pathname back into something worth showing a learner.
 *
 * Returns null for anything unrecognised — the dashboard would rather show
 * nothing than a raw URL, and this keeps deleted content from resurfacing as a
 * dead "continue" link.
 */
export function describePath(path: string): PlaceDescription | null {
  if (STATIC[path]) return STATIC[path];
  for (const d of DYNAMIC) {
    if (path.startsWith(d.prefix)) {
      const id = path.slice(d.prefix.length);
      if (!id || id.includes("/")) continue;
      const title = d.lookup(id);
      if (title) return { title, kind: d.kind };
    }
  }
  return null;
}

/** The most recent recognisable place, excluding the dashboard itself. */
export function findResume(
  lastVisited: string[],
): { path: string; place: PlaceDescription } | null {
  for (const path of lastVisited) {
    if (path === "/app" || path === "/app/") continue;
    const place = describePath(path);
    if (place) return { path, place };
  }
  return null;
}
