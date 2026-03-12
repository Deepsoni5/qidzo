"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  Award,
  BookOpen,
  TrendingUp,
  Filter,
  Sparkles,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { getAvailableExams } from "@/actions/exams";
import { useExamStore } from "@/store/examStore";

interface Exam {
  exam_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  is_free: boolean;
  price: number | string;
  total_questions: number;
  suggested_age_min: number | null;
  suggested_age_max: number | null;
  school: {
    school_id: string;
    name: string;
    logo_url: string | null;
  };
}

interface ExamsTabProps {
  initialExams?: any[];
}

export default function ExamsTab({ initialExams = [] }: ExamsTabProps) {
  const router = useRouter();
  const { exams, isLoading, lastFetched, setExams, setLoading } =
    useExamStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  useEffect(() => {
    // If we have initial data from server and store is empty, use it
    if (initialExams.length > 0 && exams.length === 0) {
      setExams(initialExams);
    }
    // If store is empty and no initial data, fetch
    else if (exams.length === 0 && !lastFetched) {
      loadExams();
    }
    // If data is older than 5 minutes, refresh in background
    else if (lastFetched && Date.now() - lastFetched > 300000) {
      loadExams();
    }
  }, [initialExams]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const result = await getAvailableExams();
      if (result.success) {
        setExams(result.data as any);
      } else {
        toast.error("Failed to load exams");
      }
    } catch (error) {
      console.error("Error loading exams:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtering for better performance
  const filteredExams = useMemo(() => {
    let filtered = [...exams];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exam) =>
          exam.title.toLowerCase().includes(query) ||
          exam.school.name.toLowerCase().includes(query) ||
          exam.subject?.toLowerCase().includes(query),
      );
    }

    // Subject filter
    if (selectedSubject !== "all") {
      filtered = filtered.filter((exam) => exam.subject === selectedSubject);
    }

    return filtered;
  }, [exams, searchQuery, selectedSubject]);

  const subjects = Array.from(
    new Set(exams.map((e) => e.subject).filter(Boolean)),
  ) as string[];

  const handleStartExam = (examId: string) => {
    router.push(`/study/exam/${examId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam, school, or subject..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-500"
            />
          </div>

          {/* Subject Filter */}
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all text-sm text-gray-900 appearance-none cursor-pointer bg-white"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            Showing{" "}
            <span className="font-bold text-brand-purple">
              {filteredExams.length}
            </span>{" "}
            {filteredExams.length === 1 ? "exam" : "exams"}
          </p>
        </div>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-brand-purple" />
          </div>
          <h3 className="text-lg font-bold font-nunito text-gray-900 mb-2">
            {searchQuery || selectedSubject !== "all"
              ? "No Exams Found"
              : "No Exams Available"}
          </h3>
          <p className="text-sm text-gray-600">
            {searchQuery || selectedSubject !== "all"
              ? "Try adjusting your search or filters"
              : "Check back later for new exams"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.exam_id}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-brand-purple/40 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleStartExam(exam.exam_id)}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* School Logo */}
                <div className="shrink-0">
                  {exam.school.logo_url ? (
                    <img
                      src={exam.school.logo_url}
                      alt={exam.school.name}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-brand-purple flex items-center justify-center text-white font-black text-xl">
                      {exam.school.name[0]}
                    </div>
                  )}
                </div>

                {/* Exam Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold font-nunito text-gray-900 mb-1 line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        {exam.school.name}
                      </p>
                      {exam.description && (
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    {/* Price Badge */}
                    {!exam.is_free && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                        <DollarSign className="w-3.5 h-3.5" />₹
                        {typeof exam.price === "string"
                          ? parseFloat(exam.price)
                          : exam.price}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {exam.subject && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        <BookOpen className="w-3.5 h-3.5" />
                        {exam.subject}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.duration_minutes} mins
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                      <Award className="w-3.5 h-3.5" />
                      {exam.total_marks} marks
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pass: {exam.pass_marks}
                    </span>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartExam(exam.exam_id);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-purple text-white font-bold text-sm hover:bg-brand-purple/90 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Exam
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
