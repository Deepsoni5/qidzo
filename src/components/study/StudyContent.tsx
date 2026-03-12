"use client";

import { useState } from "react";
import { BookOpen, GraduationCap } from "lucide-react";
import ExamsTab from "./ExamsTab";

interface StudyContentProps {
  initialExams?: any[];
}

export default function StudyContent({ initialExams = [] }: StudyContentProps) {
  const [activeTab, setActiveTab] = useState<"exams" | "tutorials">("exams");

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900 mb-2">
            Study Hub 📚
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Take exams, watch tutorials, and learn new things!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("exams")}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all relative cursor-pointer ${
              activeTab === "exams"
                ? "text-brand-purple"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            Exams
            {activeTab === "exams" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("tutorials")}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all relative cursor-pointer ${
              activeTab === "tutorials"
                ? "text-brand-purple"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Tutorials
            {activeTab === "tutorials" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "exams" && <ExamsTab initialExams={initialExams} />}
        {activeTab === "tutorials" && (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-brand-purple" />
            </div>
            <h3 className="text-xl font-bold font-nunito text-gray-900 mb-2">
              Tutorials Coming Soon! 🎬
            </h3>
            <p className="text-sm text-gray-600">
              We're working on bringing you amazing video tutorials
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
