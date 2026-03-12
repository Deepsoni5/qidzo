import StudyContent from "@/components/study/StudyContent";
import { getAvailableExams } from "@/actions/exams";

export default async function StudyPage() {
  // Fetch exams on server-side for faster initial render
  const result = await getAvailableExams();
  const initialExams = result.success ? result.data : [];

  return <StudyContent initialExams={initialExams} />;
}
