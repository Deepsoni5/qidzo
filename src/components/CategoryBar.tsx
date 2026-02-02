const categories = [
  { name: "Art & Drawing", emoji: "🎨", color: "bg-hot-pink" },
  { name: "Stories", emoji: "📚", color: "bg-sky-blue" },
  { name: "Music", emoji: "🎵", color: "bg-sunshine-yellow" },
  { name: "Sports", emoji: "🏃", color: "bg-grass-green" },
  { name: "Science", emoji: "🧪", color: "bg-brand-purple" },
  { name: "Puzzles", emoji: "🎮", color: "bg-hot-pink" },
  { name: "General", emoji: "🌍", color: "bg-sky-blue" },
];

export default function CategoryBar() {
  return (
<div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md py-3 border-b border-gray-100 overflow-x-auto no-scrollbar">
<div className="max-w-7xl mx-auto px-4 flex gap-3 min-w-max">
{categories.map((cat) => (
<button
key={cat.name}
className={`flex items-center gap-2 px-4 py-2 rounded-xl ${cat.color} text-white font-nunito font-black text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-2 border-white/20 whitespace-nowrap`}
>
<span className="text-base">{cat.emoji}</span>
<span>{cat.name}</span>
</button>
))}
</div>
</div>
  );
}
