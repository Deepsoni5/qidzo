import ExamTakingContent from "@/components/study/ExamTakingContent";

export default async function ExamTakingPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <ExamTakingContent examId={examId} />;
}
