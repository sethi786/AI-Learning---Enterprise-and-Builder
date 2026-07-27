import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PathCard } from "@/components/site/PathCard";
import { Button } from "@/components/ui/button";
import { paths } from "@/content/paths";
import type { Audience } from "@/content/types";

type Pitch = {
  audience: Audience;
  title: string;
  lede: string;
  points: { heading: string; body: string }[];
};

const pitches: Record<string, Pitch> = {
  students: {
    audience: "student",
    title: "For students",
    lede: "Coursework teaches you how models work. Employers ask whether you can be trusted to deploy one. This closes that gap.",
    points: [
      {
        heading: "Graduate with evidence, not just grades",
        body: "Every lab and scenario ends in an artifact — a threat model, a privacy assessment, a go/no-go memo. Those are the documents an interviewer can actually read.",
      },
      {
        heading: "Meet the roles before you apply to them",
        body: "Each role path shows what the job owns day to day, which meetings it sits in, and which decisions land on its desk. Choose a direction with real information.",
      },
      {
        heading: "Start from zero cost and zero commitment",
        body: "No account, no trial, no card. Open a lab and begin; progress saves in your browser.",
      },
    ],
  },
  "career-changers": {
    audience: "career-changer",
    title: "For career changers",
    lede: "You already know how to build or secure software. You need the AI-specific judgement, and you need it without repeating a degree.",
    points: [
      {
        heading: "Work backwards from the role you want",
        body: "Pick the target job, then follow the labs and scenarios that role actually depends on. No survey of the whole field before you can start.",
      },
      {
        heading: "Transfer what you already have",
        body: "Identity, network segmentation, least privilege, change control — your existing instincts mostly carry over. The material shows you exactly where AI systems break those assumptions.",
      },
      {
        heading: "Practise the interview questions",
        body: "Scenarios are structured like review boards: classify the request, name the risks, choose controls, and defend the call.",
      },
    ],
  },
  professionals: {
    audience: "professional",
    title: "For practising professionals",
    lede: "You have been handed responsibility for AI systems you did not design, and the depth has to come quickly.",
    points: [
      {
        heading: "Skip the fundamentals you already own",
        body: "Every lesson is layered — plain explanation, enterprise context, technical deep dive. Drop straight to the depth you need and move on.",
      },
      {
        heading: "Rehearse the incident before it happens",
        body: "The flagship simulator runs a full indirect prompt-injection incident: diagnosis, containment, architectural remediation, and a security assessment review afterwards.",
      },
      {
        heading: "Leave with reusable artifacts",
        body: "Fifteen templates covering intake, architecture, threat modelling, privacy, and approval — adaptable to your own governance process.",
      },
    ],
  },
};

export const Route = createFileRoute("/_site/for/$audience")({
  loader: ({ params }) => {
    const pitch = pitches[params.audience];
    if (!pitch) throw notFound();
    return { pitch };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.pitch.title} — EAI Career Sim` },
            { name: "description", content: loaderData.pitch.lede },
          ],
        }
      : { meta: [{ title: "EAI Career Sim" }] },
  component: AudiencePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Button asChild className="mt-6">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  ),
});

function AudiencePage() {
  const { pitch } = Route.useLoaderData();
  const relevant = paths.filter((p) => p.audiences.includes(pitch.audience));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-balance">{pitch.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
          {pitch.lede}
        </p>
      </header>

      <section className="mt-14 grid gap-8 md:grid-cols-3">
        {pitch.points.map((p) => (
          <div key={p.heading}>
            <h2 className="font-semibold tracking-tight">{p.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">Paths suited to you</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {relevant.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/app">
            Start learning <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/paths">Compare all paths</Link>
        </Button>
      </div>
    </div>
  );
}
