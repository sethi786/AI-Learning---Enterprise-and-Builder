import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { PathDef } from "@/content/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export function PathCard({ path }: { path: PathDef }) {
  const roadmap = path.status === "roadmap";
  return (
    <Card className={roadmap ? "border-dashed" : "transition-colors hover:border-brand/50"}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          {/* A real <h3>: this Card's CardTitle renders a div, which would
              leave the marketing pages without a heading outline. */}
          <h3 className="text-base font-semibold leading-none tracking-tight">{path.name}</h3>
          {roadmap ? (
            <Badge variant="outline" className="shrink-0 text-muted-foreground">
              In development
            </Badge>
          ) : (
            <Badge className="shrink-0 border-brand/30 bg-brand/15 text-brand hover:bg-brand/15">
              Available
            </Badge>
          )}
        </div>
        <CardDescription>{path.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{path.summary}</p>
        {roadmap ? (
          <p className="text-xs text-muted-foreground">
            Outline published. Lessons are still being written.
          </p>
        ) : (
          <Link
            to="/paths/$pathId"
            params={{ pathId: path.id }}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Explore this path <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
