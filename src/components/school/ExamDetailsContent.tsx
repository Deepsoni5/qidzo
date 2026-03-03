"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Award,
  DollarSign,
  Sparkles,
  CheckCircle,
  Users,
  TrendingUp,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  getExamDetails,
  getExamQuestions,
  publishExam,
  unpublishExam,
  deleteQuestion,
  getExamResults,
  getExamMarksSum,
} from "@/actions/exams";
import AddQuestionModal from "./AddQuestionModal";

interface ExamDetailsContentProps {
  examId: string;
}

export default function ExamDetailsContent({
  examId,
}: ExamDetailsContentProps) {
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [questionMarksSum, setQuestionMarksSum] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "results">(
    "questions",
  );

  useEffect(() => {
    loadExamData();
  }, [examId]);

  const loadExamData = async () => {
    setIsLoading(true);
    try {
      const [examData, questionsData, resultsData, marksSum] =
        await Promise.all([
          getExamDetails(examId),
          getExamQuestions(examId),
          getExamResults(examId),
          getExamMarksSum(examId),
        ]);

      setExam(examData);
      setQuestions(questionsData);
      setQuestionMarksSum(marksSum);
      if (resultsData.success) {
        setResults(resultsData.data);
      }
    } catch (error) {
      console.error("Error loading exam:", error);
      toast.error("Failed to load exam details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!exam) return;

    if (!exam.is_published && (!questions || questions.length === 0)) {
      toast.error("Cannot publish exam without questions");
      return;
    }

    setIsPublishing(true);
    try {
      const result = exam.is_published
        ? await unpublishExam(examId)
        : await publishExam(examId);

      if (result.success) {
        toast.success(
          exam.is_published
            ? "Exam unpublished successfully"
            : "Exam published successfully! 🎉",
        );
        loadExamData();
      } else {
        toast.error(result.error || "Failed to update exam status");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        toast.success("Question deleted successfully");
        loadExamData();
      } else {
        toast.error(result.error || "Failed to delete question");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-bold">Exam not found</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/school/exams")}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900 tracking-tight">
              {exam.title}
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-1">
              Manage exam questions and settings
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePublishToggle}
            disabled={isPublishing}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
              exam.is_published
                ? "bg-gray-600 text-white shadow-gray-600/20"
                : "bg-grass-green text-white shadow-grass-green/20"
            }`}
          >
            {exam.is_published ? (
              <>
                <EyeOff className="w-5 h-5" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Exam Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Questions",
            value: exam.total_questions || 0,
            icon: Sparkles,
            color: "sky-blue",
          },
          {
            label: "Total Marks",
            value: exam.total_marks || 0,
            icon: Award,
            color: "brand-purple",
          },
          {
            label: "Duration",
            value: `${exam.duration_minutes}m`,
            icon: Clock,
            color: "hot-pink",
          },
          {
            label: exam.is_free ? "Free" : `₹${exam.price}`,
            value: exam.is_published ? "Published" : "Draft",
            icon: exam.is_free ? CheckCircle : DollarSign,
            color: exam.is_published ? "grass-green" : "sunshine-yellow",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-xl`}
                style={{
                  backgroundColor:
                    stat.color === "sky-blue"
                      ? "#0EA5E910"
                      : stat.color === "brand-purple"
                        ? "#8B5CF610"
                        : stat.color === "hot-pink"
                          ? "#EC489910"
                          : stat.color === "grass-green"
                            ? "#10B98110"
                            : "#FBBF2410",
                }}
              >
                <stat.icon
                  className="w-4 h-4"
                  style={{
                    color:
                      stat.color === "sky-blue"
                        ? "#0EA5E9"
                        : stat.color === "brand-purple"
                          ? "#8B5CF6"
                          : stat.color === "hot-pink"
                            ? "#EC4899"
                            : stat.color === "grass-green"
                              ? "#10B981"
                              : "#FBBF24",
                  }}
                />
              </div>
            </div>
            <p className="text-xl font-black font-nunito text-gray-900">
              {stat.value}
            </p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Marks Status Warning */}
      {questionMarksSum !== exam.total_marks && (
        <div
          className={`mb-6 p-4 rounded-2xl border-2 ${
            questionMarksSum < exam.total_marks
              ? "bg-sunshine-yellow/5 border-sunshine-yellow/30"
              : "bg-hot-pink/5 border-hot-pink/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl ${
                questionMarksSum < exam.total_marks
                  ? "bg-sunshine-yellow/20"
                  : "bg-hot-pink/20"
              }`}
            >
              <Target
                className={`w-5 h-5 ${
                  questionMarksSum < exam.total_marks
                    ? "text-sunshine-yellow"
                    : "text-hot-pink"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-gray-900 mb-1">
                {questionMarksSum < exam.total_marks
                  ? "⚠️ Incomplete Exam"
                  : "❌ Marks Exceeded"}
              </h3>
              <p className="text-xs font-bold text-gray-600">
                {questionMarksSum < exam.total_marks ? (
                  <>
                    Question marks total:{" "}
                    <span className="font-black">{questionMarksSum}</span> /
                    Exam total:{" "}
                    <span className="font-black">{exam.total_marks}</span>
                    <br />
                    Please add{" "}
                    <span className="font-black text-sunshine-yellow">
                      {exam.total_marks - questionMarksSum} more marks
                    </span>{" "}
                    worth of questions to publish this exam.
                  </>
                ) : (
                  <>
                    Question marks total:{" "}
                    <span className="font-black">{questionMarksSum}</span> /
                    Exam total:{" "}
                    <span className="font-black">{exam.total_marks}</span>
                    <br />
                    You've exceeded by{" "}
                    <span className="font-black text-hot-pink">
                      {questionMarksSum - exam.total_marks} marks
                    </span>
                    . Please remove some questions or reduce their marks.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message when marks match */}
      {questionMarksSum === exam.total_marks &&
        questions.length > 0 &&
        !exam.is_published && (
          <div className="mb-6 p-4 rounded-2xl border-2 bg-grass-green/5 border-grass-green/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-grass-green/20">
                <CheckCircle className="w-5 h-5 text-grass-green" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-gray-900 mb-1">
                  ✅ Exam Ready to Publish!
                </h3>
                <p className="text-xs font-bold text-gray-600">
                  All questions added correctly. Total marks:{" "}
                  <span className="font-black text-grass-green">
                    {questionMarksSum}
                  </span>
                  . You can now publish this exam.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Published Status Message */}
      {exam.is_published && questionMarksSum === exam.total_marks && (
        <div className="mb-6 p-4 rounded-2xl border-2 bg-brand-purple/5 border-brand-purple/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-brand-purple/20">
              <CheckCircle className="w-5 h-5 text-brand-purple" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-gray-900 mb-1">
                🎉 Exam Published!
              </h3>
              <p className="text-xs font-bold text-gray-600">
                This exam is live and students can now take it. Total marks:{" "}
                <span className="font-black text-brand-purple">
                  {questionMarksSum}
                </span>
                . Click "Unpublish" above to make changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Questions Section */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
        {/* Tab Navigation */}
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-6 py-3 rounded-2xl font-black transition-all ${
              activeTab === "questions"
                ? "bg-sky-blue text-white shadow-lg shadow-sky-blue/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-6 py-3 rounded-2xl font-black transition-all ${
              activeTab === "results"
                ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Results ({results.length})
          </button>
        </div>

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black font-nunito text-gray-900">
                Questions ({questions.length})
              </h2>
              <button
                onClick={() => setIsAddQuestionOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-blue text-white font-black shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-sky-blue/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-sky-blue" />
                </div>
                <h3 className="text-xl font-black font-nunito text-gray-900 mb-2">
                  No Questions Yet
                </h3>
                <p className="text-sm font-bold text-gray-500 mb-6">
                  Start adding questions to your exam
                </p>
                <button
                  onClick={() => setIsAddQuestionOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-blue text-white font-black shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-xl bg-sky-blue/10 text-sky-blue text-xs font-black">
                            Q{index + 1}
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-grass-green/10 text-grass-green text-xs font-black">
                            {question.marks} marks
                          </span>
                          {question.difficulty && (
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-black ${
                                question.difficulty === "EASY"
                                  ? "bg-grass-green/10 text-grass-green"
                                  : question.difficulty === "MEDIUM"
                                    ? "bg-sunshine-yellow/10 text-sunshine-yellow"
                                    : "bg-hot-pink/10 text-hot-pink"
                              }`}
                            >
                              {question.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-base font-bold text-gray-900 mb-3">
                          {question.question_text}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {["A", "B", "C", "D"].map((option) => (
                            <div
                              key={option}
                              className={`p-3 rounded-xl border-2 ${
                                question.correct_option === option
                                  ? "border-grass-green bg-grass-green/5"
                                  : "border-gray-100"
                              }`}
                            >
                              <span className="text-xs font-black text-gray-500 mr-2">
                                {option}.
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {question[`option_${option.toLowerCase()}`]}
                              </span>
                              {question.correct_option === option && (
                                <CheckCircle className="w-4 h-4 text-grass-green inline-block ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleDeleteQuestion(question.question_id)
                          }
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-black font-nunito text-gray-900 mb-2">
                Exam Results
              </h2>
              <p className="text-sm font-bold text-gray-500">
                View all student attempts and scores
              </p>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-brand-purple" />
                </div>
                <h3 className="text-xl font-black font-nunito text-gray-900 mb-2">
                  No Results Yet
                </h3>
                <p className="text-sm font-bold text-gray-500">
                  Students haven't taken this exam yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((attempt) => {
                  const percentage = exam.total_marks
                    ? Math.round(
                        (attempt.score_obtained / exam.total_marks) * 100,
                      )
                    : 0;
                  const isPassed = attempt.score_obtained >= exam.pass_marks;
                  const timeTaken = attempt.time_taken_minutes || 0;

                  return (
                    <div
                      key={attempt.attempt_id}
                      className="p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Student Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative">
                            {attempt.child?.avatar ? (
                              <img
                                src={attempt.child.avatar}
                                alt={attempt.child.name}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-100"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-hot-pink flex items-center justify-center text-white font-black text-xl">
                                {attempt.child?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center ${
                                isPassed ? "bg-grass-green" : "bg-hot-pink"
                              }`}
                            >
                              {isPassed ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : (
                                <Target className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black font-nunito text-gray-900 truncate">
                              {attempt.child?.name || "Unknown Student"}
                            </h3>
                            <p className="text-xs font-bold text-gray-500">
                              @{attempt.child?.username || "unknown"} • Age{" "}
                              {attempt.child?.age || "N/A"}
                            </p>
                            {attempt.child?.school_name && (
                              <p className="text-xs font-bold text-gray-400 truncate">
                                🏫 {attempt.child.school_name}
                              </p>
                            )}
                            {attempt.child?.city && (
                              <p className="text-xs font-bold text-gray-400">
                                📍 {attempt.child.city}
                                {attempt.child.country &&
                                  `, ${attempt.child.country}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Score Info */}
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Score */}
                          <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Award
                                className={`w-5 h-5 ${isPassed ? "text-grass-green" : "text-hot-pink"}`}
                              />
                              <p className="text-2xl font-black font-nunito text-gray-900">
                                {attempt.score_obtained}/{exam.total_marks}
                              </p>
                            </div>
                            <p className="text-xs font-bold text-gray-500">
                              Score
                            </p>
                          </div>

                          {/* Percentage */}
                          <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp
                                className={`w-5 h-5 ${isPassed ? "text-grass-green" : "text-hot-pink"}`}
                              />
                              <p className="text-2xl font-black font-nunito text-gray-900">
                                {percentage}%
                              </p>
                            </div>
                            <p className="text-xs font-bold text-gray-500">
                              Percentage
                            </p>
                          </div>

                          {/* Time */}
                          <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-5 h-5 text-sky-blue" />
                              <p className="text-2xl font-black font-nunito text-gray-900">
                                {timeTaken}m
                              </p>
                            </div>
                            <p className="text-xs font-bold text-gray-500">
                              Time
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span
                              className={`px-4 py-2 rounded-xl text-xs font-black ${
                                isPassed
                                  ? "bg-grass-green/10 text-grass-green"
                                  : "bg-hot-pink/10 text-hot-pink"
                              }`}
                            >
                              {isPassed ? "✅ PASSED" : "❌ FAILED"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Submission Time */}
                      {attempt.submitted_at && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-400">
                            Submitted on{" "}
                            {new Date(attempt.submitted_at).toLocaleString(
                              "en-US",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        examId={examId}
        onSuccess={() => {
          setIsAddQuestionOpen(false);
          loadExamData();
        }}
      />
    </div>
  );
}
