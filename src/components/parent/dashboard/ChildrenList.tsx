import { Plus, Star } from "lucide-react";
import { MOCK_CHILDREN } from "@/lib/mockParentData";
import Link from "next/link";

export default function ChildrenList() {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black font-nunito text-gray-900">My Children</h2>
        <button className="flex items-center gap-2 text-sm font-bold text-brand-purple hover:bg-brand-purple/5 px-3 py-1.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Child
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_CHILDREN.map((child) => (
          <div key={child.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-6">
              <img src={child.avatar} alt={child.name} className="w-16 h-16 rounded-full border-4 border-gray-50 bg-gray-50 group-hover:scale-105 transition-transform" />
              <div>
                <h3 className="text-lg font-black font-nunito text-gray-900">{child.name}</h3>
                <p className="text-xs font-bold text-gray-400">@{child.username} • {child.age} yrs</p>
                <div className="mt-1 inline-flex items-center gap-1 bg-sunshine-yellow/10 px-2 py-0.5 rounded-lg">
                    <Star className="w-3 h-3 text-sunshine-yellow fill-sunshine-yellow" />
                    <span className="text-xs font-bold text-amber-700">Lvl {child.level}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-xs font-bold text-gray-400 uppercase">Posts</p>
                <p className="text-xl font-black text-gray-900 font-nunito">{child.totalPosts}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-xs font-bold text-gray-400 uppercase">Total XP</p>
                <p className="text-xl font-black text-gray-900 font-nunito">{child.totalXP}</p>
              </div>
            </div>
            
            <Link href={`/parent/child/${child.id}`} className="block w-full text-center bg-brand-purple text-white font-bold py-3 rounded-xl hover:bg-brand-purple/90 transition-colors shadow-lg shadow-brand-purple/20">
              View Details
            </Link>
          </div>
        ))}
        
        {/* Add Child Card */}
        <button className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-brand-purple hover:text-brand-purple hover:bg-brand-purple/5 transition-all group h-full min-h-[240px]">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8" />
          </div>
          <span className="font-bold">Add Another Child</span>
        </button>
      </div>
    </div>
  );
}
