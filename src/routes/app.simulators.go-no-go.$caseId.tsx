import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { GoNoGoBoard } from "@/components/learning/GoNoGoBoard";
import { Button } from "@/components/ui/button";
import { goNoGoCasesById } from "@/content/goNoGo";
import type { GoNoGoCase } from "@/content/goNoGo";

export const Route = createFileRoute("/app/simulators/go-no-go/$caseId")({
  // Ids only. The case object is plain data today, but returning it would make
  // this route quietly break the first time a scoring closure is added to it.
  loader: ({ params }) => {
    const board = goNoGoCasesById[params.caseId];
    if (!board) throw notFound();
    return { caseId: params.caseId, title: board.title, summary: board.summary };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.title} — Go / No-Go Board` },
            { name: "description", content: loaderData.summary },
          ],
        }
      : { meta: [{ title: "Go / No-Go Board" }] },
  component: GoNoGoCasePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-6 text-sm">
      Case not found.{" "}
      <Link to="/app/simulators/go-no-go" className="underline">
        Back to the board
      </Link>
      .
    </div>
  ),
});

function GoNoGoCasePage() {
  const { caseId } = Route.useLoaderData();
  const board = goNoGoCasesById[caseId] as GoNoGoCase;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
        <Link to="/app/simulators/go-no-go">
          <ChevronLeft className="h-4 w-4" /> All board cases
        </Link>
      </Button>
      <PageHeader title={board.title} subtitle={board.summary} />
      <GoNoGoBoard board={board} />
    </div>
  );
}
