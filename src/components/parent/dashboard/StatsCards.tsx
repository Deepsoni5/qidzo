import { Users, FileText, Clock } from "lucide-react";
import { MOCK_STATS } from "@/lib/mockParentData";

export default function StatsCards() {
  const stats = [
    { label: "Total Children", value: MOCK_STATS.totalChildren, icon: Users, color: "text-brand-purple", bg: "bg-brand-purple/10" },
    { label: "Posts This Week", value: MOCK_STATS.postsThisWeek, icon: FileText, color: "text-hot-pink", bg: "bg-hot-pink/10" },
    { label: "Learning Hours", value: `${MOCK_STATS.learningHours}h`, icon: Clock, color: "text-sunshine-yellow", bg: "bg-sunshine-yellow/10" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className={`p-4 rounded-2xl ${stat.bg}`}>
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{stat.label}</p>
            <p className="text-3xl font-black text-gray-900 font-nunito">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
