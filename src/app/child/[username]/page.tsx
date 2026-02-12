import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Trophy, ArrowLeft, Users, UserCheck } from "lucide-react";

import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import Sidebar from "@/components/Sidebar";
import ProfileFeed from "@/components/ProfileFeed";
import { getChildProfile, getChildPosts } from "@/actions/profile";
import { getCurrentUserRole } from "@/actions/auth";
import { FollowButton } from "@/components/FollowButton";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getChildProfile(username);

  if (!profile) {
    return {
      title: "Child Not Found | Qidzo",
    };
  }

  return {
    title: `${profile.name} (@${profile.username}) | Qidzo`,
    description: `Check out ${profile.name}'s magic on Qidzo!`,
  };
}

export default async function ChildProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getChildProfile(username);
  const userRole = await getCurrentUserRole();

  if (!profile) {
    notFound();
  }

  const posts = await getChildPosts(profile.child_id);

  // Calculate stats
  const totalLikes = posts.reduce((acc, post) => acc + (post.likes_count || 0), 0);
  
  const avatarUrl = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;

  // Determine if we should show the follow button
  // Hide ONLY if the current logged-in child is viewing their own profile
  const isOwnProfile = userRole.isChild && (userRole.child as any)?.id === profile.child_id;
  const showFollowButton = !isOwnProfile;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      
      <main className="pt-24 pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar (Desktop Only) */}
            <LeftSidebar />

            {/* Main Content */}
            <div className="flex-1 max-w-2xl mx-auto lg:mx-0 w-full">
              
              {/* Go Home Button */}
              <div className="mb-6">
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-full font-black shadow-sm hover:shadow-md hover:scale-105 transition-all border-2 border-gray-100 group"
                >
                  <div className="bg-gray-100 p-1 rounded-full group-hover:bg-brand-purple group-hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Back to Home
                </Link>
              </div>

              {/* Profile Header Card */}
              <div className="bg-white rounded-[40px] shadow-xl shadow-brand-purple/5 border-4 border-white overflow-hidden mb-8 relative">
                {/* Playful Bubbly Banner */}
                <div className="h-56 relative overflow-hidden bg-[#8B5CF6]">
                    {/* Main Gradient Mesh */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#FBBF24_0%,_transparent_40%),radial-gradient(circle_at_bottom_left,_#EC4899_0%,_transparent_40%),radial-gradient(circle_at_center,_#8B5CF6_0%,_transparent_100%)] opacity-90"></div>
                    
                    {/* Bubbly Overlay Pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]"></div>
                    
                    {/* Floating Orbs/Bubbles */}
                    <div className="absolute top-4 left-10 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute bottom-8 right-20 w-32 h-32 bg-sunshine-yellow/30 rounded-full blur-3xl"></div>
                    <div className="absolute -top-10 right-0 w-40 h-40 bg-hot-pink/20 rounded-full blur-3xl"></div>
                    
                    {/* Cute Wave Divider at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-white" style={{ clipPath: "ellipse(70% 100% at 50% 100%)" }}></div>
                </div>

                {/* Profile Info */}
                <div className="px-8 pb-8 relative -mt-4">
                    {/* Avatar */}
                    <div className="absolute -top-24 left-8 p-1.5 bg-white rounded-full shadow-xl shadow-black/5 z-10">
                        <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden relative border-4 border-white shadow-inner group cursor-pointer">
                            <Image 
                                src={avatarUrl} 
                                alt={profile.name} 
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-gradient-to-r from-sunshine-yellow to-orange-400 text-white px-3 py-1 rounded-full text-xs font-black uppercase shadow-lg border-2 border-white flex items-center gap-1">
                            <Trophy className="w-3 h-3 fill-white" />
                            Lvl {profile.level}
                        </div>
                    </div>

                    {/* Name & Bio */}
                    <div className="pt-12 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 font-nunito mb-1 tracking-tight">{profile.name}</h1>
                            <p className="text-gray-400 font-bold text-lg">@{profile.username}</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                             {showFollowButton && (
                                <FollowButton 
                                  targetId={profile.child_id} 
                                  targetType="CHILD" 
                                  className="px-6 py-2.5 text-sm shadow-lg shadow-brand-purple/20"
                                />
                             )}
                             <button className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-full font-black hover:bg-gray-200 transition-all cursor-pointer hover:scale-105 active:scale-95">
                                👋 Say Hi
                             </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-sky-50/50 rounded-2xl p-4 text-center border-2 border-sky-100 hover:border-sky-200 transition-colors group cursor-default">
                            <div className="text-sky-500 font-black text-2xl group-hover:scale-110 transition-transform duration-300">{profile.total_posts}</div>
                            <div className="text-sky-900/60 text-xs font-bold uppercase tracking-wide">Magic Created</div>
                        </div>
                        <div className="bg-brand-purple/5 rounded-2xl p-4 text-center border-2 border-brand-purple/10 hover:border-brand-purple/20 transition-colors group cursor-default">
                            <div className="text-brand-purple font-black text-2xl group-hover:scale-110 transition-transform duration-300">{profile.followers_count}</div>
                            <div className="text-brand-purple/60 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1">
                                <Users className="w-3 h-3" /> Followers
                            </div>
                        </div>
                        <div className="bg-hot-pink/5 rounded-2xl p-4 text-center border-2 border-hot-pink/10 hover:border-hot-pink/20 transition-colors group cursor-default">
                            <div className="text-hot-pink font-black text-2xl group-hover:scale-110 transition-transform duration-300">{profile.following_count}</div>
                            <div className="text-hot-pink/60 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1">
                                <UserCheck className="w-3 h-3" /> Following
                            </div>
                        </div>
                        <div className="bg-amber-50/50 rounded-2xl p-4 text-center border-2 border-amber-100 hover:border-amber-200 transition-colors group cursor-default">
                            <div className="text-amber-500 font-black text-2xl group-hover:scale-110 transition-transform duration-300">{profile.xp_points}</div>
                            <div className="text-amber-900/60 text-xs font-bold uppercase tracking-wide">XP Power</div>
                        </div>
                    </div>
                </div>
              </div>

              {/* Client-side Feed with Tabs */}
              <ProfileFeed posts={posts} profileName={profile.name} />

            </div>

            {/* Right Sidebar */}
            <div className="lg:w-80 shrink-0 hidden lg:block">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
