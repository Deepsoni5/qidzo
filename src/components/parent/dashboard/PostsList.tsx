"use client";
import { getChildrenRecentPosts } from "@/actions/parent";
import { Heart, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function PostsList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const data = await getChildrenRecentPosts();
      setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
      <h2 className="text-xl font-black font-nunito text-gray-900 mb-6">Recent Posts</h2>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-bold text-gray-400">No posts found from your children.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="flex gap-3 md:gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
              {post.media_url && (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-100">
                  <Image src={post.media_url} alt="Post" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full inline-block mb-1">{post.category?.name || "General"}</span>
                          <h4 className="font-bold text-gray-900 truncate text-sm md:text-base">{post.caption || post.title || "Untitled Post"}</h4>
                      </div>
                      <span className="text-xs font-bold text-gray-400 whitespace-nowrap flex-shrink-0 pt-1">{formatTimestamp(post.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                          {post.child?.avatar ? (
                            <img src={post.child.avatar} className="w-4 h-4 rounded-full" alt="avatar" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-brand-purple/20" />
                          )}
                          <span className="truncate max-w-[80px] md:max-w-none">{post.child?.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-hot-pink">
                          <Heart className="w-3 h-3 fill-hot-pink" /> {post.likes_count || 0}
                      </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
