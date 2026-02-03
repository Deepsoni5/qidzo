"use client";

import { useParams } from "next/navigation";
import { MOCK_CHILDREN, MOCK_POSTS } from "@/lib/mockParentData";
import { ArrowLeft, Star, Heart, MessageCircle, Trophy, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ChildDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  // Find child or default to first
  const child = MOCK_CHILDREN.find(c => c.id === id) || MOCK_CHILDREN[0];
  
  // Filter posts (mock filtering)
  const posts = MOCK_POSTS; 

  const badges = [
    { name: "First Post", icon: "🚀", date: "2 days ago" },
    { name: "50 Likes", icon: "❤️", date: "1 week ago" },
    { name: "Science Wiz", icon: "🧪", date: "2 weeks ago" },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-20 lg:pb-0">
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-brand-purple mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-purple/20 to-hot-pink/20"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12">
            <div className="relative">
                <img src={child.avatar} alt={child.name} className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-50" />
                <div className="absolute -bottom-2 -right-2 bg-sunshine-yellow text-amber-900 text-xs font-black px-3 py-1 rounded-full shadow-sm border-2 border-white">
                    Lvl {child.level}
                </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-black font-nunito text-gray-900">{child.name}</h1>
                <p className="text-gray-500 font-bold">@{child.username} • {child.age} years old</p>
                <p className="text-brand-purple font-bold mt-1">{child.levelTitle}</p>
            </div>

            <div className="flex gap-4">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl text-center border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">XP</p>
                    <p className="text-2xl font-black text-brand-purple font-nunito">{child.totalXP}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl text-center border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Posts</p>
                    <p className="text-2xl font-black text-hot-pink font-nunito">{child.totalPosts}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Badges & Stats */}
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-black font-nunito text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-sunshine-yellow fill-sunshine-yellow" /> Badges Earned
                </h2>
                <div className="space-y-4">
                    {badges.map((badge, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                            <span className="text-2xl">{badge.icon}</span>
                            <div>
                                <p className="font-bold text-gray-900">{badge.name}</p>
                                <p className="text-xs font-bold text-gray-400">{badge.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-black font-nunito text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-brand-purple fill-brand-purple" /> Overall Stats
                </h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500">Total Likes Received</span>
                        <span className="font-black text-gray-900">142</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500">Comments Received</span>
                        <span className="font-black text-gray-900">38</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500">Challenges Won</span>
                        <span className="font-black text-gray-900">5</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Posts Grid */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-black font-nunito text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" /> Recent Posts
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-all">
                        <div className="relative h-48 w-full">
                            <Image src={post.image} alt="Post" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                                {post.category}
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="font-bold text-gray-900 line-clamp-2 mb-3">{post.caption}</p>
                            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                <span>{post.timestamp}</span>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 text-hot-pink"><Heart className="w-3 h-3 fill-hot-pink" /> {post.likes}</span>
                                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
