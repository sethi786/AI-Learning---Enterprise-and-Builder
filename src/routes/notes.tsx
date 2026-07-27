import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { progress, useProgress } from "@/lib/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "My Learning Notes" },
      { name: "description", content: "Keep local learning notes; export progress and notes." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const p = useProgress();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="My Learning Notes"
        subtitle="Notes are saved locally in your browser."
        right={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([progress.exportJson()], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `eaicls-progress-${Date.now()}.json`;
                a.click();
              }}
            >
              Export progress JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([progress.exportNotesMarkdown()], { type: "text/markdown" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `eaicls-notes-${Date.now()}.md`;
                a.click();
              }}
            >
              Export notes .md
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add note</CardTitle>
          <CardDescription>Tag with topic in the title for easy find.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RAG — indirect prompt injection defenses"
            />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button
            disabled={!title || !body}
            onClick={() => {
              progress.addNote(title, body);
              setTitle("");
              setBody("");
              toast.success("Note saved");
            }}
          >
            Save note
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {p.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : null}
        {p.notes.map((n) => (
          <Card key={n.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{n.title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => progress.deleteNote(n.id)}>
                  Delete
                </Button>
              </div>
              <CardDescription>{new Date(n.ts).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
