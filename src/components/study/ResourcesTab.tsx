"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Play,
  Globe,
  Lock,
  Loader2,
  BookOpen,
  RefreshCw,
  X,
  Search,
  ChevronRight,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Download,
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
  const searchParams = useSearchParams();
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

  // Auto-open resource from ?resource= deep link
  useEffect(() => {
    if (loading || resources.length === 0) return;
    const rid = searchParams.get("resource");
    if (!rid) return;
    const match = resources.find((r) => r.resource_id === rid);
    if (match) setViewer(match);
  }, [loading, resources, searchParams]);

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

  // Resources matching title/description search (shown when no school selected)
  const resourceSearchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null; // null = not in resource-search mode
    // Check if any school name matches — if so, show school cards instead
    const schoolMatch = schoolGroups.some((s) =>
      s.name.toLowerCase().includes(q),
    );
    if (schoolMatch) return null;
    // Search by title or description across all resources
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [resources, schoolGroups, search]);

  // School cards shown when not in resource-search mode
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
            placeholder="Search schools or resources..."
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

      {/* Resource search results (title/description match) */}
      {resourceSearchResults !== null && (
        <>
          {resourceSearchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center text-5xl">
                🔍
              </div>
              <p className="font-black text-xl text-gray-700 font-nunito">
                No resources matching "{search}"
              </p>
              <p className="text-sm font-bold text-gray-400 text-center max-w-xs">
                Try searching by school name, subject, or a different keyword
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                {resourceSearchResults.length} resource
                {resourceSearchResults.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl">
                {resourceSearchResults.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onClick={() => setViewer(r)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* School cards (shown when not in resource-search mode) */}
      {resourceSearchResults === null && (
        <>
          {filteredSchools.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center text-5xl">
                {search ? "🔍" : "📚"}
              </div>
              <p className="font-black text-xl text-gray-700 font-nunito">
                {search
                  ? `No schools matching "${search}"`
                  : "No tutorials yet"}
              </p>
              <p className="text-sm font-bold text-gray-400 text-center max-w-xs">
                {search
                  ? "Try a different school name or search by resource title"
                  : "Your teachers will upload videos, images, and PDFs here 🎓"}
              </p>
            </div>
          )}

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
        </>
      )}

      {viewer && (
        <ViewerModal resource={viewer} onClose={() => setViewer(null)} />
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
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://www.qidzo.com/study?resource=${resource.resource_id}`;
  const shareText = `📚 Check out "${resource.title}" on Qidzo! Learn something new today 🎓\n`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText + shareUrl)}`,
      "_blank",
    );
  };

  const shareInstagram = () => {
    // Instagram doesn't support direct link sharing — copy the Qidzo link
    handleCopy();
  };

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
          <div className="flex items-center gap-2 shrink-0 relative">
            {/* Share button */}
            <button
              onClick={() => setShowShare((v) => !v)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-brand-purple/10 text-gray-600 hover:text-brand-purple transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Share popover */}
            {showShare && (
              <div className="absolute top-10 right-0 z-10 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-52 flex flex-col gap-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 mb-1">
                  Share via
                </p>
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors cursor-pointer group"
                >
                  <span className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center text-white text-base shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.057 23.882l6.198-1.625A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.003-1.374l-.36-.214-3.68.965.981-3.595-.234-.369A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                    </svg>
                  </span>
                  <span className="text-sm font-black text-gray-700 group-hover:text-green-600">
                    WhatsApp
                  </span>
                </button>
                <button
                  onClick={shareInstagram}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer group"
                >
                  <span className="w-8 h-8 rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </span>
                  <span className="text-sm font-black text-gray-700 group-hover:text-pink-600">
                    Instagram
                    <span className="text-[10px] font-bold text-gray-400 block leading-none">
                      (copies link)
                    </span>
                  </span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-purple/5 transition-colors cursor-pointer group"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-grass-green" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400 group-hover:text-brand-purple" />
                  )}
                  <span
                    className={`text-sm font-black ${copied ? "text-grass-green" : "text-gray-700 group-hover:text-brand-purple"}`}
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </span>
                </button>
              </div>
            )}
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
