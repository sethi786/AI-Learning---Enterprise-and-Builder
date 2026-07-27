import { Badge } from "@/components/ui/badge";

/**
 * Content in this app is either fully authored or still an outline, tracked by
 * the `depth` field on roles, platforms, labs, and exams.
 *
 * The catalogues used to surface this as "Scaffold", which is internal jargon —
 * it tells a learner nothing about whether opening the page is worth their
 * time. "In development" does.
 */
export function DepthBadge({
  depth,
  deepLabel = "In depth",
}: {
  depth: "deep" | "scaffold";
  deepLabel?: string;
}) {
  if (depth === "deep") return <Badge variant="secondary">{deepLabel}</Badge>;
  return (
    <Badge variant="outline" className="text-muted-foreground">
      In development
    </Badge>
  );
}
