import { createFileRoute } from "@tanstack/react-router";

import { PathCard } from "@/components/site/PathCard";
import { paths } from "@/content/paths";

export const Route = createFileRoute("/_site/paths/")({
  head: () => ({
    meta: [
      { title: "Career paths — EAI Career Sim" },
      {
        name: "description",
        content:
          "Ordered routes through enterprise AI roles, labs, and scenarios: platform operations, security architecture, solution architecture, and governance.",
      },
    ],
  }),
  component: PathsPage,
});

function PathsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-balance">Career paths</h1>
        <p className="mt-4 text-lg text-muted-foreground text-pretty">
          Each path threads existing roles, labs, and scenarios into one route. Start anywhere —
          nothing is locked, and you can switch paths without losing progress.
        </p>
      </div>

      <section className="mt-12">
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
