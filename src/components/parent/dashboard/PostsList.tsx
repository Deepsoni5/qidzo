import { MOCK_POSTS } from "@/lib/mockParentData";
import { Heart } from "lucide-react";
import Image from "next/image";

export default function PostsList() {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
      <h2 className="text-xl font-black font-nunito text-gray-900 mb-6">Recent Posts</h2>
      
      <div className="space-y-4">
        {MOCK_POSTS.map((post) => (
          <div key={post.id} className="flex gap-3 md:gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden relative flex-shrink-0">
                <Image src={post.image} alt="Post" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full inline-block mb-1">{post.category}</span>
                        <h4 className="font-bold text-gray-900 truncate text-sm md:text-base">{post.caption}</h4>
                    </div>
                    <span className="text-xs font-bold text-gray-400 whitespace-nowrap flex-shrink-0 pt-1">{post.timestamp}</span>
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <img src={post.childAvatar} className="w-4 h-4 rounded-full" alt="avatar" />
                        <span className="truncate max-w-[80px] md:max-w-none">{post.childName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-hot-pink">
                        <Heart className="w-3 h-3 fill-hot-pink" /> {post.likes}
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
