import ExamDetailsContent from "@/components/school/ExamDetailsContent";

export default async function ExamDetailsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <ExamDetailsContent examId={examId} />;
}
