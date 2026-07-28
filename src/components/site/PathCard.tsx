import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { PathDef } from "@/content/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export function PathCard({ path }: { path: PathDef }) {
  return (
    <Card className="lift h-full shadow-card transition-colors hover:border-brand/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          {/* A real <h3>: this Card's CardTitle renders a div, which would
              leave the marketing pages without a heading outline. */}
          <h3 className="text-base font-semibold leading-none tracking-tight">{path.name}</h3>
          {/* A count, not a status. Every path is now live, so a status badge
              would say the same thing on every card and carry no information. */}
          <Badge className="shrink-0 border-brand/30 bg-brand/15 text-brand hover:bg-brand/15">
            {path.labIds.length} labs
          </Badge>
        </div>
        <CardDescription>{path.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{path.summary}</p>
        <Link
          to="/paths/$pathId"
          params={{ pathId: path.id }}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          Explore this path <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
