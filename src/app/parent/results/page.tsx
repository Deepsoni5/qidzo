"use client";

import { ArrowLeft, Award } from "lucide-react";
import Link from "next/link";
import ExamResults from "@/components/parent/dashboard/ExamResults";

export default function ResultsPage() {
  return (
    <div className="animate-in fade-in duration-500 pb-20 lg:pb-0">
      <div className="mb-8">
        <Link 
          href="/parent/dashboard" 
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-purple transition-colors bg-gray-100 hover:bg-brand-purple/10 px-4 py-2.5 rounded-2xl w-fit mb-6 border-2 border-transparent active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-nunito text-gray-900">
              Exam Results 📝
            </h1>
            <p className="text-gray-500 font-bold">Comprehensive view of your children's performance.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-8 border-2 border-gray-50 shadow-sm">
        <ExamResults showTitle={false} />
      </div>
    </div>
  );
}
