"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Globe,
  Lock,
  Image,
  FileText,
  Loader2,
  Upload,
  X,
  BookOpen,
  Play,
  Eye,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  createResource,
  deleteResource,
  getSchoolResources,
} from "@/actions/resources";

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
}

const TYPE_META: Record<
  ResourceType,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  video: {
    icon: <Play className="w-3.5 h-3.5" />,
    label: "Video",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  image: {
    icon: <Image className="w-3.5 h-3.5" />,
    label: "Image",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  pdf: {
    icon: <FileText className="w-3.5 h-3.5" />,
    label: "PDF",
    color: "text-sunshine-yellow",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
};

const SUBJECTS = [
  "Math",
  "Science",
  "English",
  "History",
  "Geography",
  "Art",
  "Music",
  "PE",
  "Other",
];

export default function SchoolResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");

  const load = async () => {
    setLoading(true);
    const data = await getSchoolResources();
    setResources((data as Resource[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Delete this resource? This cannot be undone.")) return;
    const res = await deleteResource(resourceId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Resource deleted");
    setResources((prev) => prev.filter((r) => r.resource_id !== resourceId));
  };

  const filtered =
    filterType === "all"
      ? resources
      : resources.filter((r) => r.type === filterType);

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900">
              Tutorials & Resources 📚
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Upload videos, images, and PDFs for your students
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple text-white rounded-2xl font-black text-sm shadow-lg shadow-brand-purple/25 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Upload
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "video", "image", "pdf"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border ${
                filterType === t
                  ? "bg-brand-purple text-white border-brand-purple shadow-md shadow-brand-purple/20"
                  : "bg-white text-gray-500 border-gray-200 hover:border-brand-purple/40"
              }`}
            >
              {t === "all" ? "All" : TYPE_META[t].label}
            </button>
          ))}
          <span className="ml-auto text-xs font-bold text-gray-400 self-center">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-brand-purple/10 flex items-center justify-center text-4xl">
              📂
            </div>
            <p className="font-black text-lg text-gray-700 font-nunito">
              No resources yet
            </p>
            <p className="text-sm font-bold text-gray-400 text-center max-w-xs">
              Upload your first video, image, or PDF to get started 🚀
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-brand-purple text-white rounded-2xl font-black text-sm shadow-lg shadow-brand-purple/25 hover:scale-[1.02] transition-all cursor-pointer"
            >
              Upload Resource
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onDelete={() => handleDelete(r.resource_id)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={(r) => {
            setResources((prev) => [r as Resource, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── ResourceCard ──────────────────────────────────────────────────────────────
function ResourceCard({
  resource,
  onDelete,
}: {
  resource: Resource;
  onDelete: () => void;
}) {
  const meta = TYPE_META[resource.type];

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/60 transition-all duration-300 overflow-hidden group">
      {/* Thumbnail / preview area */}
      <div className="relative h-36 bg-gray-900 flex items-center justify-center overflow-hidden">
        {resource.thumbnail_url ? (
          <img
            src={resource.thumbnail_url}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : resource.type === "image" ? (
          <img
            src={resource.file_url}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-60">
            {resource.type === "video" ? (
              <Play className="w-10 h-10 text-white" />
            ) : (
              <FileText className="w-10 h-10 text-white" />
            )}
          </div>
        )}
        {/* Type badge */}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black border ${meta.bg} ${meta.color}`}
        >
          {meta.icon} {meta.label}
        </div>
        {/* Privacy badge */}
        <div
          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${resource.is_private ? "bg-black/50 text-gray-300" : "bg-sky-500/20 text-sky-400 border border-sky-500/30"}`}
        >
          {resource.is_private ? (
            <Lock className="w-2.5 h-2.5" />
          ) : (
            <Globe className="w-2.5 h-2.5" />
          )}
          {resource.is_private ? "Private" : "Public"}
        </div>
        {/* Hover overlay with view link */}
        <a
          href={resource.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-2xl text-white text-xs font-black">
            <Eye className="w-3.5 h-3.5" /> View
          </div>
        </a>
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
        <h3 className="font-black text-gray-900 font-nunito text-sm leading-tight line-clamp-2 mb-1">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-xs font-bold text-gray-400 line-clamp-2 mb-3">
            {resource.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400">
            {new Date(resource.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-xl text-red-400 hover:bg-red-50 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UploadModal ───────────────────────────────────────────────────────────────
type UploadPhase = "idle" | "uploading" | "saving" | "done";

function formatEta(seconds: number): string {
  if (seconds < 5) return "almost done...";
  if (seconds < 60) return `~${Math.ceil(seconds)}s left`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return `~${m}m ${s}s left`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1024 * 1024)
    return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
}

function UploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (r: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<ResourceType | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Upload progress state
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0); // 0–100
  const [speed, setSpeed] = useState(0); // bytes/sec
  const [eta, setEta] = useState(0); // seconds remaining
  const [uploadedBytes, setUploadedBytes] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const startTimeRef = useRef<number>(0);

  const uploading = phase === "uploading" || phase === "saving";

  const detectType = (f: File): ResourceType => {
    if (f.type.startsWith("video/")) return "video";
    if (f.type.startsWith("image/")) return "image";
    return "pdf";
  };

  const handleFile = (f: File) => {
    if (f.size > 100 * 1024 * 1024) {
      toast.error("File must be under 100MB");
      return;
    }
    setFile(f);
    setFileType(detectType(f));
    setProgress(0);
    setPhase("idle");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleCancel = () => {
    xhrRef.current?.abort();
    setPhase("idle");
    setProgress(0);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!file || !fileType) {
      toast.error("Please select a file");
      return;
    }

    setPhase("uploading");
    setProgress(0);
    setSpeed(0);
    setEta(0);
    setUploadedBytes(0);
    startTimeRef.current = Date.now();

    try {
      // ── Step 1: XHR upload with real progress ──────────────────────────────
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "qidzo/school_resources");
      formData.append("resource_type", fileType === "pdf" ? "raw" : fileType);

      const url: string = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const bps = elapsed > 0 ? e.loaded / elapsed : 0;
          const remaining = bps > 0 ? (e.total - e.loaded) / bps : 0;
          setProgress(pct);
          setSpeed(bps);
          setEta(remaining);
          setUploadedBytes(e.loaded);
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.url);
            } catch {
              reject(new Error("Invalid server response"));
            }
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.addEventListener("abort", () =>
          reject(new Error("Upload cancelled")),
        );

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      // ── Step 2: Save to DB ─────────────────────────────────────────────────
      setPhase("saving");
      setProgress(100);

      const result = await createResource({
        title: title.trim(),
        description: description.trim() || undefined,
        subject: subject || undefined,
        type: fileType,
        file_url: url,
        is_private: isPrivate,
      });

      if (result.error) throw new Error(result.error);

      setPhase("done");
      toast.success("Resource uploaded! 🎉");
      // Brief pause so user sees the "done" state before modal closes
      await new Promise((r) => setTimeout(r, 900));
      onSuccess(result.data);
    } catch (err: any) {
      if (err.message !== "Upload cancelled") {
        toast.error(err.message || "Upload failed");
      }
      setPhase("idle");
      setProgress(0);
    }
  };

  // Gradient color for progress bar based on phase
  const barColor =
    phase === "done"
      ? "from-grass-green to-emerald-400"
      : phase === "saving"
        ? "from-sunshine-yellow to-amber-400"
        : "from-brand-purple to-hot-pink";

  return (
    <div className="fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col mb-16 sm:mb-0"
        style={{ maxHeight: "calc(100svh - 80px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-black font-nunito text-gray-900">
            Upload Resource 📤
          </h2>
          <button
            onClick={uploading ? undefined : onClose}
            disabled={uploading}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* ── Progress overlay (shown while uploading / saving / done) ── */}
          {phase !== "idle" && (
            <div className="rounded-[20px] overflow-hidden border border-gray-100 bg-gray-50">
              {/* Top gradient strip — animates width */}
              <div className="h-1.5 bg-gray-200 relative overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-linear-to-r ${barColor} transition-all duration-300 ease-out`}
                  style={{ width: `${progress}%` }}
                />
                {/* Shimmer sweep */}
                {phase === "uploading" && (
                  <div
                    className="absolute inset-y-0 w-24 bg-linear-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]"
                    style={{ left: `${Math.max(0, progress - 15)}%` }}
                  />
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* Phase label + percentage */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {phase === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-grass-green" />
                    ) : phase === "saving" ? (
                      <Loader2 className="w-4 h-4 text-sunshine-yellow animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-brand-purple animate-pulse" />
                    )}
                    <span className="text-sm font-black text-gray-800">
                      {phase === "done"
                        ? "Upload complete! 🎉"
                        : phase === "saving"
                          ? "Saving resource..."
                          : "Uploading to cloud..."}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-black tabular-nums ${phase === "done" ? "text-grass-green" : "text-brand-purple"}`}
                  >
                    {progress}%
                  </span>
                </div>

                {/* Progress bar (thick, rounded) */}
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-linear-to-r ${barColor} rounded-full transition-all duration-300 ease-out relative overflow-hidden`}
                    style={{ width: `${progress}%` }}
                  >
                    {phase === "uploading" && (
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
                    )}
                  </div>
                </div>

                {/* Stats row */}
                {phase === "uploading" && file && (
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-brand-purple" />
                      <span>
                        {speed > 0 ? formatSpeed(speed) : "Calculating..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-hot-pink" />
                      <span>{eta > 0 ? formatEta(eta) : "Estimating..."}</span>
                    </div>
                    <span className="text-gray-300">
                      {(uploadedBytes / 1024 / 1024).toFixed(1)} /{" "}
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drop zone — hidden while uploading */}
          {phase === "idle" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-brand-purple bg-brand-purple/5"
                  : file
                    ? "border-grass-green bg-grass-green/5"
                    : "border-gray-200 hover:border-brand-purple/50 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="video/*,image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${fileType === "video" ? "bg-red-100" : fileType === "image" ? "bg-sky-100" : "bg-yellow-100"}`}
                  >
                    {fileType === "video"
                      ? "🎬"
                      : fileType === "image"
                        ? "🖼️"
                        : "📄"}
                  </div>
                  <p className="font-black text-gray-800 text-sm truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs font-bold text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setFileType(null);
                    }}
                    className="text-xs font-black text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-300" />
                  <p className="font-black text-gray-600 text-sm">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs font-bold text-gray-400">
                    Video, Image, or PDF · Max 100MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form fields — disabled while uploading */}
          <fieldset
            disabled={uploading}
            className="space-y-5 disabled:opacity-60"
          >
            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5">
                Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Fractions"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all bg-white cursor-pointer"
              >
                <option value="">Select subject...</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this resource..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                {isPrivate ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : (
                  <Globe className="w-4 h-4 text-sky-500" />
                )}
                <div>
                  <p className="text-sm font-black text-gray-800">
                    {isPrivate ? "Private" : "Public"}
                  </p>
                  <p className="text-xs font-bold text-gray-400">
                    {isPrivate
                      ? "Only your school's students can see this"
                      : "Visible to all students on Qidzo"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${isPrivate ? "bg-brand-purple" : "bg-grass-green"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isPrivate ? "left-1" : "left-7"}`}
                />
              </button>
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3 bg-white sticky bottom-0">
          {phase === "uploading" && (
            <button
              onClick={handleCancel}
              className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 font-black text-sm hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={uploading || !file || !title.trim()}
            className="flex-1 py-3.5 bg-brand-purple text-white rounded-2xl font-black text-sm shadow-lg shadow-brand-purple/25 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {phase === "uploading" ? (
              <>
                <Zap className="w-4 h-4 animate-pulse" /> Uploading {progress}%
              </>
            ) : phase === "saving" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : phase === "done" ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Done!
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload Resource
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
