import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labsById } from "@/content/labs";

export const Route = createFileRoute("/simulators/saas-onboarding")({
  head: () => ({
    meta: [
      { title: "SaaS AI Onboarding Simulator" },
      {
        name: "description",
        content: "Onboard SaaS AI tools with admin, security, privacy, legal, ops, and FinOps.",
      },
    ],
  }),
  component: () => {
    const lab = labsById["saas-onboarding"]!;
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="SaaS AI Onboarding Simulator"
          subtitle="Onboard ChatGPT Enterprise, Copilot, Gemini, Claude, Replit, Codex — end-to-end."
          right={
            <Button asChild>
              <Link to="/labs/$labId" params={{ labId: "saas-onboarding" }}>
                Open full lab
              </Link>
            </Button>
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          {lab.modules.map((m) => (
            <Card key={m.id} className="hover:border-primary/50">
              <CardHeader>
                <CardTitle className="text-base">{m.title}</CardTitle>
                <CardDescription className="line-clamp-2">{m.lesson.enterprise}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline">
                  <Link to="/labs/$labId" params={{ labId: "saas-onboarding" }} hash={m.id}>
                    Open module
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  },
});
