import { createFileRoute } from "@tanstack/react-router";

import { PathCard } from "@/components/site/PathCard";
import { paths } from "@/content/paths";

export const Route = createFileRoute("/_site/paths")({
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
  const live = paths.filter((p) => p.status === "live");
  const roadmap = paths.filter((p) => p.status === "roadmap");

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
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Available now
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {live.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      </section>

      {roadmap.length > 0 && (
        <section className="mt-14">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            On the roadmap
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The structure is planned and the supporting material is being written. Listed here so
            you can see where this is heading, not to suggest it is ready.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((p) => (
              <PathCard key={p.id} path={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
