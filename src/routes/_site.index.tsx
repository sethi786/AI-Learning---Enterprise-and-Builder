import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  ShieldAlert,
  Workflow,
} from "lucide-react";

import { PathCard } from "@/components/site/PathCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { livePaths, paths } from "@/content/paths";
import { labs } from "@/content/labs";
import { scenarios } from "@/content/scenarios";
import { artifactTemplates } from "@/content/artifacts";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "EAI Career Sim — Learn enterprise AI by doing the work" },
      {
        name: "description",
        content:
          "Hands-on training for the roles that make enterprise AI safe: platform admin, solution architect, security architect, and AI governance. Run real incidents in a simulator, not a slide deck.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Hero />
      <Proof />
      <HowItWorks />
      <Paths />
      <Audiences />
      <Faq />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b bg-gradient-to-b from-brand-muted/60 to-background">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-brand/30 bg-brand/10 text-brand hover:bg-brand/10"
          >
            Enterprise AI career training
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Learn enterprise AI by doing the work
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Most AI courses teach you to write prompts. This one teaches you to run the systems —
            configure the platform, break the RAG pipeline, contain the incident, and defend the
            decision in review.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link to="/app">
                Start learning free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <Link to="/paths">Browse career paths</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            No account required. Sign in only when you want progress saved.
          </p>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  // Counted from the content modules so these numbers can't drift into fiction.
  const stats = [
    { value: livePaths.length, label: "Career paths" },
    { value: scenarios.length, label: "Decision scenarios" },
    { value: labs.filter((l) => l.depth === "deep").length, label: "In-depth labs" },
    { value: artifactTemplates.length, label: "Artifact templates" },
  ];
  return (
    <section className="border-b">
      {/* Dividers via `divide-*`, not a bg-colour showing through gaps — the
          latter bleeds into the container's horizontal padding. */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-8 text-center">
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: ShieldAlert,
    title: "Run a real incident",
    body: "A poisoned document reaches your RAG index and the agent emails a salary review to all-hands. Sixteen stages: diagnose it, contain it, redesign the architecture, then answer for it.",
    to: "/app/scenarios/rag-ticket-agent",
    cta: "Open the simulator",
  },
  {
    icon: FlaskConical,
    title: "Configure, then get attacked",
    body: "The lab engine scores the system you actually built. Set your controls, start the run, and watch injected failures find every gap you left open.",
    to: "/app/lab-engine",
    cta: "Open the lab engine",
  },
  {
    icon: ClipboardCheck,
    title: "Produce the paperwork",
    body: "Security assessments, privacy impact assessments, threat models, go/no-go memos. The artifacts a real review demands, drafted from your own decisions.",
    to: "/app/artifacts",
    cta: "Open the builder",
  },
  {
    icon: Workflow,
    title: "Decide under pressure",
    body: "Scenarios put you in the meeting: classify the request, pick reviewers, weigh the risk, and commit to a decision you have to justify.",
    to: "/app/learn/scenario",
    cta: "Browse scenarios",
  },
] as const;

function HowItWorks() {
  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance">
            Practice the job, not the vocabulary
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty">
            Every surface here is interactive and scored. Nothing is a video.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="flex flex-col">
              <CardHeader>
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-md border border-brand/30 bg-brand/15">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold leading-none tracking-tight">{f.title}</h3>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <Link
                  to={f.to}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  {f.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Paths() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance">Pick a career path</h2>
            <p className="mt-4 text-muted-foreground text-pretty">
              Each path is an ordered route through roles, labs, and scenarios. Paths still being
              written are labelled — we would rather show you the map than pretend it is finished.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/paths">See all paths</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paths.slice(0, 6).map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

const audiences = [
  {
    audience: "students",
    icon: GraduationCap,
    title: "Students",
    body: "Graduate knowing what an enterprise actually asks of an AI hire — and with artifacts you can show.",
  },
  {
    audience: "career-changers",
    icon: ArrowRight,
    title: "Career changers",
    body: "Already technical, new to AI? Start from the role you want and work backwards to the skills.",
  },
  {
    audience: "professionals",
    icon: ShieldAlert,
    title: "Professionals",
    body: "Architects, security, and GRC leads who now own AI systems and need the depth fast.",
  },
] as const;

function Audiences() {
  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
          Built for three kinds of learner
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {audiences.map((a) => (
            <Link
              key={a.title}
              to="/for/$audience"
              params={{ audience: a.audience }}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-brand/50">
                <CardHeader>
                  <a.icon className="mb-3 h-6 w-6 text-brand" />
                  <h3 className="font-semibold leading-none tracking-tight">{a.title}</h3>
                  <CardDescription className="pt-1.5">{a.body}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Do I need an account?",
    a: "No. Every lesson, lab, scenario, and simulator is open — no sign-up wall. Progress is saved in your browser. Signing in only adds syncing across devices.",
  },
  {
    q: "Is this for beginners or practitioners?",
    a: "Both, but it assumes general technical literacy. Every lesson is written in three tiers — plain explanation, enterprise context, and technical deep dive — so you can enter where you are.",
  },
  {
    q: "How finished is the content?",
    a: "Some paths are deep and some are still being written, and the site labels which is which. The security architecture and platform operations tracks are the most complete today.",
  },
  {
    q: "Is any of this connected to real systems?",
    a: "No. Everything is simulated. The artifacts you produce are marked as practice material and no real credentials, client data, or approvals are ever involved.",
  },
] as const;

function Faq() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
          Questions people ask first
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-xl border bg-gradient-to-br from-brand-muted/70 to-background px-6 py-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance">
            Open the portal and start with an incident
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-pretty">
            The RAG and ticket-agent simulator is the fastest way to see whether this is for you. It
            takes about an hour and it does not go easy on you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link to="/app/scenarios/rag-ticket-agent">
                Run the simulator <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <Link to="/app">Go to the portal</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
