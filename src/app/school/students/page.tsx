"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Loader2,
  GraduationCap,
  Star,
  Zap,
  RefreshCw,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface Student {
  id: string;
  child_id: string;
  name: string;
  username: string;
  avatar: string;
  age: number;
  gender: string;
  level: number;
  xp_points: number;
  is_active: boolean;
  created_at: string;
  city: string;
  country: string;
  school_name: string;
}

const LEVEL_COLORS = [
  "from-gray-400 to-gray-500",
  "from-grass-green to-emerald-600",
  "from-sky-blue to-blue-600",
  "from-brand-purple to-violet-700",
  "from-sunshine-yellow to-amber-500",
  "from-hot-pink to-rose-600",
];

const GENDER_EMOJI: Record<string, string> = {
  Male: "👦",
  Female: "👧",
  Other: "🧒",
  "Prefer not to say": "🧒",
};

export default function SchoolStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudents = async (bust = false) => {
    try {
      const url = bust ? "/api/school/students?bust=1" : "/api/school/students";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudents(true);
    toast.success("Student list refreshed");
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.child_id.toLowerCase().includes(search.toLowerCase()),
  );

  const levelColor = (level: number) =>
    LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
          <p className="font-black text-gray-400 font-nunito">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-black font-nunito text-gray-900 flex items-center gap-3">
              <span className="text-3xl">🎓</span> Students
            </h1>
            <p className="text-sm font-bold text-gray-400 mt-1">
              {students.length} student{students.length !== 1 ? "s" : ""}{" "}
              enrolled
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-gray-500 hover:text-brand-purple"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <Link
              href="/school/add-student"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-purple text-white rounded-2xl font-black shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username or ID..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-white focus:border-brand-purple outline-none font-bold text-gray-700 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center text-5xl">
            🎒
          </div>
          <p className="font-black text-xl text-gray-700 font-nunito">
            {search ? "No students found" : "No students yet"}
          </p>
          <p className="text-sm font-bold text-gray-400">
            {search
              ? "Try a different search term"
              : "Add your first student to get started"}
          </p>
          {!search && (
            <Link
              href="/school/add-student"
              className="mt-2 flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-2xl font-black shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add First Student
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((student) => {
            const gradientClass = levelColor(student.level);

            return (
              <div
                key={student.id}
                className="group bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Card top gradient strip */}
                <div
                  className={`h-2 w-full bg-gradient-to-r ${gradientClass}`}
                />

                <div className="p-5">
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative shrink-0">
                      <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientClass} blur-md opacity-40 scale-110`}
                      />
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <Image
                          src={
                            student.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`
                          }
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {/* Active dot */}
                      <div
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${student.is_active ? "bg-grass-green" : "bg-gray-300"}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 font-nunito truncate text-base leading-tight">
                        {student.name}
                        {student.gender && (
                          <span className="ml-1 text-sm">
                            {GENDER_EMOJI[student.gender] || "🧒"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-bold text-gray-400 truncate">
                        @{student.username}
                      </p>
                      <p className="text-[10px] font-bold text-gray-300 mt-0.5">
                        {student.child_id}
                      </p>
                    </div>

                    {/* Level badge */}
                    <div
                      className={`shrink-0 px-2.5 py-1 rounded-xl bg-gradient-to-br ${gradientClass} text-white text-xs font-black shadow-sm`}
                    >
                      Lv.{student.level}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-2xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Zap className="w-3 h-3 text-sunshine-yellow" />
                        <span className="text-xs font-black text-gray-900">
                          {student.xp_points.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                        XP
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <GraduationCap className="w-3 h-3 text-brand-purple" />
                        <span className="text-xs font-black text-gray-900">
                          {student.age}y
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                        Age
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Star
                          className={`w-3 h-3 ${student.is_active ? "text-grass-green" : "text-gray-300"}`}
                        />
                        <span
                          className={`text-xs font-black ${student.is_active ? "text-grass-green" : "text-gray-400"}`}
                        >
                          {student.is_active ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                        Status
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {(student.city || student.country) && (
                    <div className="flex items-center gap-1.5 mb-4 text-xs font-bold text-gray-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {[student.city, student.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Login credentials */}
                  <div className="bg-gradient-to-br from-brand-purple/5 to-sky-blue/5 rounded-2xl p-3.5 border border-brand-purple/10">
                    <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                      🔐 Login Credentials
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          Username
                        </span>
                        <span className="font-black font-mono text-sm text-gray-900">
                          {student.username}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          Password
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 italic">
                          set at creation 🔒
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-2 text-center">
                      Passwords are hashed — share them when creating the
                      account
                    </p>
                  </div>

                  {/* Joined date */}
                  <p className="text-[10px] font-bold text-gray-300 text-right mt-3">
                    Joined{" "}
                    {new Date(student.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
