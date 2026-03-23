"use client";

import { useState } from "react";
import { BookOpen, GraduationCap, Video } from "lucide-react";
import ExamsTab from "./ExamsTab";
import TutorialsTab from "./TutorialsTab";

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
            <Video className="w-5 h-5" />
            Live Classes
            {activeTab === "tutorials" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "exams" && <ExamsTab initialExams={initialExams} />}
        {activeTab === "tutorials" && <TutorialsTab />}
      </div>
    </div>
  );
}
