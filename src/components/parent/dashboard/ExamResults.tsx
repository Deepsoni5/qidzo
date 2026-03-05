"use client";

import { useEffect, useState } from "react";
import { 
  Award, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  Loader2, 
  Trophy,
  AlertCircle
} from "lucide-react";
import { getChildrenExamResults } from "@/actions/parent";
import { formatDistanceToNow } from "date-fns";

export default function ExamResults({ showTitle = true }: { showTitle?: boolean }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getChildrenExamResults();
        if (data) setResults(data);
      } catch (err) {
        console.error("Error fetching exam results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`bg-white rounded-[40px] p-12 text-center border-2 border-dashed border-gray-100 ${showTitle ? 'mb-12' : ''}`}>
        <div className="w-20 h-20 rounded-3xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-brand-purple" />
        </div>
        <h3 className="text-2xl font-black font-nunito text-gray-900 mb-2">
          No Exam Results Yet 📝
        </h3>
        <p className="text-gray-500 font-bold max-w-sm mx-auto">
          Your children haven't completed any school exams yet. Results will appear here once they finish their attempts!
        </p>
      </div>
    );
  }

  return (
    <div className={showTitle ? "mb-12" : ""}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black font-nunito text-gray-900">Exam Results 📊</h2>
            <p className="text-gray-500 font-bold">Track your children's performance in school exams.</p>
          </div>
          <div className="bg-brand-purple/10 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-purple" />
            <span className="text-brand-purple font-black">{results.length} {results.length === 1 ? 'Exam' : 'Exams'} Taken</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((attempt) => {
          const isPassed = attempt.score_obtained >= attempt.exam.pass_marks;
          const percentage = Math.round((attempt.score_obtained / attempt.exam.total_marks) * 100);
          
          return (
            <div 
              key={attempt.id} 
              className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-gray-50 hover:border-brand-purple/20 hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
            >
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 px-6 py-1.5 transform rotate-45 translate-x-8 translate-y-2 font-black text-[10px] uppercase tracking-widest text-white shadow-sm ${isPassed ? 'bg-grass-green' : 'bg-hot-pink'}`}>
                {isPassed ? 'Passed' : 'Target'}
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="relative shrink-0">
                  <img 
                    src={attempt.child?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${attempt.child?.username}`} 
                    alt={attempt.child?.name} 
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-100 shadow-sm"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${isPassed ? 'bg-grass-green' : 'bg-hot-pink'}`}>
                    {isPassed ? <CheckCircle className="w-4 h-4 text-white" /> : <AlertCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black font-nunito text-gray-900 truncate">
                    {attempt.child?.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-gray-400">@{attempt.child?.username}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-xs font-bold text-brand-purple">{attempt.exam?.subject || "General"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/80 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    {attempt.exam?.school?.logo_url ? (
                      <img src={attempt.exam.school.logo_url} className="w-6 h-6 object-contain" alt="School" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-brand-purple" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">School Exam</p>
                    <h4 className="text-sm font-black text-gray-900 truncate leading-tight">
                      {attempt.exam?.title}
                    </h4>
                  </div>
                </div>
                
                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Taken {formatDistanceToNow(new Date(attempt.submitted_at), { addSuffix: true })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-gray-50 rounded-2xl p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isPassed ? 'bg-grass-green/10 text-grass-green' : 'bg-hot-pink/10 text-hot-pink'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Score</p>
                    <p className="text-lg font-black font-nunito text-gray-900 leading-none">
                      {attempt.score_obtained}/{attempt.exam.total_marks}
                    </p>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-50 rounded-2xl p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isPassed ? 'bg-grass-green/10 text-grass-green' : 'bg-hot-pink/10 text-hot-pink'}`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Percent</p>
                    <p className="text-lg font-black font-nunito text-gray-900 leading-none">
                      {percentage}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
