import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, DiagramBlock } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/simulators/in-house-app")({
  head: () => ({ meta: [{ title: "In-House AI App Simulator" }, { name: "description", content: "Design an in-house AI app across all domains." }] }),
  component: Sim,
});

type Choices = {
  platform: "azure" | "vertex" | "bedrock";
  pattern: "rag" | "agent" | "coding" | "chat";
  identity: "obo" | "service" | "apikey";
  data: "public" | "internal" | "confidential" | "regulated";
  env: "dev" | "uat" | "pilot" | "prod";
};

function score(c: Choices) {
  const issues: string[] = [];
  const good: string[] = [];
  if (c.identity === "obo") good.push("On-Behalf-Of preserves per-user permissions to the data source.");
  else if (c.identity === "service") issues.push("Shared service account bypasses per-user permission trimming.");
  else issues.push("API-key-per-user is a secret-sprawl risk; prefer OBO.");
  if (c.pattern === "agent" && c.env === "prod") issues.push("Agents in production require kill switch, HITL, and audit — do not ship straight to prod.");
  if (c.data === "regulated" && c.env !== "dev") issues.push("Regulated data requires QRM/Legal sign-off before UAT.");
  if (c.platform === "azure") good.push("Azure AI Foundry with private endpoints + managed identity is a common enterprise pattern.");
  if (c.platform === "bedrock" && c.pattern === "rag") good.push("Bedrock Knowledge Bases handle chunking + retrieval; still confirm ACL enforcement.");
  if (c.pattern === "rag") good.push("RAG needs permission trimming in the index query, not just the UI.");
  return { issues, good };
}

function Sim() {
  const [c, setC] = useState<Choices>({ platform: "azure", pattern: "rag", identity: "obo", data: "confidential", env: "uat" });
  const s = useMemo(() => score(c), [c]);
  const diagram = useMemo(
    () => `User (Entra token)\n  --> API Gateway\n    --> Orchestrator (${c.identity === "obo" ? "OBO" : c.identity === "service" ? "Managed Identity — shared" : "API key"})\n      --> Model (${c.platform === "azure" ? "Azure OpenAI" : c.platform === "vertex" ? "Vertex" : "Bedrock"} — private endpoint)\n      --> Data (${c.pattern === "rag" ? "Vector Store + security trim" : c.pattern === "agent" ? "Tools (allowlist)" : "Model only"})\n      --> Logs -> SIEM`,
    [c],
  );
  const set = <K extends keyof Choices>(k: K, v: Choices[K]) => setC((p) => ({ ...p, [k]: v }));
  const btn = (active: boolean): "default" | "outline" => (active ? "default" : "outline");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="In-House AI App Simulator" subtitle="Make decisions and see the technical + governance consequences." />
      <Card>
        <CardHeader><CardTitle className="text-base">Choices</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1"><div className="text-xs uppercase text-muted-foreground">Cloud AI platform</div><div className="flex flex-wrap gap-2">
            {(["azure","vertex","bedrock"] as const).map((v) => (
              <Button key={v} variant={btn(c.platform===v)} size="sm" onClick={() => set("platform", v)}>{v === "azure" ? "Azure AI Foundry" : v === "vertex" ? "Vertex AI" : "AWS Bedrock"}</Button>
            ))}
          </div></div>
          <div className="space-y-1"><div className="text-xs uppercase text-muted-foreground">Pattern</div><div className="flex flex-wrap gap-2">
            {(["rag","agent","coding","chat"] as const).map((v) => (
              <Button key={v} variant={btn(c.pattern===v)} size="sm" onClick={() => set("pattern", v)}>{v}</Button>
            ))}
          </div></div>
          <div className="space-y-1"><div className="text-xs uppercase text-muted-foreground">Identity model</div><div className="flex flex-wrap gap-2">
            {(["obo","service","apikey"] as const).map((v) => (
              <Button key={v} variant={btn(c.identity===v)} size="sm" onClick={() => set("identity", v)}>{v === "obo" ? "On-Behalf-Of" : v === "service" ? "Service account" : "API key per user"}</Button>
            ))}
          </div></div>
          <div className="space-y-1"><div className="text-xs uppercase text-muted-foreground">Data classification</div><div className="flex flex-wrap gap-2">
            {(["public","internal","confidential","regulated"] as const).map((v) => (
              <Button key={v} variant={btn(c.data===v)} size="sm" onClick={() => set("data", v)}>{v}</Button>
            ))}
          </div></div>
          <div className="space-y-1"><div className="text-xs uppercase text-muted-foreground">Environment</div><div className="flex flex-wrap gap-2">
            {(["dev","uat","pilot","prod"] as const).map((v) => (
              <Button key={v} variant={btn(c.env===v)} size="sm" onClick={() => set("env", v)}>{v}</Button>
            ))}
          </div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Resulting architecture</CardTitle><CardDescription>Static preview based on choices.</CardDescription></CardHeader>
        <CardContent><DiagramBlock text={diagram} /></CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Strengths <Badge variant="outline">good</Badge></CardTitle></CardHeader>
          <CardContent><ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">{s.good.length ? s.good.map((x) => <li key={x}>{x}</li>) : <li>Nothing especially strong yet.</li>}</ul></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Issues / Fixes <Badge variant="destructive">risk</Badge></CardTitle></CardHeader>
          <CardContent><ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">{s.issues.length ? s.issues.map((x) => <li key={x}>{x}</li>) : <li>No obvious blockers with these choices.</li>}</ul></CardContent>
        </Card>
      </div>
    </div>
  );
}
