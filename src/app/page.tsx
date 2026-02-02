import Navbar from "@/components/Navbar";
import CategoryBar from "@/components/CategoryBar";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

const SAMPLE_POSTS = [
  {
    user: { name: "Leo", avatar: "🦁", age: 8, timeAgo: "2h ago" },
    category: "Art & Drawing",
    text: "I drew my favorite superhero today! I call him Captain Sparkle! ✨🦸‍♂️",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
    likes: 12,
    comments: 5,
    badge: "Master Artist 🎨"
  },
  {
    user: { name: "Zoe", avatar: "🦄", age: 10, timeAgo: "4h ago" },
    category: "Science",
    text: "Look at my volcano experiment! It actually erupted with pink lava! 🌋💖",
    image: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&q=80",
    likes: 24,
    comments: 8,
    badge: "Future Scientist 🧪"
  },
  {
    user: { name: "Sam", avatar: "🦊", age: 7, timeAgo: "1h ago" },
    category: "Stories",
    text: "My first story about a dragon who loved eating broccoli! 🐉🥦",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    likes: 18,
    comments: 3
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      
      <main className="pt-16 pb-24 lg:pb-0">
        <CategoryBar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar (Desktop Only) */}
            <div className="hidden xl:block w-64 shrink-0">
              <div className="sticky top-40 bg-white p-6 rounded-[32px] border-4 border-gray-100 shadow-xl shadow-gray-200/20">
                <h3 className="font-nunito font-black text-xl mb-6 text-gray-900">Explore! 🚀</h3>
                <ul className="space-y-4">
                  {[
                    { label: "Home", icon: "🏠", color: "text-brand-purple bg-brand-purple/10", active: true },
                    { label: "Tutorials", icon: "📺", color: "text-sky-blue hover:bg-sky-blue/10", active: false },
                    { label: "Play Zone", icon: "🎮", color: "text-hot-pink hover:bg-hot-pink/10", active: false },
                    { label: "Friends", icon: "👥", color: "text-grass-green hover:bg-grass-green/10", active: false },
                  ].map((item, i) => (
                    <li key={i} className={`flex items-center gap-3 p-3 rounded-2xl font-nunito font-black cursor-pointer transition-all duration-300 ${item.color} ${item.active ? 'scale-105 shadow-sm' : 'hover:scale-105'}`}>
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm tracking-tight">{item.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 p-4 bg-sunshine-yellow/10 rounded-[24px] border-2 border-sunshine-yellow/20">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 text-center">Pro Tip! 💡</p>
                  <p className="text-[11px] font-bold text-amber-900 text-center leading-relaxed">
                    Completing challenges earns you 2x XP this week!
                  </p>
                </div>
              </div>
            </div>

            {/* Main Feed */}
            <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
              <div className="space-y-6">
                {SAMPLE_POSTS.map((post, i) => (
                  <PostCard key={i} post={post} />
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-80 shrink-0">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
