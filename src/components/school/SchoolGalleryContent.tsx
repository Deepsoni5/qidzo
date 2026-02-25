"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
    Upload,
    X,
    Trash2,
    Play,
    Image as ImageIcon,
    Film,
    Plus,
    Loader2,
    Calendar,
    Tag,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    getSchoolGallery,
    addGalleryItem,
    deleteGalleryItem,
    type GalleryItem,
} from "@/actions/school";

// ─── helpers ──────────────────────────────────────────────────────────────────
const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";
const MAX_MB = 50;

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ─── Upload-drop zone ─────────────────────────────────────────────────────────
function DropZone({
    onFilesChosen,
    uploading,
}: {
    onFilesChosen: (files: File[]) => void;
    uploading: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const files = Array.from(e.dataTransfer.files);
            if (files.length) onFilesChosen(files);
        },
        [onFilesChosen]
    );

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 w-full h-52 rounded-[28px] border-2 border-dashed transition-all duration-300 cursor-pointer select-none
        ${dragging
                    ? "border-sky-400 bg-sky-50 scale-[1.01]"
                    : "border-gray-200 bg-gray-50/50 hover:border-sky-300 hover:bg-sky-50/30"
                }
        ${uploading ? "pointer-events-none opacity-60" : ""}
      `}
        >
            {uploading ? (
                <>
                    <Loader2 className="w-10 h-10 text-sky-blue animate-spin" />
                    <p className="text-sm font-black text-sky-blue uppercase tracking-widest animate-pulse">
                        Uploading…
                    </p>
                </>
            ) : (
                <>
                    <div className="p-4 rounded-2xl bg-sky-blue/10">
                        <Upload className="w-8 h-8 text-sky-blue" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-gray-700 text-sm">
                            Drop photos or videos here
                        </p>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">
                            JPG, PNG, WEBP, GIF, MP4, WEBM · Max {MAX_MB} MB each
                        </p>
                    </div>
                </>
            )}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) onFilesChosen(files);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

// ─── Upload-form modal ────────────────────────────────────────────────────────
type DraftItem = {
    file: File;
    previewUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    title: string;
    description: string;
    tags: string;
    event_date: string;
};

function UploadModal({
    drafts,
    onClose,
    onSaved,
}: {
    drafts: DraftItem[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [items, setItems] = useState<DraftItem[]>(drafts);
    const [current, setCurrent] = useState(0);
    const [saving, setSaving] = useState(false);

    const update = (key: keyof DraftItem, value: string) => {
        setItems((prev) =>
            prev.map((it, i) => (i === current ? { ...it, [key]: value } : it))
        );
    };

    const remove = (idx: number) => {
        const next = items.filter((_, i) => i !== idx);
        if (!next.length) { onClose(); return; }
        setItems(next);
        setCurrent(Math.min(current, next.length - 1));
    };

    const handleSave = async () => {
        setSaving(true);
        let failCount = 0;

        for (const item of items) {
            try {
                // 1. Upload to Cloudinary
                const fd = new FormData();
                fd.append("file", item.file);
                const res = await fetch("/api/upload-gallery", { method: "POST", body: fd });
                const data = await res.json();

                if (!res.ok || !data.url) {
                    failCount++;
                    continue;
                }

                // 2. Persist to Supabase
                const tagsArr = item.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);

                const result = await addGalleryItem({
                    media_url: data.url,
                    media_type: item.mediaType,
                    title: item.title || undefined,
                    description: item.description || undefined,
                    tags: tagsArr.length ? tagsArr : undefined,
                    event_date: item.event_date || undefined,
                });

                if (!result.success) failCount++;
            } catch {
                failCount++;
            }
        }

        setSaving(false);

        if (failCount === 0) {
            toast.success(`${items.length} item${items.length > 1 ? "s" : ""} added to Gallery! 🎉`);
        } else {
            toast.error(`${failCount} upload(s) failed. Please retry.`);
        }

        onSaved();
        onClose();
    };

    const it = items[current];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-[36px] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="font-black font-nunito text-gray-900 text-lg">
                            Add to Gallery
                        </h2>
                        <p className="text-xs font-bold text-gray-400">
                            {items.length} file{items.length > 1 ? "s" : ""} selected
                            {items.length > 1 && ` · ${current + 1} / ${items.length}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Multi-file nav */}
                {items.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto px-8 py-3 border-b border-gray-100">
                        {items.map((it, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${i === current ? "border-sky-400 scale-110 shadow-md" : "border-gray-200 opacity-60"
                                    }`}
                            >
                                {it.mediaType === "IMAGE" ? (
                                    <Image src={it.previewUrl} alt="" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                        <Film className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); remove(i); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer"
                                >
                                    <X className="w-2.5 h-2.5 text-white" />
                                </button>
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="flex flex-col md:flex-row gap-0 max-h-[70vh] overflow-y-auto">
                    {/* Preview */}
                    <div className="md:w-56 flex-shrink-0 bg-gray-900 flex items-center justify-center min-h-48 relative">
                        {it.mediaType === "IMAGE" ? (
                            <Image
                                src={it.previewUrl}
                                alt="preview"
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <Film className="w-12 h-12" />
                                <span className="text-xs font-bold text-gray-500">
                                    {it.file.name}
                                </span>
                            </div>
                        )}
                        <span className={`absolute top-3 left-3 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${it.mediaType === "IMAGE"
                                ? "bg-sky-500 text-white"
                                : "bg-brand-purple text-white"
                            }`}>
                            {it.mediaType}
                        </span>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 p-6 space-y-4">
                        <div>
                            <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" /> Title
                            </label>
                            <Input
                                placeholder="Annual Day 2026, Science Fair…"
                                value={it.title}
                                onChange={(e) => update("title", e.target.value)}
                                className="rounded-xl border-2 focus:border-sky-400 h-10 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5 block">
                                Description
                            </label>
                            <Textarea
                                rows={3}
                                placeholder="Describe this moment…"
                                value={it.description}
                                onChange={(e) => update("description", e.target.value)}
                                className="rounded-xl border-2 focus:border-sky-400 text-sm resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Event Date
                                </label>
                                <Input
                                    type="date"
                                    value={it.event_date}
                                    onChange={(e) => update("event_date", e.target.value)}
                                    className="rounded-xl border-2 focus:border-sky-400 h-10 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" /> Tags
                                </label>
                                <Input
                                    placeholder="sports, science, 2026"
                                    value={it.tags}
                                    onChange={(e) => update("tags", e.target.value)}
                                    className="rounded-xl border-2 focus:border-sky-400 h-10 text-sm"
                                />
                                <p className="text-[10px] font-bold text-gray-400 mt-1">
                                    Comma separated
                                </p>
                            </div>
                        </div>

                        {/* Per-item nav arrows */}
                        {items.length > 1 && (
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                                    disabled={current === 0}
                                    className="flex items-center gap-1 text-xs font-black text-gray-400 hover:text-sky-blue disabled:opacity-30 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Prev
                                </button>
                                <span className="text-xs font-bold text-gray-400 flex-1 text-center">
                                    {current + 1} of {items.length}
                                </span>
                                <button
                                    onClick={() => setCurrent((c) => Math.min(items.length - 1, c + 1))}
                                    disabled={current === items.length - 1}
                                    className="flex items-center gap-1 text-xs font-black text-gray-400 hover:text-sky-blue disabled:opacity-30 transition-colors cursor-pointer"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="text-sm font-black text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-sky-blue hover:bg-sky-500 text-white font-black px-7 py-2.5 rounded-2xl shadow-lg shadow-sky-200/50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading…
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Upload {items.length > 1 ? `${items.length} Files` : "File"}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
    items,
    startIndex,
    onClose,
}: {
    items: GalleryItem[];
    startIndex: number;
    onClose: () => void;
}) {
    const [idx, setIdx] = useState(startIndex);
    const it = items[idx];

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setIdx((i) => Math.min(items.length - 1, i + 1));
            if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [items.length, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Prev */}
            {idx > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
                    className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            {/* Media */}
            <div
                className="relative max-w-4xl max-h-[85vh] w-full mx-16"
                onClick={(e) => e.stopPropagation()}
            >
                {it.media_type === "VIDEO" ? (
                    <video
                        src={it.media_url}
                        controls
                        autoPlay
                        className="w-full max-h-[80vh] rounded-2xl object-contain"
                    />
                ) : (
                    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                        <Image
                            src={it.media_url}
                            alt={it.title || "Gallery"}
                            fill
                            className="object-contain rounded-2xl"
                        />
                    </div>
                )}

                {/* Caption */}
                {(it.title || it.description) && (
                    <div className="mt-4 text-center text-white">
                        {it.title && (
                            <p className="font-black text-lg font-nunito">{it.title}</p>
                        )}
                        {it.description && (
                            <p className="text-sm font-bold text-gray-300 mt-1">{it.description}</p>
                        )}
                    </div>
                )}
                <p className="text-center text-xs font-bold text-gray-500 mt-2">
                    {idx + 1} / {items.length}
                </p>
            </div>

            {/* Next */}
            {idx < items.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
                    className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────
function GalleryCard({
    item,
    onClick,
    onDelete,
}: {
    item: GalleryItem;
    onClick: () => void;
    onDelete: () => void;
}) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Remove this item from gallery?")) return;
        setDeleting(true);
        const result = await deleteGalleryItem(item.id);
        if (result.success) {
            toast.success("Removed from gallery.");
            onDelete();
        } else {
            toast.error("Failed to remove item.", { description: result.error });
        }
        setDeleting(false);
    };

    return (
        <div
            className="group relative rounded-[24px] overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1"
            style={{ aspectRatio: "1" }}
            onClick={onClick}
        >
            {item.media_type === "VIDEO" ? (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-30">
                        <video src={item.media_url} className="w-full h-full object-cover" muted playsInline />
                    </div>
                    <div className="relative z-10 p-4 rounded-full bg-white/20 backdrop-blur-sm">
                        <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                </div>
            ) : (
                <Image
                    src={item.media_url}
                    alt={item.title || "Gallery"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Type badge */}
            <span className={`absolute top-3 left-3 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm ${item.media_type === "VIDEO"
                    ? "bg-brand-purple/80 text-white"
                    : "bg-sky-500/80 text-white"
                }`}>
                {item.media_type === "VIDEO" ? (
                    <span className="flex items-center gap-1"><Film className="w-2.5 h-2.5" /> Video</span>
                ) : (
                    <span className="flex items-center gap-1"><ImageIcon className="w-2.5 h-2.5" /> Photo</span>
                )}
            </span>

            {/* Zoom icon */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                    <ZoomIn className="w-3.5 h-3.5 text-white" />
                </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.title && (
                    <p className="text-white text-xs font-black truncate">{item.title}</p>
                )}
                {item.event_date && (
                    <p className="text-white/70 text-[10px] font-bold">{formatDate(item.event_date)}</p>
                )}
            </div>

            {/* Delete button */}
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="absolute bottom-3 right-3 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer hover:scale-110 active:scale-90"
                title="Delete"
            >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function SchoolGalleryContent() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [drafts, setDrafts] = useState<DraftItem[] | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");

    const fetchGallery = useCallback(async () => {
        const data = await getSchoolGallery();
        setItems(data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchGallery(); }, [fetchGallery]);

    const handleFilesChosen = (files: File[]) => {
        const invalid = files.filter(
            (f) => f.size > MAX_MB * 1024 * 1024
        );
        if (invalid.length) {
            toast.error(`${invalid.length} file(s) exceed ${MAX_MB} MB limit.`);
            return;
        }

        const newDrafts: DraftItem[] = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            mediaType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
            title: "",
            description: "",
            tags: "",
            event_date: "",
        }));
        setDrafts(newDrafts);
    };

    const filtered = filter === "ALL" ? items : items.filter((i) => i.media_type === filter);
    const photos = items.filter((i) => i.media_type === "IMAGE").length;
    const videos = items.filter((i) => i.media_type === "VIDEO").length;

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-sky-blue animate-spin" />
                <p className="font-nunito font-black text-gray-400 uppercase tracking-widest text-sm animate-pulse">
                    Loading Gallery…
                </p>
            </div>
        );
    }

    return (
        <>
            {/* ── Upload modal ─────────────────────────────────────────────────── */}
            {drafts && (
                <UploadModal
                    drafts={drafts}
                    onClose={() => setDrafts(null)}
                    onSaved={() => { fetchGallery(); setDrafts(null); }}
                />
            )}

            {/* ── Lightbox ─────────────────────────────────────────────────────── */}
            {lightboxIndex !== null && filtered.length > 0 && (
                <Lightbox
                    items={filtered}
                    startIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">

                {/* ── Stats bar ──────────────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-4">
                    {[
                        { label: "Total Media", value: items.length, icon: ImageIcon, color: "text-sky-blue", bg: "bg-sky-blue/10" },
                        { label: "Photos", value: photos, icon: ImageIcon, color: "text-grass-green", bg: "bg-grass-green/10" },
                        { label: "Videos", value: videos, icon: Film, color: "text-brand-purple", bg: "bg-brand-purple/10" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 border border-gray-100 shadow-sm"
                        >
                            <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>
                                <s.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {s.label}
                                </p>
                                <p className="text-xl font-black font-nunito text-gray-900 leading-none">
                                    {s.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Drop zone ──────────────────────────────────────────────────── */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-black font-nunito text-gray-900">Upload Media</h2>
                            <p className="text-xs font-bold text-gray-400">
                                Photos and videos are uploaded to Cloudinary and saved to your gallery.
                            </p>
                        </div>
                        <Button
                            onClick={() => document.getElementById("gallery-file-input")?.click()}
                            className="hidden sm:flex items-center gap-2 bg-sky-blue hover:bg-sky-500 text-white font-black px-5 py-2.5 rounded-2xl shadow-md shadow-sky-200/50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Add Media
                        </Button>
                    </div>
                    <DropZone onFilesChosen={handleFilesChosen} uploading={uploading} />
                    {/* Hidden fallback input (for the button above on desktop) */}
                    <input
                        id="gallery-file-input"
                        type="file"
                        accept={ACCEPTED}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length) handleFilesChosen(files);
                            e.target.value = "";
                        }}
                    />
                </div>

                {/* ── Filter tabs ────────────────────────────────────────────────── */}
                {items.length > 0 && (
                    <div className="flex items-center gap-2">
                        {(["ALL", "IMAGE", "VIDEO"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${filter === f
                                        ? "bg-sky-blue text-white shadow-md shadow-sky-200"
                                        : "bg-white border border-gray-200 text-gray-500 hover:border-sky-300 hover:text-sky-blue"
                                    }`}
                            >
                                {f === "ALL" ? `All (${items.length})` : f === "IMAGE" ? `Photos (${photos})` : `Videos (${videos})`}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Grid ───────────────────────────────────────────────────────── */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-5 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="p-5 rounded-3xl bg-gray-100 text-gray-400">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                        <div className="text-center">
                            <p className="font-black font-nunito text-gray-700 text-lg">
                                {filter === "ALL" ? "Your gallery is empty" : `No ${filter.toLowerCase()}s yet`}
                            </p>
                            <p className="text-sm font-bold text-gray-400 mt-1">
                                Upload photos and videos to showcase your school's best moments.
                            </p>
                        </div>
                        <Button
                            onClick={() => document.getElementById("gallery-file-input")?.click()}
                            className="flex items-center gap-2 bg-sky-blue hover:bg-sky-500 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-sky-200/50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer mt-2"
                        >
                            <Upload className="w-4 h-4" /> Upload First Media
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map((item, i) => (
                            <GalleryCard
                                key={item.id}
                                item={item}
                                onClick={() => setLightboxIndex(i)}
                                onDelete={fetchGallery}
                            />
                        ))}
                        {/* Quick-add tile */}
                        <button
                            onClick={() => document.getElementById("gallery-file-input")?.click()}
                            className="flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-gray-200 hover:border-sky-400 hover:bg-sky-50/20 transition-all duration-300 cursor-pointer group"
                            style={{ aspectRatio: "1" }}
                        >
                            <div className="p-3 rounded-2xl bg-gray-100 group-hover:bg-sky-blue/10 text-gray-400 group-hover:text-sky-blue transition-colors">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 group-hover:text-sky-blue uppercase tracking-widest transition-colors">
                                Add More
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
