import { MOCK_ACTIVITY } from "@/lib/mockParentData";

export default function RecentActivity() {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black font-nunito text-gray-900">Recent Activity</h2>
        <select className="bg-gray-50 border-none text-xs font-bold text-gray-500 rounded-lg px-2 py-1 outline-none">
            <option>All Children</option>
            <option>Amy</option>
            <option>Ben</option>
        </select>
      </div>
      
      <div className="space-y-6">
        {MOCK_ACTIVITY.map((activity) => (
          <div key={activity.id} className="flex gap-4 relative pl-4 border-l-2 border-gray-100 last:border-0 pb-4 last:pb-0">
             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-purple border-4 border-white shadow-sm"></div>
             <div>
                <p className="text-sm text-gray-800">
                    <span className="font-bold">{activity.childName}</span> {activity.action}
                    {activity.detail && <span className="font-bold text-brand-purple"> {activity.detail}</span>}
                </p>
                <p className="text-xs font-bold text-gray-400 mt-1">{activity.timeAgo}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
