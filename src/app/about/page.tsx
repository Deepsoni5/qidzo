import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Shield,
  Zap,
  Star,
  Users,
  BookOpen,
  Trophy,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Globe,
} from "lucide-react";

const STATS = [
  { value: "4–17", label: "Age Range", emoji: "🎒" },
  { value: "3+", label: "Content Types", emoji: "📚" },
  { value: "100%", label: "Safe & Moderated", emoji: "🛡️" },
  { value: "∞", label: "Learning Fun", emoji: "🚀" },
];

const VALUES = [
  {
    icon: <Shield className="w-6 h-6" />,
    emoji: "🛡️",
    title: "Safe by Design",
    desc: "Every feature is built with child safety first — moderated content, private school spaces, and parent oversight baked in.",
    color: "from-sky-400 to-cyan-500",
    bg: "bg-sky-50",
    border: "border-sky-100",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    emoji: "⚡",
    title: "Gamified Learning",
    desc: "XP points, badges, leaderboards — we make studying feel like playing so kids actually want to come back.",
    color: "from-sunshine-yellow to-amber-400",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    emoji: "❤️",
    title: "Community First",
    desc: "Kids share, comment, and cheer each other on in a positive, encouraging environment that builds confidence.",
    color: "from-hot-pink to-rose-500",
    bg: "bg-pink-50",
    border: "border-pink-100",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    emoji: "🎓",
    title: "School-Powered",
    desc: "Schools upload tutorials, run live classes, and set exams — all in one place, accessible to their students instantly.",
    color: "from-brand-purple to-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    emoji: "🌍",
    title: "Inclusive Access",
    desc: "Public resources are free for all kids. Private school content stays within the school community — no confusion.",
    color: "from-grass-green to-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: <Star className="w-6 h-6" />,
    emoji: "⭐",
    title: "Kid-First Design",
    desc: "Big fonts, bright colors, playful emojis — every pixel is designed to delight a child, not overwhelm them.",
    color: "from-orange-400 to-amber-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
];

const FOUNDERS = [
  {
    name: "Kiran Biradar",
    role: "Co-Founder",
    edu: "B.Sc (CS)",
    exp: "5+ Years Experience",
    image: "/pf1.jpeg",
    bio: "With over 5 years of solid experience in Finance, Kiran brings a robust entrepreneurial and operational background spanning fintech, fashion-tech, and manpower industries. He possesses an exceptional ability to understand user psychology and align large teams toward a common mission. His practical experience in managing complex operations makes him the ideal co-founder — ensuring Qidzo builds a scalable, people-first platform that delivers seamless learning experiences.",
    color: "from-brand-purple to-hot-pink",
    ring: "ring-brand-purple/30",
    badge: "bg-brand-purple/10 text-brand-purple",
    expBadge: "bg-hot-pink/10 text-hot-pink",
  },
  {
    name: "Balakrishna Cherukuri",
    role: "Founder",
    edu: "M.Tech (IT) & MBA (HR)",
    exp: "15+ Years Experience",
    image: "/pf2.jpeg",
    bio: "Backed with 15+ years of hands-on entrepreneurial and finance experience, Bala has built and operated multiple ventures across foodtech, HR tech, staffing, and technology-driven industries. Known for his clarity, sharp decision-making, and team-building abilities, he drives Qidzo with a clear purpose — to create a transparent global ecosystem where learning becomes the core of every child's growth journey.",
    color: "from-sky-500 to-brand-purple",
    ring: "ring-sky-400/30",
    badge: "bg-sky-500/10 text-sky-600",
    expBadge: "bg-grass-green/10 text-grass-green",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-linear-to-br from-brand-purple/10 via-hot-pink/5 to-sky-blue/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 -left-20 w-64 h-64 bg-sunshine-yellow/15 rounded-full blur-3xl -z-10" />
        <div className="absolute top-10 -right-20 w-64 h-64 bg-hot-pink/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-sm font-black text-brand-purple">
              Our Story
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-nunito text-gray-900 leading-tight mb-6">
            Learning should feel like{" "}
            <span className="relative inline-block">
              <span className="bg-linear-to-r from-brand-purple to-hot-pink bg-clip-text text-transparent">
                play
              </span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,5 Q50,0 100,5 Q150,10 200,5"
                  stroke="url(#uline)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="uline" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </span>{" "}
            ✨
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Qidzo is a safe, gamified social learning platform built for kids
            aged 4–17. We blend the engagement of Instagram with the educational
            depth of Khan Academy — so every child loves coming back to learn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-2xl font-black text-sm shadow-lg shadow-brand-purple/30 hover:scale-105 transition-all"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-black text-sm hover:border-brand-purple/40 hover:text-brand-purple transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="py-10 px-4 bg-brand-purple">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl mb-1">{s.emoji}</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-nunito">
                {s.value}
              </div>
              <div className="text-white/70 text-xs font-bold mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sunshine-yellow/20 border border-sunshine-yellow/30 rounded-full mb-5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-amber-700">
                  Our Mission
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-nunito text-gray-900 leading-tight mb-5">
                Every child deserves a{" "}
                <span className="text-brand-purple">joyful</span> path to
                knowledge 🌟
              </h2>
              <p className="text-gray-600 font-medium leading-relaxed mb-4">
                We built Qidzo because we saw a gap — kids were glued to social
                media but disengaged from learning. So we asked: what if school
                content felt as exciting as a feed?
              </p>
              <p className="text-gray-600 font-medium leading-relaxed mb-6">
                The result is a platform where schools run live classes, upload
                tutorials, and set exams — while kids earn XP, collect badges,
                and share their learning journey with friends. All in a
                completely safe, moderated environment.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "📱 Mobile-First",
                  "🎮 Gamified",
                  "🔒 Safe",
                  "🏫 School-Ready",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-black text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="bg-linear-to-br from-brand-purple/10 to-hot-pink/10 rounded-[32px] p-8 border border-brand-purple/10">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      emoji: "🎥",
                      label: "Live Classes",
                      color: "bg-red-50 border-red-100",
                    },
                    {
                      emoji: "📄",
                      label: "Tutorials",
                      color: "bg-amber-50 border-amber-100",
                    },
                    {
                      emoji: "🏆",
                      label: "Leaderboards",
                      color: "bg-yellow-50 border-yellow-100",
                    },
                    {
                      emoji: "📝",
                      label: "Exams",
                      color: "bg-violet-50 border-violet-100",
                    },
                    {
                      emoji: "💬",
                      label: "Social Feed",
                      color: "bg-pink-50 border-pink-100",
                    },
                    {
                      emoji: "⭐",
                      label: "XP & Badges",
                      color: "bg-sky-50 border-sky-100",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`${item.color} border rounded-2xl p-3 flex items-center gap-2`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-xs font-black text-gray-700">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-sunshine-yellow rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-200 rotate-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-grass-green/15 border border-grass-green/25 rounded-full mb-4">
              <Star className="w-4 h-4 text-grass-green" />
              <span className="text-xs font-black text-grass-green">
                What We Stand For
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-nunito text-gray-900">
              Our Core Values 💎
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className={`${v.bg} border ${v.border} rounded-[24px] p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-linear-to-br ${v.color} flex items-center justify-center text-white mb-4 shadow-md`}
                >
                  {v.icon}
                </div>
                <h3 className="font-black text-gray-900 font-nunito text-base mb-2">
                  {v.emoji} {v.title}
                </h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founders ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-hot-pink/10 border border-hot-pink/20 rounded-full mb-4">
              <Users className="w-4 h-4 text-hot-pink" />
              <span className="text-xs font-black text-hot-pink">
                The People Behind Qidzo
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-nunito text-gray-900">
              Meet the Founders 👋
            </h2>
            <p className="text-gray-500 font-medium mt-3 max-w-xl mx-auto">
              Two builders with a shared belief — that every child deserves
              access to world-class learning, wrapped in joy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {FOUNDERS.map((f) => (
              <div
                key={f.name}
                className="bg-white rounded-[32px] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Gradient header */}
                <div
                  className={`relative h-32 bg-brand-purple overflow-hidden`}
                >
                  {/* Dot pattern */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, white 1.5px, transparent 1.5px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </div>

                {/* Avatar — overlaps header */}
                <div className="px-6 pb-6">
                  <div
                    className={`relative -mt-12 mb-4 w-24 h-24 rounded-[22px] ring-4 ${f.ring} ring-offset-2 overflow-hidden shadow-xl bg-white`}
                  >
                    <Image
                      src={f.image}
                      alt={f.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  {/* Name + role */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-black font-nunito text-gray-900">
                        {f.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${f.badge}`}
                        >
                          {f.role}
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          {f.edu}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-black ${f.expBadge}`}
                    >
                      {f.exp}
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">
                    {f.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-brand-purple rounded-[36px] p-10 sm:p-14 text-center overflow-hidden shadow-2xl shadow-brand-purple/20">
            {/* Decorations */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1.5px, transparent 1.5px)",
                backgroundSize: "22px 22px",
              }}
            />

            <div className="relative z-10">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-3xl sm:text-4xl font-black font-nunito text-white mb-4 leading-tight">
                Ready to make learning awesome?
              </h2>
              <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto">
                Join thousands of kids and schools already on Qidzo. It's free
                to get started.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 px-7 py-3.5 bg-white text-brand-purple rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all"
                >
                  Join as a Kid <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/school/sign-up"
                  className="flex items-center gap-2 px-7 py-3.5 bg-white/15 border border-white/30 text-white rounded-2xl font-black text-sm hover:bg-white/25 transition-all"
                >
                  Register Your School 🏫
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
