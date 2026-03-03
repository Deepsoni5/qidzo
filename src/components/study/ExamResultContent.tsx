"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  Trophy,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { getStudentExamResult } from "@/actions/exams";

interface ExamResultContentProps {
  examId: string;
  attemptId: string;
}

export default function ExamResultContent({
  examId,
  attemptId,
}: ExamResultContentProps) {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  const loadResult = async () => {
    setIsLoading(true);
    try {
      const data = await getStudentExamResult(attemptId);
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        toast.error("Failed to load result");
        router.push("/study");
      }
    } catch (error) {
      console.error("Error loading result:", error);
      toast.error("Something went wrong");
      router.push("/study");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-bold">Result not found</p>
      </div>
    );
  }

  const isPassed = result.is_passed;
  const percentage = Math.round(result.percentage || 0);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Result Card */}
        <div className="bg-white rounded-xl p-6 sm:p-10 border border-gray-200 shadow-sm">
          {/* Status */}
          <div className="text-center mb-8">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isPassed ? "bg-grass-green" : "bg-amber-500"
              }`}
            >
              {isPassed ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : (
                <Target className="w-10 h-10 text-white" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-nunito text-gray-900 mb-2">
              {isPassed ? "Congratulations! 🎉" : "Keep Trying! 💪"}
            </h1>
            <p className="text-base text-gray-600">
              {isPassed
                ? "You passed the exam!"
                : "Don't give up, practice makes perfect!"}
            </p>
          </div>

          {/* Exam Title */}
          <div className="text-center mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {result.exam?.title}
            </h2>
            <p className="text-sm text-gray-600">{result.exam?.school?.name}</p>
          </div>

          {/* Score Stats */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-brand-purple" />
                <p className="text-sm text-gray-600">Your Score</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {result.score_obtained}/{result.exam?.total_marks}
              </p>
            </div>

            <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-brand-purple" />
                <p className="text-sm text-gray-600">Percentage</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
            </div>

            <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-brand-purple" />
                <p className="text-sm text-gray-600">Correct</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {result.correct_answers}/{result.exam?.total_questions}
              </p>
            </div>

            <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-brand-purple" />
                <p className="text-sm text-gray-600">Time Taken</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((result.duration_seconds || 0) / 60)}m
              </p>
            </div>
          </div>

          {/* Pass/Fail Status */}
          <div
            className={`p-5 rounded-lg mb-8 ${
              isPassed
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {isPassed ? (
                <CheckCircle2 className="w-7 h-7 text-grass-green shrink-0" />
              ) : (
                <XCircle className="w-7 h-7 text-red-600 shrink-0" />
              )}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {isPassed ? "Passed ✅" : "Not Passed ❌"}
                </h3>
                <p className="text-sm text-gray-600">
                  Pass marks required: {result.exam?.pass_marks} | You scored:{" "}
                  {result.score_obtained}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </button>
            <button
              onClick={() => router.push("/study")}
              className="flex-1 px-6 py-3 rounded-lg bg-brand-purple text-white font-bold hover:bg-brand-purple/90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Back to Study Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
