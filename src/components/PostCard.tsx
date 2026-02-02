import { Heart, MessageCircle, Trophy, MoreHorizontal } from "lucide-react";
import Image from "next/image";

interface PostProps {
  user: {
    name: string;
    avatar: string;
    age: number;
    timeAgo: string;
  };
  category: string;
  text: string;
  image: string;
  likes: number;
  comments: number;
  badge?: string;
}

export default function PostCard({ post }: { post: PostProps }) {
  return (
    <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/30 border-4 border-white overflow-hidden mb-8 hover:border-brand-purple/20 transition-all duration-300">
      {/* Post Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full p-1 bg-brand-purple">
            <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-2xl shadow-inner">
              {post.user.avatar}
            </div>
          </div>
          <div>
            <h3 className="font-nunito font-extrabold text-gray-900 text-lg leading-tight">
              {post.user.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-sunshine-yellow text-amber-900 text-[10px] font-black uppercase">
                Age {post.user.age}
              </span>
              <p className="text-xs font-bold text-gray-400">
                {post.user.timeAgo}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <MoreHorizontal className="w-6 h-6 text-gray-400" />
          </button>
          <span className="px-4 py-1.5 rounded-full bg-sky-blue text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
            {post.category}
          </span>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <p className="text-gray-800 font-bold text-lg leading-relaxed font-nunito">
          {post.text}
        </p>
      </div>

      {/* Post Media */}
      <div className="relative mx-4 rounded-[24px] aspect-[4/3] bg-gray-100 overflow-hidden shadow-inner border-2 border-gray-50">
        <img
          src={post.image}
          alt="Post content"
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
        />
        {post.badge && (
          <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border-2 border-brand-purple animate-bounce">
            <Trophy className="w-5 h-5 text-sunshine-yellow fill-sunshine-yellow" />
            <span className="text-xs font-black text-brand-purple uppercase">{post.badge}</span>
          </div>
        )}
      </div>

        {/* Bottom Bar */}
        <div className="p-5 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-gray-100 hover:border-hot-pink hover:text-hot-pink transition-all group shadow-sm">
              <Heart className="w-5 h-5 text-gray-400 group-hover:text-hot-pink group-hover:fill-hot-pink transition-colors" />
              <span className="text-sm font-black text-gray-600 group-hover:text-hot-pink">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-gray-100 hover:border-sky-blue hover:text-sky-blue transition-all group shadow-sm">
              <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-sky-blue transition-colors" />
              <span className="text-sm font-black text-gray-600 group-hover:text-sky-blue">{post.comments}</span>
            </button>
          </div>
          
          <button className="bg-brand-purple text-white px-6 py-2.5 rounded-full font-nunito font-black text-sm shadow-lg shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all">
            Share Magic ✨
          </button>
        </div>
    </div>
  );
}
