import { Heart, MessageCircle, Trophy, MoreHorizontal, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FeedPost {
  id: string;
  post_id: string;
  child_id: string;
  category_id: string;
  title: string | null;
  content: string;
  media_type: "IMAGE" | "VIDEO" | "NONE";
  media_url: string | null;
  media_thumbnail: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  child: {
    name: string;
    username: string;
    avatar: string | null;
    age: number;
    level: number;
  };
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

// Helper to render dynamic Lucide icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  let IconComponent = (LucideIcons as any)[name];
  if (!IconComponent && name) {
    const pascalName = name
      .split(/[-_ ]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
    IconComponent = (LucideIcons as any)[pascalName];
  }
  if (!IconComponent) return <Sparkles className={className} />;
  return <IconComponent className={className} />;
};

export default function PostCard({ post }: { post: FeedPost }) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  
  // Use a deterministic color if category color is missing or invalid
  const categoryColor = post.category?.color || "#8B5CF6";
  const avatarUrl = post.child?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.child?.username || "kid"}`;

  return (
    <div 
      className="bg-white rounded-[32px] shadow-xl shadow-gray-200/30 border-4 overflow-hidden mb-8 hover:shadow-2xl transition-all duration-300"
      style={{ borderColor: categoryColor }}
    >
      {/* Post Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/child/${post.child?.username}`} className="block relative group">
             <div className="w-14 h-14 rounded-full p-1 bg-gradient-to-br from-brand-purple to-hot-pink group-hover:scale-105 transition-transform duration-200">
               <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner relative">
                  <Image 
                    src={avatarUrl} 
                    alt={post.child?.name || "User"} 
                    fill
                    className="object-cover"
                  />
               </div>
             </div>
          </Link>
          <div>
            <Link href={`/child/${post.child?.username}`} className="hover:underline decoration-brand-purple decoration-2 underline-offset-2">
               <h3 className="font-nunito font-extrabold text-gray-900 text-lg leading-tight">
                 {post.child?.name}
               </h3>
            </Link>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-sunshine-yellow text-amber-900 text-[10px] font-black uppercase">
                Lvl {post.child?.level || 1}
              </span>
              <p className="text-xs font-bold text-gray-400">
                {timeAgo}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
            <MoreHorizontal className="w-6 h-6 text-gray-400" />
          </button>
          <div 
            className="px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1"
            style={{ backgroundColor: categoryColor }}
          >
            <DynamicIcon name={post.category?.icon} className="w-3 h-3" />
            {post.category?.name}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        {post.title && (
            <h4 className="font-black text-xl mb-2 text-gray-900">{post.title}</h4>
        )}
        <p className="text-gray-800 font-bold text-lg leading-relaxed font-nunito whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post Media */}
      {post.media_type !== "NONE" && post.media_url && (
        <div className="relative w-full aspect-[4/3] bg-black/5 overflow-hidden group shadow-inner">
          {post.media_type === "IMAGE" ? (
             <div className="relative w-full h-full">
                <Image
                  src={post.media_url}
                  alt="Post content"
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-105"
                />
             </div>
          ) : (
            <video 
              src={post.media_url} 
              controls 
              className="w-full h-full object-cover bg-black" 
              poster={post.media_thumbnail || undefined}
            />
          )}
        </div>
      )}

        {/* Bottom Bar */}
        <div className="p-5 flex items-center justify-between bg-gray-50/50 mt-2">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-gray-100 hover:border-hot-pink hover:text-hot-pink transition-all group shadow-sm cursor-pointer active:scale-95">
              <Heart className="w-5 h-5 text-gray-400 group-hover:text-hot-pink group-hover:fill-hot-pink transition-colors" />
              <span className="text-sm font-black text-gray-600 group-hover:text-hot-pink">{post.likes_count || 0}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-gray-100 hover:border-sky-blue hover:text-sky-blue transition-all group shadow-sm cursor-pointer active:scale-95">
              <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-sky-blue transition-colors" />
              <span className="text-sm font-black text-gray-600 group-hover:text-sky-blue">{post.comments_count || 0}</span>
            </button>
          </div>
          
          <button className="bg-brand-purple text-white px-6 py-2.5 rounded-full font-nunito font-black text-sm shadow-lg shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
            Share Magic <Sparkles className="w-4 h-4" />
          </button>
        </div>
    </div>
  );
}
