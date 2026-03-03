"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  BookOpen,
  Calendar,
  Clock,
  Users,
  Trophy,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { getSchoolExams, deleteExam, toggleExamPublish } from "@/actions/exams";
import { toast } from "sonner";
import CreateExamModal from "./CreateExamModal";
import { formatDistanceToNow } from "date-fns";

interface Exam {
  id: string;
  exam_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  duration_minutes: number;
  start_date: string;
  end_date: string;
  total_marks: number;
  pass_marks: number;
  is_free: boolean;
  price: number | string;
  total_questions: number;
  total_attempts: number;
  average_score: number | string;
  is_published: boolean;
  created_at: string;
  suggested_age_min?: number | null;
  suggested_age_max?: number | null;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_results_immediately?: boolean;
  published_at?: string | null;
  updated_at?: string;
}

export default function SchoolExamsContent() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setIsLoading(true);
    const result = await getSchoolExams();
    if (result.success) {
      setExams(result.data);
    } else {
      toast.error("Failed to load exams");
    }
    setIsLoading(false);
  };

  const handleDelete = async (examId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this exam? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(examId);
    const result = await deleteExam(examId);

    if (result.success) {
      toast.success("Exam deleted successfully! 🗑️");
      loadExams();
    } else {
      toast.error("Failed to delete exam");
    }
    setDeletingId(null);
  };

  const handleTogglePublish = async (
    examId: string,
    currentStatus: boolean,
  ) => {
    const result = await toggleExamPublish(examId, !currentStatus);

    if (result.success) {
      toast.success(
        !currentStatus ? "Exam published successfully! 🎉" : "Exam unpublished",
      );
      loadExams();
    } else {
      toast.error("Failed to update exam status");
    }
  };

  const stats = {
    total: exams.length,
    published: exams.filter((e) => e.is_published).length,
    draft: exams.filter((e) => !e.is_published).length,
    totalAttempts: exams.reduce((sum, e) => sum + e.total_attempts, 0),
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900 tracking-tight">
            Exam Portal 📝
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-bold mt-1">
            Create and manage online exams for students
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-purple to-hot-pink text-white font-black text-sm sm:text-base shadow-lg shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Exam
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {[
          {
            label: "Total Exams",
            value: stats.total,
            icon: BookOpen,
            color: "sky-blue",
            bg: "bg-sky-blue/10",
          },
          {
            label: "Published",
            value: stats.published,
            icon: CheckCircle2,
            color: "grass-green",
            bg: "bg-grass-green/10",
          },
          {
            label: "Drafts",
            value: stats.draft,
            icon: Edit,
            color: "sunshine-yellow",
            bg: "bg-sunshine-yellow/10",
          },
          {
            label: "Total Attempts",
            value: stats.totalAttempts,
            icon: Users,
            color: "hot-pink",
            bg: "bg-hot-pink/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${stat.bg}`}
              >
                <stat.icon
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{
                    color:
                      stat.color === "sky-blue"
                        ? "#0EA5E9"
                        : stat.color === "grass-green"
                          ? "#10B981"
                          : stat.color === "sunshine-yellow"
                            ? "#FBBF24"
                            : "#EC4899",
                  }}
                />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-nunito text-gray-900">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exams List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-blue" />
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-[32px] p-8 sm:p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-sky-blue/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-sky-blue" />
          </div>
          <h3 className="text-lg sm:text-xl font-black font-nunito text-gray-900 mb-2">
            No Exams Yet
          </h3>
          <p className="text-sm font-bold text-gray-500 mb-6">
            Create your first exam to get started!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-blue text-white font-black shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create First Exam
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => router.push(`/school/exams/${exam.exam_id}`)}
              className="bg-white rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border-2 border-gray-100 hover:border-sky-blue/30 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: Exam Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 truncate">
                      {exam.title}
                    </h3>
                    {exam.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-grass-green/10 text-grass-green text-[10px] font-black border border-grass-green/20">
                        <CheckCircle2 className="w-3 h-3" />
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black border border-gray-200">
                        <Edit className="w-3 h-3" />
                        DRAFT
                      </span>
                    )}
                    {!exam.is_free && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sunshine-yellow/10 text-amber-700 text-[10px] font-black border border-sunshine-yellow/20">
                        <DollarSign className="w-3 h-3" />₹
                        {typeof exam.price === "string"
                          ? parseFloat(exam.price)
                          : exam.price}
                      </span>
                    )}
                  </div>

                  {exam.description && (
                    <p className="text-xs sm:text-sm text-gray-600 font-bold mb-3 line-clamp-2">
                      {exam.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-bold text-gray-500 mb-3">
                    {exam.subject && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                        {exam.subject}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      {exam.duration_minutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                      {exam.total_marks} marks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {exam.total_attempts} attempts
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      {formatDistanceToNow(new Date(exam.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Helpful Hint Message */}
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-blue/5 border border-sky-blue/20 group-hover:bg-sky-blue/10 transition-all">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-blue animate-pulse" />
                    <p className="text-[10px] sm:text-xs font-black text-sky-blue">
                      {exam.total_questions === 0
                        ? "👆 Click to add questions and get started!"
                        : exam.total_attempts === 0
                          ? "👆 Click to view questions or check results!"
                          : `👆 Click to manage questions & view ${exam.total_attempts} student result${exam.total_attempts > 1 ? "s" : ""}!`}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePublish(exam.exam_id, exam.is_published);
                    }}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs transition-all ${
                      exam.is_published
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-grass-green/10 text-grass-green hover:bg-grass-green/20"
                    }`}
                  >
                    {exam.is_published ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Publish</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(exam.exam_id);
                    }}
                    disabled={deletingId === exam.exam_id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-black text-xs transition-all disabled:opacity-50"
                  >
                    {deletingId === exam.exam_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadExams();
        }}
      />
    </div>
  );
}
