"use client";

import { useState } from "react";
import {
  X,
  BookOpen,
  Clock,
  Calendar,
  DollarSign,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createExam } from "@/actions/exams";

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateExamModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExamModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);
  const [suggestedAgeMin, setSuggestedAgeMin] = useState(4);
  const [suggestedAgeMax, setSuggestedAgeMax] = useState(17);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubject("");
    setDurationMinutes(30);
    setStartDate("");
    setEndDate("");
    setTotalMarks(100);
    setPassMarks(40);
    setSuggestedAgeMin(4);
    setSuggestedAgeMax(17);
    setIsFree(true);
    setPrice(0);
    setShuffleQuestions(true);
    setShuffleOptions(true);
    setShowResultsImmediately(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter exam title");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    if (passMarks > totalMarks) {
      toast.error("Pass marks cannot exceed total marks");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createExam({
        title: title.trim(),
        description: description.trim() || undefined,
        subject: subject.trim() || undefined,
        durationMinutes,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalMarks,
        passMarks,
        suggestedAgeMin,
        suggestedAgeMax,
        isFree,
        price: isFree ? 0 : price,
        shuffleQuestions,
        shuffleOptions,
        showResultsImmediately,
      });

      if (result.success) {
        toast.success("Exam created successfully! 🎉");
        resetForm();
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to create exam");
      }
    } catch (error) {
      console.error("Create exam error:", error);
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

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 sm:px-8 py-6 border-b border-gray-100 bg-white rounded-t-[32px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900">
                Create New Exam
              </h2>
              <p className="text-sm font-bold text-gray-500 mt-1">
                Set up your exam details and settings 📝
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
          {/* Basic Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-sky-blue/10">
                <BookOpen className="w-5 h-5 text-sky-blue" />
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Basic Details
              </h3>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Exam Title <span className="text-hot-pink">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Mathematics Mid-Term Exam"
                maxLength={300}
                required
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the exam..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Mathematics, Science, English"
                maxLength={100}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-brand-purple/10">
                <Clock className="w-5 h-5 text-brand-purple" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Timing</h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Duration (minutes) <span className="text-hot-pink">*</span>
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(parseInt(e.target.value) || 0)
                  }
                  min={1}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all text-sm font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Start Date <span className="text-hot-pink">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all text-sm font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  End Date <span className="text-hot-pink">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all text-sm font-bold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Scoring */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-grass-green/10">
                <Sparkles className="w-5 h-5 text-grass-green" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Scoring</h3>
            </div>

            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Total Marks <span className="text-hot-pink">*</span>
                </label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)}
                  min={1}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-grass-green focus:ring-4 focus:ring-grass-green/10 outline-none transition-all text-sm font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Pass Marks <span className="text-hot-pink">*</span>
                </label>
                <input
                  type="number"
                  value={passMarks}
                  onChange={(e) => setPassMarks(parseInt(e.target.value) || 0)}
                  min={1}
                  max={totalMarks}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-grass-green focus:ring-4 focus:ring-grass-green/10 outline-none transition-all text-sm font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Min Age
                </label>
                <input
                  type="number"
                  value={suggestedAgeMin}
                  onChange={(e) =>
                    setSuggestedAgeMin(parseInt(e.target.value) || 4)
                  }
                  min={4}
                  max={17}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-grass-green focus:ring-4 focus:ring-grass-green/10 outline-none transition-all text-sm font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Max Age
                </label>
                <input
                  type="number"
                  value={suggestedAgeMax}
                  onChange={(e) =>
                    setSuggestedAgeMax(parseInt(e.target.value) || 17)
                  }
                  min={4}
                  max={17}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-grass-green focus:ring-4 focus:ring-grass-green/10 outline-none transition-all text-sm font-bold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-sunshine-yellow/10">
                <DollarSign className="w-5 h-5 text-sunshine-yellow" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Pricing</h3>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={isFree}
                  onChange={() => {
                    setIsFree(true);
                    setPrice(0);
                  }}
                  className="w-5 h-5 text-grass-green focus:ring-grass-green"
                />
                <span className="text-sm font-black text-gray-900">
                  Free Exam
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!isFree}
                  onChange={() => {
                    setIsFree(false);
                    setPrice(99);
                  }}
                  className="w-5 h-5 text-hot-pink focus:ring-hot-pink"
                />
                <span className="text-sm font-black text-gray-900">
                  Paid Exam
                </span>
              </label>
            </div>

            {!isFree && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-sunshine-yellow/10 border-2 border-sunshine-yellow/20 max-w-sm">
                <div className="p-2 rounded-xl bg-white shadow-sm">
                  <DollarSign className="w-4 h-4 text-sunshine-yellow" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">
                    Fixed Price: ₹99
                  </p>
                  <p className="text-[10px] font-bold text-gray-500">
                    All paid exams have a standard fee of ₹99.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-hot-pink/10">
                <Settings className="w-5 h-5 text-hot-pink" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Settings</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-5 h-5 text-sky-blue focus:ring-sky-blue rounded"
                />
                <div>
                  <span className="text-sm font-black text-gray-900 block">
                    Shuffle Questions
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    Randomize question order for each student
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-5 h-5 text-brand-purple focus:ring-brand-purple rounded"
                />
                <div>
                  <span className="text-sm font-black text-gray-900 block">
                    Shuffle Options
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    Randomize answer options (A, B, C, D)
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all">
                <input
                  type="checkbox"
                  checked={showResultsImmediately}
                  onChange={(e) => setShowResultsImmediately(e.target.checked)}
                  className="w-5 h-5 text-grass-green focus:ring-grass-green rounded"
                />
                <div>
                  <span className="text-sm font-black text-gray-900 block">
                    Show Results Immediately
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    Display results right after submission
                  </span>
                </div>
              </label>
            </div>
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
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Exam
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
