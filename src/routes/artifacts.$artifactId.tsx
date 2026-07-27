import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { artifactsById } from "@/content/artifacts";
import { progress } from "@/lib/progress";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ArtifactTemplate } from "@/content/types";

export const Route = createFileRoute("/artifacts/$artifactId")({
  loader: ({ params }) => {
    const template = artifactsById[params.artifactId];
    if (!template) throw notFound();
    return { template };
  },
  head: ({ loaderData }) =>
    loaderData
      ? { meta: [{ title: `${loaderData.template.name} — Artifact Builder` }, { name: "description", content: loaderData.template.description }] }
      : { meta: [{ title: "Artifact" }] },
  component: Editor,
  notFoundComponent: () => <div className="p-6">Template not found.</div>,
});

function Editor() {
  const { template } = Route.useLoaderData() as { template: ArtifactTemplate };
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [name, setName] = useState(`Draft ${new Date().toLocaleDateString()}`);
  const md = useMemo(() => template.markdown(values), [values, template]);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={template.name}
        subtitle={template.description}
        right={<Button asChild variant="outline"><Link to="/artifacts">Back to builder</Link></Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Fields</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Draft name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {template.fields.map((f) => (
              <div key={f.id} className="space-y-1">
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea rows={4} placeholder={f.placeholder} value={(values[f.id] as string) ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} />
                ) : f.type === "select" ? (
                  <Select value={(values[f.id] as string) ?? ""} onValueChange={(val) => setValues((v) => ({ ...v, [f.id]: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input placeholder={f.placeholder} value={(values[f.id] as string) ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} />
                )}
                {f.help ? <p className="text-xs text-muted-foreground">{f.help}</p> : null}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { progress.saveArtifact(template.id, name, values); toast.success("Saved draft"); }}>Save draft</Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(md); toast.success("Markdown copied"); }}>Copy Markdown</Button>
              <Button variant="outline" onClick={() => {
                const blob = new Blob([md], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `${template.id}-${Date.now()}.md`; a.click();
                URL.revokeObjectURL(url);
              }}>Download .md</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
          <CardContent><pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">{md}</pre></CardContent>
        </Card>
      </div>
    </div>
  );
}