export const MOCK_CHILDREN = [
  {
    id: "1",
    name: "Amy",
    username: "amy_sparkles",
    age: 8,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amy",
    totalPosts: 42,
    totalXP: 1250,
    level: 5,
    levelTitle: "Creative Explorer",
  },
  {
    id: "2",
    name: "Ben",
    username: "ben_builder",
    age: 10,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ben",
    totalPosts: 35,
    totalXP: 980,
    level: 4,
    levelTitle: "Junior Architect",
  },
];

export const MOCK_ACTIVITY = [
  { id: 1, childId: "1", childName: "Amy", action: "posted in Art", timeAgo: "2 hours ago" },
  { id: 2, childId: "2", childName: "Ben", action: "earned a badge", timeAgo: "5 hours ago", detail: "Master Builder 🏆" },
  { id: 3, childId: "1", childName: "Amy", action: "completed a challenge", timeAgo: "1 day ago", detail: "Science Fair 🧪" },
  { id: 4, childId: "2", childName: "Ben", action: "commented on a post", timeAgo: "1 day ago" },
  { id: 5, childId: "1", childName: "Amy", action: "reached Level 5", timeAgo: "2 days ago" },
];

export const MOCK_POSTS = [
  {
    id: 101,
    childName: "Amy",
    childAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amy",
    category: "Art",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
    caption: "My rainbow drawing! 🌈",
    timestamp: "2 hours ago",
    likes: 12,
  },
  {
    id: 102,
    childName: "Ben",
    childAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ben",
    category: "Science",
    image: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&q=80",
    caption: "Volcano experiment went BOOM! 🌋",
    timestamp: "1 day ago",
    likes: 24,
  },
  {
    id: 103,
    childName: "Amy",
    childAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amy",
    category: "Music",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    caption: "Playing the piano 🎹",
    timestamp: "3 days ago",
    likes: 8,
  },
];

export const MOCK_STATS = {
  totalChildren: 2,
  postsThisWeek: 12,
  learningHours: 5.5,
};

export const CHART_DATA_POSTS = [
  { day: "Mon", posts: 2 },
  { day: "Tue", posts: 4 },
  { day: "Wed", posts: 1 },
  { day: "Thu", posts: 5 },
  { day: "Fri", posts: 3 },
  { day: "Sat", posts: 8 },
  { day: "Sun", posts: 6 },
];

export const CHART_DATA_CATEGORIES = [
  { name: "Art", value: 40, fill: "#EC4899" }, // hot-pink
  { name: "Science", value: 30, fill: "#0EA5E9" }, // sky-blue
  { name: "Music", value: 15, fill: "#FBBF24" }, // sunshine-yellow
  { name: "Stories", value: 15, fill: "#10B981" }, // grass-green
];
