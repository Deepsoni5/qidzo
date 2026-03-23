"use client";

import { useState } from "react";
import { GraduationCap, Video, BookOpen } from "lucide-react";
import ExamsTab from "./ExamsTab";
import TutorialsTab from "./TutorialsTab";
import ResourcesTab from "./ResourcesTab";

interface StudyContentProps {
  initialExams?: any[];
}

type Tab = "exams" | "live" | "tutorials";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "exams", label: "Exams", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "live", label: "Live Classes", icon: <Video className="w-4 h-4" /> },
  {
    id: "tutorials",
    label: "Tutorials",
    icon: <BookOpen className="w-4 h-4" />,
  },
];

export default function StudyContent({ initialExams = [] }: StudyContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("exams");

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
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all relative cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "text-brand-purple"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "exams" && <ExamsTab initialExams={initialExams} />}
        {activeTab === "live" && <TutorialsTab />}
        {activeTab === "tutorials" && <ResourcesTab />}
      </div>
    </div>
  );
}
