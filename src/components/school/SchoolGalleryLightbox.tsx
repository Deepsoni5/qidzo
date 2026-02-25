"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    X,
    ChevronLeft,
    ChevronRight,
    Play,
    Image as ImageIcon,
    Film,
    Calendar,
    Tag,
    ZoomIn,
} from "lucide-react";
import type { GalleryItem } from "@/actions/school";

function formatDate(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
    items,
    startIndex,
    primaryColor,
    onClose,
}: {
    items: GalleryItem[];
    startIndex: number;
    primaryColor: string;
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
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer z-10"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-black">
                {idx + 1} / {items.length}
            </div>

            {/* Prev */}
            {idx > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
                    className="absolute left-3 sm:left-6 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-10 hover:scale-110"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}

            {/* Media */}
            <div
                className="relative max-w-4xl w-full mx-16 sm:mx-24"
                onClick={(e) => e.stopPropagation()}
            >
                {it.media_type === "VIDEO" ? (
                    <video
                        src={it.media_url}
                        controls
                        autoPlay
                        className="w-full max-h-[75vh] rounded-2xl object-contain"
                    />
                ) : (
                    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                        <Image
                            src={it.media_url}
                            alt={it.title || "Gallery photo"}
                            fill
                            className="object-contain rounded-2xl"
                        />
                    </div>
                )}

                {/* Caption */}
                {(it.title || it.description || it.event_date) && (
                    <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-white">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                {it.title && (
                                    <p className="font-black text-base font-nunito">{it.title}</p>
                                )}
                                {it.description && (
                                    <p className="text-sm font-bold text-gray-300 mt-0.5">{it.description}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                {it.event_date && (
                                    <span className="flex items-center gap-1 text-[10px] font-black bg-white/10 px-2.5 py-1 rounded-full">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(it.event_date)}
                                    </span>
                                )}
                                <span
                                    className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${it.media_type === "VIDEO"
                                            ? "bg-brand-purple/40"
                                            : "bg-sky-blue/40"
                                        }`}
                                >
                                    {it.media_type === "VIDEO" ? (
                                        <Film className="w-3 h-3" />
                                    ) : (
                                        <ImageIcon className="w-3 h-3" />
                                    )}
                                    {it.media_type}
                                </span>
                            </div>
                        </div>
                        {/* Tags */}
                        {it.tags && it.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                <Tag className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                {it.tags.map((tag, t) => (
                                    <span key={t} className="text-[10px] font-bold text-gray-300 bg-white/10 px-2 py-0.5 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Next */}
            {idx < items.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
                    className="absolute right-3 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-10 hover:scale-110"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}

// ─── Gallery Grid + Filter ────────────────────────────────────────────────────
export default function SchoolGalleryLightbox({
    gallery,
    primaryColor,
}: {
    gallery: GalleryItem[];
    primaryColor: string;
}) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");

    const filtered =
        filter === "ALL" ? gallery : gallery.filter((g) => g.media_type === filter);
    const photos = gallery.filter((g) => g.media_type === "IMAGE").length;
    const videos = gallery.filter((g) => g.media_type === "VIDEO").length;

    return (
        <>
            {/* Lightbox */}
            {lightboxIndex !== null && filtered.length > 0 && (
                <Lightbox
                    items={filtered}
                    startIndex={lightboxIndex}
                    primaryColor={primaryColor}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                {(["ALL", "IMAGE", "VIDEO"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filter === f
                                ? "text-white shadow-md"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                        style={
                            filter === f
                                ? { backgroundColor: primaryColor }
                                : undefined
                        }
                    >
                        {f === "ALL"
                            ? `All (${gallery.length})`
                            : f === "IMAGE"
                                ? `Photos (${photos})`
                                : `Videos (${videos})`}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                {filtered.map((item, i) => (
                    <button
                        key={item.id}
                        onClick={() => setLightboxIndex(i)}
                        className="relative group rounded-2xl overflow-hidden bg-gray-100 cursor-pointer hover:scale-[1.03] transition-transform duration-300 shadow-sm hover:shadow-md"
                        style={{ aspectRatio: "1" }}
                    >
                        {item.media_type === "VIDEO" ? (
                            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                <div className="p-2.5 rounded-full bg-white/20 group-hover:bg-white/35 transition-colors">
                                    <Play className="w-5 h-5 text-white fill-white" />
                                </div>
                            </div>
                        ) : (
                            <Image
                                src={item.media_url}
                                alt={item.title || "Gallery"}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Type badge */}
                        <span
                            className={`absolute top-1.5 left-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white ${item.media_type === "VIDEO" ? "bg-brand-purple/80" : "bg-sky-blue/80"
                                }`}
                        >
                            {item.media_type === "VIDEO" ? "▶" : "📷"}
                        </span>

                        {/* Zoom icon on hover */}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1 rounded-full bg-white/20">
                                <ZoomIn className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        {/* Caption on hover */}
                        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.title && (
                                <p className="text-white text-[9px] font-black truncate">{item.title}</p>
                            )}
                            {item.event_date && (
                                <p className="text-white/70 text-[8px] font-bold">{formatDate(item.event_date)}</p>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Tags cloud from all gallery items */}
            {(() => {
                const allTags = gallery
                    .flatMap((g) => g.tags || [])
                    .filter(Boolean);
                const uniqueTags = [...new Set(allTags)];
                if (uniqueTags.length === 0) return null;
                return (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Gallery Tags
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {uniqueTags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 cursor-default transition-colors"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })()}
        </>
    );
}
