"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Play,
  Globe,
  Lock,
  Loader2,
  BookOpen,
  RefreshCw,
  X,
  Download,
  Search,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

type ResourceType = "video" | "image" | "pdf";

interface Resource {
  id: string;
  resource_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  type: ResourceType;
  file_url: string;
  thumbnail_url: string | null;
  is_private: boolean;
  created_at: string;
  school: { name: string; logo_url: string | null; school_id: string } | null;
}

interface SchoolGroup {
  school_id: string;
  name: string;
  logo_url: string | null;
  resources: Resource[];
}

const TYPE_META: Record<
  ResourceType,
  { emoji: string; label: string; color: string; bg: string }
> = {
  video: {
    emoji: "🎬",
    label: "Video",
    color: "text-red-500",
    bg: "bg-red-50 border-red-100",
  },
  image: {
    emoji: "🖼️",
    label: "Image",
    color: "text-sky-500",
    bg: "bg-sky-50 border-sky-100",
  },
  pdf: {
    emoji: "📄",
    label: "PDF",
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-100",
  },
};

export default function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<SchoolGroup | null>(
    null,
  );
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [viewer, setViewer] = useState<Resource | null>(null);

  const fetchResources = async (bust = false) => {
    try {
      const url = bust ? "/api/resources/list?bust=1" : "/api/resources/list";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setResources(data.resources || []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Group resources by school
  const schoolGroups = useMemo<SchoolGroup[]>(() => {
    const map = new Map<string, SchoolGroup>();
    resources.forEach((r) => {
      const key = r.school?.school_id ?? "unknown";
      if (!map.has(key)) {
        map.set(key, {
          school_id: key,
          name: r.school?.name ?? "Unknown School",
          logo_url: r.school?.logo_url ?? null,
          resources: [],
        });
      }
      map.get(key)!.resources.push(r);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [resources]);

  // Filter school list by search query
  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schoolGroups;
    return schoolGroups.filter((s) => s.name.toLowerCase().includes(q));
  }, [schoolGroups, search]);

  // Resources inside selected school, filtered by type
  const schoolResources = useMemo(() => {
    if (!selectedSchool) return [];
    return selectedSchool.resources.filter(
      (r) => filterType === "all" || r.type === filterType,
    );
  }, [selectedSchool, filterType]);

  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedSchool(null);
    setSearch("");
    fetchResources(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
          <p className="font-black text-gray-400 font-nunito">
            Loading tutorials...
          </p>
        </div>
      </div>
    );
  }

  // ── School detail view ────────────────────────────────────────────────────
  if (selectedSchool) {
    return (
      <div className="space-y-5">
        {/* Back bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedSchool(null);
              setFilterType("all");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {selectedSchool.logo_url ? (
              <img
                src={selectedSchool.logo_url}
                alt=""
                className="w-7 h-7 rounded-xl object-contain bg-white border border-gray-100 p-0.5 shrink-0"
              />
            ) : (
              <span className="text-lg shrink-0">🏫</span>
            )}
            <p className="font-black text-gray-900 font-nunito truncate">
              {selectedSchool.name}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-gray-500 hover:text-brand-purple shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "video", "image", "pdf"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border ${
                filterType === t
                  ? "bg-brand-purple text-white border-brand-purple shadow-md shadow-brand-purple/20"
                  : "bg-white text-gray-500 border-gray-200 hover:border-brand-purple/40"
              }`}
            >
              {t === "all"
                ? `All (${selectedSchool.resources.length})`
                : `${TYPE_META[t].emoji} ${TYPE_META[t].label}`}
            </button>
          ))}
        </div>

        {/* Resource grid */}
        {schoolResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-5xl">📭</div>
            <p className="font-black text-gray-600 font-nunito">
              No {filterType === "all" ? "" : TYPE_META[filterType].label + " "}
              resources yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl">
            {schoolResources.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onClick={() => setViewer(r)}
              />
            ))}
          </div>
        )}

        {viewer && (
          <ViewerModal resource={viewer} onClose={() => setViewer(null)} />
        )}
      </div>
    );
  }

  // ── School list view ──────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Search + refresh */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-gray-500 hover:text-brand-purple shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Empty state */}
      {filteredSchools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center text-5xl">
            {search ? "🔍" : "📚"}
          </div>
          <p className="font-black text-xl text-gray-700 font-nunito">
            {search ? `No schools matching "${search}"` : "No tutorials yet"}
          </p>
          <p className="text-sm font-bold text-gray-400 text-center max-w-xs">
            {search
              ? "Try a different school name"
              : "Your teachers will upload videos, images, and PDFs here 🎓"}
          </p>
        </div>
      )}

      {/* School cards grid */}
      {filteredSchools.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 max-w-5xl">
          {filteredSchools.map((school, i) => (
            <SchoolCard
              key={school.school_id}
              school={school}
              index={i}
              onClick={() => {
                setSelectedSchool(school);
                setFilterType("all");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SchoolCard ────────────────────────────────────────────────────────────────
const CARD_PALETTES = [
  {
    grad: "from-violet-500 to-purple-600",
    ring: "ring-violet-300",
    logoBg: "bg-violet-50",
    btn: "bg-violet-600 hover:bg-violet-700 shadow-violet-400/30",
  },
  {
    grad: "from-pink-500 to-rose-500",
    ring: "ring-pink-300",
    logoBg: "bg-pink-50",
    btn: "bg-pink-500   hover:bg-pink-600   shadow-pink-400/30",
  },
  {
    grad: "from-sky-500 to-cyan-500",
    ring: "ring-sky-300",
    logoBg: "bg-sky-50",
    btn: "bg-sky-500    hover:bg-sky-600    shadow-sky-400/30",
  },
  {
    grad: "from-amber-400 to-orange-500",
    ring: "ring-amber-300",
    logoBg: "bg-amber-50",
    btn: "bg-amber-500  hover:bg-amber-600  shadow-amber-400/30",
  },
  {
    grad: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-300",
    logoBg: "bg-emerald-50",
    btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-400/30",
  },
];

function SchoolCard({
  school,
  onClick,
  index = 0,
}: {
  school: SchoolGroup;
  onClick: () => void;
  index?: number;
}) {
  const p = CARD_PALETTES[index % CARD_PALETTES.length];
  const total = school.resources.length;
  const counts = {
    video: school.resources.filter((r) => r.type === "video").length,
    image: school.resources.filter((r) => r.type === "image").length,
    pdf: school.resources.filter((r) => r.type === "pdf").length,
  };

  return (
    <div className="group bg-white rounded-[28px] border border-gray-100 shadow-md hover:shadow-2xl hover:shadow-gray-300/40 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col">
      {/* ── Hero banner — pure gradient, NO resource images ── */}
      <div
        className={`relative h-40 bg-linear-to-br ${p.grad} flex items-center justify-center overflow-hidden shrink-0`}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Wavy arc decoration */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full opacity-10"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
        >
          <path d="M0,20 C100,40 300,0 400,20 L400,40 L0,40 Z" fill="white" />
        </svg>

        {/* Logo */}
        <div
          className={`relative z-10 w-20 h-20 rounded-[22px] ${p.logoBg} ring-4 ${p.ring} flex items-center justify-center shadow-2xl overflow-hidden`}
        >
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={school.name}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <span className="text-4xl select-none">🏫</span>
          )}
        </div>

        {/* Resource count pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-black/25 backdrop-blur-md rounded-full border border-white/20">
          <span className="text-white text-[11px] font-black">{total}</span>
          <span className="text-white/70 text-[10px] font-bold">
            resource{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* School name */}
        <div>
          <h3 className="font-black text-gray-900 font-nunito text-base leading-snug line-clamp-2">
            {school.name}
          </h3>
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["video", "image", "pdf"] as ResourceType[]).map((t) =>
            counts[t] > 0 ? (
              <span
                key={t}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${TYPE_META[t].bg} ${TYPE_META[t].color}`}
              >
                {TYPE_META[t].emoji} {counts[t]} {TYPE_META[t].label}
                {counts[t] !== 1 ? "s" : ""}
              </span>
            ) : null,
          )}
        </div>

        {/* Spacer pushes button to bottom */}
        <div className="flex-1" />

        {/* CTA */}
        <button
          onClick={onClick}
          className={`w-full py-3 rounded-2xl text-white text-sm font-black shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98] ${p.btn}`}
        >
          <BookOpen className="w-4 h-4" />
          View Resources
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ── ResourceCard ──────────────────────────────────────────────────────────────
function ResourceCard({
  resource,
  onClick,
}: {
  resource: Resource;
  onClick: () => void;
}) {
  const meta = TYPE_META[resource.type];

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
    >
      <div
        className={`h-1.5 w-full ${resource.type === "video" ? "bg-red-400" : resource.type === "image" ? "bg-sky-400" : "bg-amber-400"}`}
      />

      <div className="relative h-36 bg-gray-900 flex items-center justify-center overflow-hidden">
        {resource.thumbnail_url ? (
          <img
            src={resource.thumbnail_url}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : resource.type === "image" ? (
          <img
            src={resource.file_url}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <span className="text-5xl">{meta.emoji}</span>
          </div>
        )}

        {resource.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        <div
          className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black border ${meta.bg} ${meta.color}`}
        >
          {meta.emoji} {meta.label}
        </div>

        <div
          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${resource.is_private ? "bg-black/50 text-gray-300" : "bg-sky-500/20 text-sky-400 border border-sky-500/30"}`}
        >
          {resource.is_private ? (
            <Lock className="w-2.5 h-2.5" />
          ) : (
            <Globe className="w-2.5 h-2.5" />
          )}
          {resource.is_private ? "School" : "Public"}
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
      </div>

      <div className="p-4">
        {resource.subject && (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-purple/10 rounded-full mb-2">
            <BookOpen className="w-3 h-3 text-brand-purple" />
            <span className="text-[10px] font-black text-brand-purple">
              {resource.subject}
            </span>
          </div>
        )}
        <h3 className="font-black text-gray-900 font-nunito text-base leading-tight line-clamp-2 mb-1">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-xs font-bold text-gray-400 line-clamp-2">
            {resource.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── ViewerModal ───────────────────────────────────────────────────────────────
function ViewerModal({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-3xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {resource.subject && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-purple/10 rounded-full mb-1.5">
                <BookOpen className="w-3 h-3 text-brand-purple" />
                <span className="text-[10px] font-black text-brand-purple">
                  {resource.subject}
                </span>
              </div>
            )}
            <h2 className="font-black text-gray-900 font-nunito text-lg leading-tight line-clamp-2">
              {resource.title}
            </h2>
            {resource.school?.name && (
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                {resource.school.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={resource.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center min-h-0">
          {resource.type === "video" && (
            <video
              src={resource.file_url}
              controls
              autoPlay
              className="w-full max-h-[60vh] object-contain"
            />
          )}
          {resource.type === "image" && (
            <img
              src={resource.file_url}
              alt={resource.title}
              className="w-full max-h-[60vh] object-contain"
            />
          )}
          {resource.type === "pdf" && (
            <iframe
              src={`${resource.file_url}#toolbar=1`}
              className="w-full h-[60vh]"
              title={resource.title}
            />
          )}
        </div>

        {resource.description && (
          <div className="px-5 py-3 border-t border-gray-100 shrink-0">
            <p className="text-sm font-bold text-gray-500">
              {resource.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
