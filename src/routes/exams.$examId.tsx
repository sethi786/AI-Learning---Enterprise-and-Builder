import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader, Quiz } from "@/components/learning/Primitives";
import { examsById } from "@/content/exams";
import type { ExamDef } from "@/content/types";

export const Route = createFileRoute("/exams/$examId")({
  loader: ({ params }) => {
    const exam = examsById[params.examId];
    if (!exam) throw notFound();
    return { exam };
  },
  head: ({ loaderData }) =>
    loaderData
      ? { meta: [{ title: `${loaderData.exam.name} — Exam` }, { name: "description", content: loaderData.exam.description }] }
      : { meta: [{ title: "Exam" }] },
  component: () => {
    const { exam } = Route.useLoaderData() as { exam: ExamDef };
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader title={exam.name} subtitle={exam.description} />
        <Quiz id={`exam:${exam.id}`} questions={exam.questions} />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Exam not found.</div>,
});