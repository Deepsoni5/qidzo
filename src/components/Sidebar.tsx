import { getChildSession } from "@/actions/auth";
import { getChildProfile } from "@/actions/profile";
import { Trophy, Crown, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserStatsCard } from "./UserStatsCard";
import { supabase } from "@/lib/supabaseClient";

const rankConfig = [
  {
    medal: "🥇",
    border: "border-amber-200",
    bg: "bg-linear-to-r from-amber-50 to-yellow-50",
    xpBg: "bg-amber-100 text-amber-700",
  },
  {
    medal: "🥈",
    border: "border-slate-200",
    bg: "bg-linear-to-r from-slate-50 to-gray-50",
    xpBg: "bg-slate-100 text-slate-600",
  },
  {
    medal: "🥉",
    border: "border-orange-200",
    bg: "bg-linear-to-r from-orange-50 to-amber-50",
    xpBg: "bg-orange-100 text-orange-600",
  },
];

export default async function Sidebar() {
  const session = await getChildSession();

  const [profile, { data: topWizards }] = await Promise.all([
    session
      ? getChildProfile(session.username as string)
      : Promise.resolve(null),
    supabase
      .from("children")
      .select("child_id, name, username, avatar, xp_points, level")
      .eq("is_active", true)
      .order("xp_points", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="hidden lg:flex flex-col gap-6 sticky top-28 h-[calc(100vh-120px)] overflow-y-auto beautiful-scrollbar pb-10 pr-2">
      {/* 1. Weekly Reward */}
      <div className="bg-linear-to-br from-sunshine-yellow to-orange-400 rounded-[32px] p-1 shadow-xl shadow-orange-200/50 transition-transform hover:scale-[1.02] cursor-pointer">
        <div className="bg-white/90 backdrop-blur-sm rounded-[28px] p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Trophy className="w-24 h-24 text-sunshine-yellow" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-linear-to-br from-sunshine-yellow to-orange-500 p-3 rounded-2xl shadow-lg text-white">
              <Trophy className="w-8 h-8 fill-white" />
            </div>
            <div>
              <h3 className="font-nunito font-black text-gray-800 text-lg leading-none mb-1">
                Weekly Reward
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Claim your prize!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Your Magic Stats */}
      <UserStatsCard initialProfile={profile} />

      {/* 3. Top Magicians Leaderboard */}
      <div className="bg-white rounded-[32px] border-4 border-gray-100 shadow-xl shadow-gray-200/50 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-sunshine-yellow/20 rounded-2xl">
            <Crown className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="font-nunito font-black text-xl text-gray-900 leading-none">
              Top Magicians ✨
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-0.5">
              By XP Points
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(topWizards ?? []).map((kid, i) => {
            const cfg = rankConfig[i];
            const avatarSrc =
              kid.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${kid.username}`;
            return (
              <Link
                key={kid.child_id}
                href={`/child/${kid.username}`}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${cfg.border} ${cfg.bg} hover:scale-[1.02] transition-transform`}
              >
                <span className="text-xl w-7 text-center shrink-0">
                  {cfg.medal}
                </span>

                <div className="w-11 h-11 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden relative shrink-0">
                  <Image
                    src={avatarSrc}
                    alt={kid.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-nunito font-black text-gray-800 text-sm leading-tight">
                    {kid.name}
                  </p>
                  <p className="text-xs text-gray-400 font-bold">
                    Lvl {kid.level ?? 1}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black shrink-0 ${cfg.xpBg}`}
                >
                  <Zap className="w-3 h-3 fill-current" />
                  {(kid.xp_points ?? 0).toLocaleString()}
                </div>
              </Link>
            );
          })}

          {(!topWizards || topWizards.length === 0) && (
            <p className="text-center text-sm text-gray-400 font-bold py-4">
              No wizards yet! 🧙
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
