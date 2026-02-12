"use client";
import { getChildrenRecentActivity } from "@/actions/parent";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      const data = await getChildrenRecentActivity();
      setActivities(data);
      setLoading(false);
    }
    fetchActivity();
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black font-nunito text-gray-900">Recent Activity</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-bold text-gray-400">No recent activity found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 relative pl-4 border-l-2 border-gray-100 last:border-0 pb-4 last:pb-0">
               <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${activity.type === 'screen' ? 'bg-sky-blue' : 'bg-brand-purple'}`}></div>
               <div>
                  <p className="text-sm text-gray-800">
                      <span className="font-bold">{activity.childName}</span> {activity.action}
                      {activity.detail && <span className="font-bold text-brand-purple">: {activity.detail}</span>}
                  </p>
                  <p className="text-xs font-bold text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
