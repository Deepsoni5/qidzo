"use client";

import { useEffect, useState } from "react";
import {
  Video,
  Plus,
  Play,
  Trash2,
  Clock,
  Users,
  Globe,
  Lock,
  Loader2,
  Radio,
  CheckCircle2,
  Calendar,
  BookOpen,
  X,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  createLiveClass,
  getSchoolLiveClasses,
  deleteLiveClass,
  startLiveClass,
  getClassAttendees,
} from "@/actions/live-classes";
import { motion, AnimatePresence } from "framer-motion";

interface LiveClass {
  id: string;
  class_id: string;
  title: string;
  subject: string | null;
  description: string | null;
  status: "scheduled" | "live" | "ended";
  channel_name: string;
  is_private: boolean;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  attendee_count: number;
}

const STATUS_CONFIG = {
  scheduled: {
    label: "Scheduled",
    color: "text-sunshine-yellow",
    bg: "bg-sunshine-yellow/10",
    icon: Clock,
  },
  live: {
    label: "Live Now",
    color: "text-red-500",
    bg: "bg-red-500/10",
    icon: Radio,
  },
  ended: {
    label: "Ended",
    color: "text-gray-400",
    bg: "bg-gray-100",
    icon: CheckCircle2,
  },
};

export default function SchoolLivePage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [attendeesModal, setAttendeesModal] = useState<{
    classId: string;
    title: string;
  } | null>(null);
  const [attendeesList, setAttendeesList] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    scheduled_at: "",
    is_private: true,
  });

  const fetchClasses = async () => {
    const data = await getSchoolLiveClasses();
    setClasses((data as LiveClass[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    const res = await createLiveClass({
      title: form.title,
      subject: form.subject || undefined,
      description: form.description || undefined,
      scheduled_at: form.scheduled_at || undefined,
      is_private: form.is_private,
    });
    setCreating(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Class created! 🎉");
    setShowCreate(false);
    setForm({
      title: "",
      subject: "",
      description: "",
      scheduled_at: "",
      is_private: true,
    });
    fetchClasses();
  };

  const handleStart = async (cls: LiveClass) => {
    setStarting(cls.class_id);
    const res = await startLiveClass(cls.class_id);
    if (res.error) {
      setStarting(null);
      toast.error(res.error);
      return;
    }
    // keep starting state ON — show full-screen loader until navigation completes
    window.location.href = `/school/live/${cls.class_id}`;
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Delete this class?")) return;
    const res = await deleteLiveClass(classId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Class deleted");
    fetchClasses();
  };

  const openAttendees = async (cls: LiveClass) => {
    setAttendeesModal({ classId: cls.class_id, title: cls.title });
    setLoadingAttendees(true);
    const data = await getClassAttendees(cls.class_id);
    setAttendeesList(data ?? []);
    setLoadingAttendees(false);
  };

  const scheduled = classes.filter((c) => c.status === "scheduled");
  const live = classes.filter((c) => c.status === "live");
  const ended = classes.filter((c) => c.status === "ended");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Full-screen Go Live loader */}
      {starting && (
        <div className="fixed inset-0 z-100 bg-gray-950 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
              <Radio className="w-12 h-12 text-red-500" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-white font-black text-2xl font-nunito">
              Setting up your classroom...
            </p>
            <p className="text-gray-400 font-bold text-sm">
              Connecting to live stream 🎥
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black font-nunito text-gray-900 flex items-center gap-3">
            <span className="text-3xl">🎥</span> Live Classes
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1">
            {live.length > 0
              ? `🔴 ${live.length} class live right now`
              : `${scheduled.length} scheduled`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-purple text-white rounded-2xl font-black shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" /> New Class
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live now */}
          {live.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />{" "}
                Live Now
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {live.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    onStart={handleStart}
                    onDelete={handleDelete}
                    starting={starting}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Scheduled */}
          {scheduled.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-sunshine-yellow uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Scheduled
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {scheduled.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    onStart={handleStart}
                    onDelete={handleDelete}
                    starting={starting}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Ended */}
          {ended.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Past Classes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {ended.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    onStart={handleStart}
                    onDelete={handleDelete}
                    onViewAttendees={openAttendees}
                    starting={starting}
                  />
                ))}
              </div>
            </section>
          )}

          {classes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center text-5xl">
                🎥
              </div>
              <p className="font-black text-xl text-gray-700 font-nunito">
                No classes yet
              </p>
              <p className="text-sm font-bold text-gray-400">
                Create your first live class to get started
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-2xl font-black shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Class
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attendees Modal */}
      <AnimatePresence>
        {attendeesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAttendeesModal(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-linear-to-br from-brand-purple to-hot-pink p-5 flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-bold mb-0.5">
                    Attendance
                  </p>
                  <h3 className="text-white font-black font-nunito text-lg leading-tight">
                    {attendeesModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setAttendeesModal(null)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                {loadingAttendees ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
                  </div>
                ) : attendeesList.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">😶</div>
                    <p className="text-gray-400 font-bold text-sm">
                      No attendees recorded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendeesList.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"
                      >
                        <div className="w-9 h-9 rounded-full bg-brand-purple/10 flex items-center justify-center text-base shrink-0">
                          {a.child_id ? "👦" : "👤"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-black truncate">
                            {a.username ?? "Guest"}
                          </p>
                          <p className="text-gray-400 text-[11px] font-bold">
                            Joined{" "}
                            {new Date(a.joined_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-grass-green/10">
                          <CalendarCheck className="w-3 h-3 text-grass-green" />
                          <span className="text-grass-green text-[10px] font-black">
                            Attended
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 pb-4">
                <div className="flex items-center justify-center gap-6 py-3 bg-gray-50 rounded-2xl text-sm font-black">
                  <div className="text-center">
                    <p className="text-gray-900 text-lg">
                      {attendeesList.length}
                    </p>
                    <p className="text-gray-400 text-[10px] font-bold">Total</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-grass-green text-lg">
                      {attendeesList.filter((a) => a.child_id).length}
                    </p>
                    <p className="text-gray-400 text-[10px] font-bold">
                      Logged In
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-sunshine-yellow text-lg">
                      {attendeesList.filter((a) => !a.child_id).length}
                    </p>
                    <p className="text-gray-400 text-[10px] font-bold">
                      Guests
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 pt-6 sm:pt-4 [@media(min-height:700px)]:items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreate(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl sm:text-2xl font-black font-nunito text-gray-900">
                    New Live Class 🎥
                  </h2>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple outline-none font-bold text-gray-800 transition-all"
                      placeholder="e.g. Math Chapter 5 — Fractions"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, subject: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple outline-none font-bold text-gray-800 transition-all"
                      placeholder="e.g. Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple outline-none font-bold text-gray-800 transition-all resize-none h-20"
                      placeholder="What will students learn today?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Schedule (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, scheduled_at: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple outline-none font-bold text-gray-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                      Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          setForm((p) => ({ ...p, is_private: true }))
                        }
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer ${form.is_private ? "border-brand-purple bg-brand-purple/5 text-brand-purple" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}
                      >
                        <Lock className="w-4 h-4" /> Students Only
                      </button>
                      <button
                        onClick={() =>
                          setForm((p) => ({ ...p, is_private: false }))
                        }
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer ${!form.is_private ? "border-sky-blue bg-sky-blue/5 text-sky-blue" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}
                      >
                        <Globe className="w-4 h-4" /> Public
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Sticky footer buttons */}
              <div className="flex gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-100 font-black text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-3 rounded-2xl bg-brand-purple text-white font-black shadow-lg shadow-brand-purple/20 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClassCard({
  cls,
  onStart,
  onDelete,
  onViewAttendees,
  starting,
}: {
  cls: LiveClass;
  onStart: (cls: LiveClass) => void;
  onDelete: (id: string) => void;
  onViewAttendees?: (cls: LiveClass) => void;
  starting: string | null;
}) {
  const cfg = STATUS_CONFIG[cls.status];
  const StatusIcon = cfg.icon;
  const isStarting = starting === cls.class_id;

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Top strip */}
      <div
        className={`h-1.5 w-full ${cls.status === "live" ? "bg-red-500 animate-pulse" : cls.status === "scheduled" ? "bg-sunshine-yellow" : "bg-gray-200"}`}
      />

      <div className="p-5">
        {/* Status + privacy */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
          <span
            className={`flex items-center gap-1 text-[10px] font-bold ${cls.is_private ? "text-gray-400" : "text-sky-blue"}`}
          >
            {cls.is_private ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
            {cls.is_private ? "Private" : "Public"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-black text-gray-900 font-nunito text-lg leading-tight mb-1">
          {cls.title}
        </h3>
        {cls.subject && (
          <p className="text-xs font-bold text-brand-purple flex items-center gap-1 mb-2">
            <BookOpen className="w-3 h-3" /> {cls.subject}
          </p>
        )}
        {cls.description && (
          <p className="text-xs font-bold text-gray-400 mb-3 line-clamp-2">
            {cls.description}
          </p>
        )}

        {/* Time info */}
        {cls.scheduled_at && cls.status === "scheduled" && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(cls.scheduled_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {cls.started_at && cls.status === "live" && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Started{" "}
            {new Date(cls.started_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {cls.ended_at && cls.status === "ended" && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ended{" "}
              {new Date(cls.ended_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-brand-purple/10 rounded-xl text-xs font-black text-brand-purple">
              <Users className="w-3 h-3" />
              {cls.attendee_count ?? 0} attended
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          {cls.status === "scheduled" && (
            <div className="flex gap-2">
              <button
                onClick={() => onStart(cls)}
                disabled={isStarting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
              >
                {isStarting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Go Live
                  </>
                )}
              </button>
              <button
                onClick={() => onDelete(cls.class_id)}
                className="p-2.5 rounded-2xl border-2 border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {cls.status === "live" && (
            <Link
              href={`/school/live/${cls.class_id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all animate-pulse"
            >
              <Radio className="w-4 h-4" /> Rejoin Class
            </Link>
          )}
          {cls.status === "ended" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm">
                <CheckCircle2 className="w-4 h-4" /> Class Ended
              </div>
              {onViewAttendees && (
                <button
                  onClick={() => onViewAttendees(cls)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple rounded-2xl font-black text-sm transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4" /> View Attendees
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
