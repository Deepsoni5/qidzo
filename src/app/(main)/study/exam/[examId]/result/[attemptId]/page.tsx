import ExamResultContent from "@/components/study/ExamResultContent";

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const { examId, attemptId } = await params;
  return <ExamResultContent examId={examId} attemptId={attemptId} />;
}
