"use client";

import { useState } from "react";
import { X, Sparkles, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createQuestion } from "@/actions/exams";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  onSuccess?: () => void;
}

export default function AddQuestionModal({
  isOpen,
  onClose,
  examId,
  onSuccess,
}: AddQuestionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">(
    "A",
  );
  const [marks, setMarks] = useState(1);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "">(
    "MEDIUM",
  );
  const [explanation, setExplanation] = useState("");
  const [hint, setHint] = useState("");

  const resetForm = () => {
    setQuestionText("");
    setQuestionImageUrl("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("A");
    setMarks(1);
    setDifficulty("MEDIUM");
    setExplanation("");
    setHint("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      toast.error("Please enter question text");
      return;
    }

    if (
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim()
    ) {
      toast.error("Please fill all options");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createQuestion({
        examId,
        questionText: questionText.trim(),
        questionImageUrl: questionImageUrl.trim() || undefined,
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctOption,
        marks,
        difficulty: difficulty || undefined,
        explanation: explanation.trim() || undefined,
        hint: hint.trim() || undefined,
      });

      if (result.success) {
        toast.success("Question added successfully! 🎉");
        resetForm();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to add question");
      }
    } catch (error) {
      console.error("Add question error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 sm:px-8 py-6 border-b border-gray-100 bg-white rounded-t-[32px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900">
                Add Question
              </h2>
              <p className="text-sm font-bold text-gray-500 mt-1">
                Create a new MCQ question 📝
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Question <span className="text-hot-pink">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Question Image (Optional) */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Question Image URL (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                value={questionImageUrl}
                onChange={(e) => setQuestionImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 pl-12 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
              />
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                Options <span className="text-hot-pink">*</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-grass-green/10 border border-grass-green/20">
                <div className="w-2 h-2 rounded-full bg-grass-green animate-pulse" />
                <span className="text-[10px] font-black text-grass-green uppercase">
                  Select Correct Answer
                </span>
              </div>
            </div>

            {[
              { key: "A", value: optionA, setter: setOptionA },
              { key: "B", value: optionB, setter: setOptionB },
              { key: "C", value: optionC, setter: setOptionC },
              { key: "D", value: optionD, setter: setOptionD },
            ].map((option) => (
              <div key={option.key} className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOption === option.key}
                    onChange={() =>
                      setCorrectOption(option.key as "A" | "B" | "C" | "D")
                    }
                    className="w-5 h-5 text-grass-green focus:ring-grass-green cursor-pointer"
                  />
                  <span className="text-sm font-black text-gray-700 group-hover:text-grass-green transition-colors">
                    {option.key}
                  </span>
                </label>
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => option.setter(e.target.value)}
                  placeholder={`Option ${option.key}`}
                  required
                  className={`flex-1 px-4 py-3 rounded-2xl border-2 ${
                    correctOption === option.key
                      ? "border-grass-green bg-grass-green/5 ring-4 ring-grass-green/10"
                      : "border-gray-200"
                  } focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400`}
                />
                {correctOption === option.key && (
                  <span className="text-xs font-black text-grass-green bg-grass-green/10 px-2 py-1 rounded-lg">
                    ✓ Correct
                  </span>
                )}
              </div>
            ))}

            <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-blue/5 border border-sky-blue/20">
              <Sparkles className="w-4 h-4 text-sky-blue mt-0.5 shrink-0" />
              <p className="text-xs font-bold text-sky-blue">
                <span className="font-black">Tip:</span> Click the radio button
                (○) next to the option you want to mark as the correct answer.
                The selected option will be highlighted in green.
              </p>
            </div>
          </div>

          {/* Marks and Difficulty */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Marks <span className="text-hot-pink">*</span>
              </label>
              <input
                type="number"
                value={marks}
                onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                min={1}
                required
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all text-sm font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all text-sm font-bold text-gray-900"
              >
                <option value="">Select difficulty</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Explanation (Optional) */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the correct answer..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Hint (Optional) */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Hint (Optional)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Give students a hint..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-black text-base hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-sky-blue to-brand-purple text-white font-black text-base shadow-lg shadow-sky-blue/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Add Question
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
