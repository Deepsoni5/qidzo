"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send,
  Lock,
  Loader2,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";
import {
  getExamForTaking,
  startExamAttempt,
  submitExamAttempt,
} from "@/actions/exams";
import { createExamOrder, verifyExamPayment, checkExamPaymentStatus } from "@/actions/razorpay";

interface ExamTakingContentProps {
  examId: string;
}

export default function ExamTakingContent({ examId }: ExamTakingContentProps) {
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    if (exam && !exam.is_free) {
      checkPayment();
    }
  }, [exam]);

  const checkPayment = async () => {
    setIsCheckingPayment(true);
    try {
      const paid = await checkExamPaymentStatus(examId);
      setHasPaid(paid);
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const result = await createExamOrder(examId);
      if (!result.success || !result.orderId) {
        toast.error(result.error || "Failed to create payment order");
        return;
      }

      const options = {
        key: result.keyId,
        amount: result.amount,
        currency: "INR",
        name: "Qidzo Exam",
        description: `Payment for ${exam.title}`,
        order_id: result.orderId,
        handler: async (response: any) => {
          try {
            const verifyResult = await verifyExamPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              examId: examId,
            });

            if (verifyResult.success) {
              setHasPaid(true);
              toast.success("Payment Successful! You can now start the exam. 📝");
            } else {
              toast.error(verifyResult.error || "Payment verification failed");
            }
          } catch (error) {
            toast.error("Error verifying payment");
          }
        },
        prefill: {
          name: result.childName,
          email: "",
          contact: "",
        },
        theme: {
          color: "#8B5CF6",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong with the payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (!hasStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining]);

  // Prevent back button and page refresh
  useEffect(() => {
    if (!hasStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (
        confirm(
          "Are you sure you want to leave? Your exam progress will be lost!",
        )
      ) {
        router.back();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasStarted, router]);

  const loadExam = async () => {
    setIsLoading(true);
    try {
      const result = await getExamForTaking(examId);
      if (result.success && result.data) {
        setExam(result.data.exam);
        setQuestions(result.data.questions);
      } else {
        toast.error(result.error || "Failed to load exam");
        router.push("/study");
      }
    } catch (error) {
      console.error("Error loading exam:", error);
      toast.error("Something went wrong");
      router.push("/study");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExam = async () => {
    try {
      const result = await startExamAttempt(examId);
      if (result.success && result.attemptId) {
        setAttemptId(result.attemptId);
        setTimeRemaining(exam.duration_minutes * 60);
        setHasStarted(true);
        toast.success("Exam started! Good luck! 🍀");
      } else {
        toast.error(result.error || "Failed to start exam");
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      toast.error("Something went wrong");
    }
  };

  const handleAnswerSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitExam = useCallback(async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    try {
      const result = await submitExamAttempt(attemptId, answers);
      if (result.success) {
        toast.success("Exam submitted successfully! 🎉");
        // Use replace to prevent going back to exam
        router.replace(`/study/exam/${examId}/result/${attemptId}`);
      } else {
        toast.error(result.error || "Failed to submit exam");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Something went wrong");
      setIsSubmitting(false);
    }
  }, [attemptId, answers, examId, router]);

  const handleAutoSubmit = useCallback(async (reason?: string) => {
    if (isSubmitting) return;
    const message = reason || "Time's up!";
    toast.error(`${message} Submitting your exam...`);
    await handleSubmitExam();
  }, [isSubmitting, handleSubmitExam]);

  // Tab Switching Detection
  useEffect(() => {
    if (!hasStarted || isSubmitting) return;

    const handleViolation = () => {
      setTabSwitchCount((prev) => {
        const newCount = prev + 1;
        if (newCount === 1) {
          setShowWarningModal(true);
        } else if (newCount >= 2) {
          handleAutoSubmit("Anti-Cheat: Tab switching detected!");
        }
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation();
      }
    };

    const handleBlur = () => {
      // Small timeout to avoid triggering on certain browser UI interactions
      setTimeout(() => {
        if (document.activeElement?.tagName !== "IFRAME") {
          handleViolation();
        }
      }, 100);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [hasStarted, isSubmitting, handleAutoSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  if (isLoading || isCheckingPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
        <p className="text-sm font-bold text-gray-500 animate-pulse">
          Setting up your magic desk... ✨
        </p>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-bold">Exam not found</p>
      </div>
    );
  }

  // Payment Screen for Paid Exams
  if (!exam.is_free && !hasPaid && !hasStarted) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 bg-gray-50/50">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl shadow-brand-purple/5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-sunshine-yellow/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-sunshine-yellow" />
            </div>

            <h2 className="text-2xl font-black font-nunito text-gray-900 mb-2">
              Paid Exam Content 🔒
            </h2>
            <p className="text-gray-500 font-bold mb-8">
              This is a premium school exam. Pay once to unlock it forever and
              start your attempt!
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <span className="text-sm font-bold text-gray-500">
                  Exam Fee
                </span>
                <span className="text-xl font-black text-gray-900">₹99</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-brand-purple" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 leading-tight">
                    {exam.title}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400">
                    By {exam.school?.name}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full py-4 rounded-2xl bg-brand-purple text-white font-black text-lg shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  Pay ₹99 to Unlock
                </>
              )}
            </button>

            <button
              onClick={() => router.push("/study")}
              className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Start Screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            {/* School Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              {exam.school?.logo_url ? (
                <img
                  src={exam.school.logo_url}
                  alt={exam.school.name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-brand-purple flex items-center justify-center text-white font-black text-2xl">
                  {exam.school?.name?.[0] || "E"}
                </div>
              )}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-nunito text-gray-900">
                  {exam.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {exam.school?.name || "School"}
                </p>
              </div>
            </div>

            {/* Exam Details */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-bold font-nunito text-gray-900">
                Exam Instructions
              </h3>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Clock className="w-5 h-5 text-brand-purple shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="text-base font-bold text-gray-900">
                      {exam.duration_minutes} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Award className="w-5 h-5 text-brand-purple shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Total Marks</p>
                    <p className="text-base font-bold text-gray-900">
                      {exam.total_marks}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-brand-purple shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Pass Marks</p>
                    <p className="text-base font-bold text-gray-900">
                      {exam.pass_marks}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <AlertCircle className="w-5 h-5 text-brand-purple shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Questions</p>
                    <p className="text-base font-bold text-gray-900">
                      {questions.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Rules */}
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Important Rules
                </h4>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>• Timer starts immediately when you begin</li>
                  <li>• You cannot pause or restart the exam</li>
                  <li>• Do not refresh or close the browser</li>
                  <li>• Exam auto-submits when time runs out</li>
                  <li>• Results shown after submission</li>
                </ul>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartExam}
              className="w-full py-3.5 rounded-lg bg-brand-purple text-white font-bold text-base hover:bg-brand-purple/90 active:scale-95 transition-all cursor-pointer"
            >
              Start Exam 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exam Taking Screen
  return (
    <div
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 select-none"
      style={{ WebkitTouchCallout: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header with Timer */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm mb-6 sticky top-20 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold font-nunito text-gray-900 truncate">
                {exam.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 60
                  ? "bg-red-50 text-red-600 animate-pulse"
                  : timeRemaining < 300
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-900"
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-base font-bold font-mono">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Progress</span>
              <span>
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-purple transition-all duration-300"
                style={{
                  width: `${(answeredCount / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-brand-purple/10 text-brand-purple text-sm font-bold">
                Question {currentQuestionIndex + 1}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold">
                {currentQuestion.marks} marks
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
              {currentQuestion.question_text}
            </h3>

            {currentQuestion.question_image_url && (
              <img
                src={currentQuestion.question_image_url}
                alt="Question"
                className="mt-4 rounded-lg max-w-full h-auto border border-gray-200"
              />
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {["A", "B", "C", "D"].map((option) => {
              const optionText =
                currentQuestion[`option_${option.toLowerCase()}`];
              const isSelected =
                answers[currentQuestion.question_id] === option;

              return (
                <button
                  key={option}
                  onClick={() =>
                    handleAnswerSelect(currentQuestion.question_id, option)
                  }
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-brand-purple bg-brand-purple/5"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "border-brand-purple bg-brand-purple"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-700 mr-2">
                        {option}.
                      </span>
                      <span className="text-sm text-gray-900">
                        {optionText}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
            className="flex-1 sm:flex-none px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {!isLastQuestion ? (
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1),
                )
              }
              className="flex-1 px-6 py-3 rounded-lg bg-brand-purple text-white font-bold hover:bg-brand-purple/90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-lg bg-grass-green text-white font-bold hover:bg-grass-green/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Exam
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Switch Warning Modal */}
        {showWarningModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <div className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border-4 border-red-100 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black font-nunito text-gray-900 text-center mb-4">
                Anti-Cheat Warning! ⚠️
              </h3>
              <p className="text-gray-600 font-bold text-center mb-8 leading-relaxed">
                We detected that you switched tabs or windows. This is strictly
                prohibited during the exam.
                <br />
                <br />
                <span className="text-red-600 uppercase">
                  One more violation
                </span>{" "}
                will result in your exam being{" "}
                <span className="underline">automatically submitted</span>.
              </p>
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full py-4 rounded-2xl bg-brand-purple text-white font-black text-lg shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        )}

        {/* Confirm Submit Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowConfirmSubmit(false)}
            />
            <div className="relative bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold font-nunito text-gray-900 mb-2">
                Submit Exam?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                You've answered {answeredCount} out of {questions.length}{" "}
                questions. Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    handleSubmitExam();
                  }}
                  className="flex-1 px-6 py-2.5 rounded-lg bg-brand-purple text-white font-bold hover:bg-brand-purple/90 active:scale-95 transition-all cursor-pointer"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
