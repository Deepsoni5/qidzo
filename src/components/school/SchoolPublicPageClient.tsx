"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  GraduationCap,
  Sparkles,
  Star,
  CheckCircle2,
  Calendar,
  Shield,
  Building2,
  Info,
  Image as ImageIcon,
  Film,
  Users,
  Clock,
  FileText,
  LayoutGrid,
  Share2,
  MessageCircle,
} from "lucide-react";
import SchoolGalleryLightbox from "@/components/school/SchoolGalleryLightbox";
import SchoolContactModal from "@/components/school/SchoolContactModal";
import type { GalleryItem, School } from "@/actions/school";
import ProfileFeed from "@/components/ProfileFeed";
import { FollowButton } from "@/components/FollowButton";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "posts" | "about" | "gallery" | "details";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function planBadgeStyle(plan: string) {
  switch ((plan || "").toUpperCase()) {
    case "ELITE":
      return "bg-amber-400/15 text-amber-700 border-amber-300";
    case "PRO":
      return "bg-brand-purple/15 text-brand-purple border-brand-purple/30";
    case "BASIC":
      return "bg-sky-blue/15 text-sky-blue border-sky-blue/30";
    default:
      return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseGrades(g: string[] | string | null): string {
  if (!g) return "—";
  const raw = Array.isArray(g) ? g[0] : g;
  return raw || "—";
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  color = "text-gray-400",
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string | null;
  color?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`mt-0.5 flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-sky-blue hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-bold text-gray-800 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Posts Tab ──────────────────────────────────────────────────────────────
function PostsTab({
  school,
  posts,
  userRole,
  primaryColor,
}: {
  school: School;
  posts: any[];
  userRole: any;
  primaryColor: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 bg-white rounded-[32px] border border-gray-100 shadow-sm text-center px-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40)`,
          }}
        >
          <FileText className="w-9 h-9" style={{ color: primaryColor }} />
        </div>
        <div>
          <h3 className="font-black font-nunito text-gray-900 text-xl mb-1">
            No Posts Yet
          </h3>
          <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto leading-relaxed">
            {school.name} hasn't posted any updates yet. Check back soon for
            announcements, events and news!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-sky-blue/10 text-sky-blue rounded-2xl">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black font-nunito text-gray-900 leading-none">
            Recent Updates
          </h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">
            Announcements & Notices
          </p>
        </div>
      </div>

      <ProfileFeed
        posts={posts}
        profileName={school.name}
        userRole={userRole}
      />
    </div>
  );
}

// ─── About Tab ────────────────────────────────────────────────────────────────
function AboutTab({
  school,
  primaryColor,
}: {
  school: School;
  primaryColor: string;
}) {
  return (
    <div className="space-y-6">
      {school.about && (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7">
          <h3 className="font-black font-nunito text-gray-900 text-lg flex items-center gap-2 mb-4">
            <Info className="w-5 h-5" style={{ color: primaryColor }} />
            About {school.name}
          </h3>
          <p className="text-gray-700 font-bold leading-relaxed whitespace-pre-line text-sm">
            {school.about}
          </p>
        </div>
      )}

      {school.grades_offered && (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7">
          <h3 className="font-black font-nunito text-gray-900 text-lg flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-grass-green" />
            Grades Offered
          </h3>
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-grass-green/10 border border-grass-green/20">
            <GraduationCap className="w-5 h-5 text-grass-green" />
            <span className="font-black text-grass-green text-base">
              {parseGrades(school.grades_offered)}
            </span>
          </div>
        </div>
      )}

      {/* Qidzo Partnership */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7">
        <h3 className="font-black font-nunito text-gray-900 text-lg flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-brand-purple" />
          Qidzo Partnership
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Plan */}
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-sunshine-yellow/10 border border-sunshine-yellow/20">
            <Star className="w-5 h-5 text-sunshine-yellow mb-2" />
            <p className="text-sm font-black text-gray-900">
              {school.subscription_plan || "FREE"}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Plan
            </p>
          </div>

          {/* Verified / Premium status */}
          <div
            className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border ${
              school.is_verified
                ? "bg-grass-green/10 border-grass-green/20"
                : "bg-sky-blue/10 border-sky-blue/20"
            }`}
          >
            <Shield
              className={`w-5 h-5 mb-2 ${school.is_verified ? "text-grass-green" : "text-sky-blue"}`}
            />
            <p
              className={`text-sm font-black ${school.is_verified ? "text-grass-green" : "text-sky-blue"}`}
            >
              {school.is_verified ? "Verified ✓" : "Premium Pending"}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Status
            </p>
          </div>

          {/* Member Since */}
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <Calendar className="w-5 h-5 text-sky-blue mb-2" />
            <p className="text-sm font-black text-gray-900">
              {formatDate(school.created_at)}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Member Since
            </p>
          </div>
        </div>

        {/* Subscription dates */}
        {(school.subscription_starts_at || school.subscription_ends_at) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
            {school.subscription_starts_at && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                Started: {formatDate(school.subscription_starts_at)}
              </div>
            )}
            {school.subscription_ends_at && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                Valid Until: {formatDate(school.subscription_ends_at)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────────
function GalleryTab({
  gallery,
  primaryColor,
}: {
  gallery: GalleryItem[];
  primaryColor: string;
}) {
  const images = gallery.filter((g) => g.media_type === "IMAGE").length;
  const videos = gallery.filter((g) => g.media_type === "VIDEO").length;

  if (gallery.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 bg-white rounded-[32px] border border-gray-100 shadow-sm text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-sky-blue/10 flex items-center justify-center">
          <ImageIcon className="w-9 h-9 text-sky-blue" />
        </div>
        <div>
          <h3 className="font-black font-nunito text-gray-900 text-xl mb-1">
            No Gallery Yet
          </h3>
          <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">
            Campus photos and videos will appear here once the school uploads
            them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black font-nunito text-gray-900 text-lg flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-sky-blue" />
          Campus Gallery
          <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {gallery.length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          {images > 0 && (
            <span className="text-[10px] font-black text-sky-blue bg-sky-blue/10 px-2.5 py-1 rounded-full">
              {images} photos
            </span>
          )}
          {videos > 0 && (
            <span className="text-[10px] font-black text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full">
              {videos} videos
            </span>
          )}
        </div>
      </div>
      <SchoolGalleryLightbox gallery={gallery} primaryColor={primaryColor} />
    </div>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────
function DetailsTab({ school }: { school: School }) {
  const fullAddress = [
    school.address_line1,
    school.address_line2,
    school.city,
    school.state,
    school.postal_code,
    school.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Contact */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7">
        <h3 className="font-black font-nunito text-gray-900 text-lg flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-sky-blue" />
          Contact Information
        </h3>
        <div>
          <InfoRow
            icon={Mail}
            label="Email"
            value={school.contact_email}
            color="text-sky-blue"
            href={
              school.contact_email
                ? `mailto:${school.contact_email}`
                : undefined
            }
          />
          <InfoRow
            icon={Phone}
            label="Phone"
            value={school.contact_phone}
            color="text-brand-purple"
            href={
              school.contact_phone ? `tel:${school.contact_phone}` : undefined
            }
          />
          <InfoRow
            icon={Globe}
            label="Website"
            value={school.website_url}
            color="text-hot-pink"
            href={school.website_url}
          />
        </div>
      </div>

      {/* Address */}
      {fullAddress && (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7">
          <h3 className="font-black font-nunito text-gray-900 text-lg flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-hot-pink" />
            Location & Address
          </h3>
          <div className="space-y-1">
            {school.address_line1 && (
              <p className="text-sm font-bold text-gray-800">
                {school.address_line1}
              </p>
            )}
            {school.address_line2 && (
              <p className="text-sm font-bold text-gray-500">
                {school.address_line2}
              </p>
            )}
            <p className="text-sm font-bold text-gray-600 mt-1">
              {[school.city, school.state].filter(Boolean).join(", ")}
            </p>
            <p className="text-xs font-bold text-gray-400">
              {[school.postal_code, school.country].filter(Boolean).join(" · ")}
            </p>
          </div>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black text-hot-pink bg-hot-pink/10 hover:bg-hot-pink/20 border border-hot-pink/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5" />
            View on Google Maps
          </a>
        </div>
      )}

      {/* Page meta */}
      <div className="bg-gray-50 rounded-[28px] border border-gray-100 p-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Page Information
        </p>
        <div className="space-y-2.5">
          {[
            { label: "School Slug", value: school.slug },
            { label: "Page Created", value: formatDate(school.created_at) },
            { label: "Last Updated", value: formatDate(school.updated_at) },
            { label: "Page Active", value: school.is_active ? "Yes" : "No" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">{r.label}</span>
              <span className="text-xs font-black text-gray-800">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main LinkedIn-style School Page ─────────────────────────────────────────
export default function SchoolPublicPageClient({
  school,
  gallery,
  posts = [],
  userRole = {},
}: {
  school: School;
  gallery: GalleryItem[];
  posts?: any[];
  userRole?: any;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const primaryColor = school.brand_primary_color || "#0EA5E9";
  const secondaryColor = school.brand_secondary_color || "#FBBF24";

  const images = gallery.filter((g) => g.media_type === "IMAGE").length;
  const videos = gallery.filter((g) => g.media_type === "VIDEO").length;

  const isOwnSchool = userRole?.isSchool && userRole?.school?.id === school.id;
  const showFollowButton = !isOwnSchool;

  // User info for prefilling contact form
  const userEmail = userRole?.isParent
    ? userRole?.parent?.email
    : userRole?.isChild
      ? userRole?.child?.parentEmail
      : "";
  const userPhone = userRole?.isParent
    ? userRole?.parent?.phone
    : userRole?.isChild
      ? userRole?.child?.parentPhone
      : "";
  const userName = userRole?.isParent
    ? userRole?.parent?.name
    : userRole?.isChild
      ? userRole?.child?.name
      : "";

  const handleContactClick = () => {
    if (!userRole?.isChild && !userRole?.isParent) {
      toast.error("Please login to contact the school", {
        description:
          "You need to be logged in as a parent or child to send inquiries.",
      });
      return;
    }
    setIsContactModalOpen(true);
  };

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ElementType;
    count?: number;
  }[] = [
    { id: "posts", label: "Posts", icon: FileText, count: posts.length },
    { id: "about", label: "About", icon: Info },
    { id: "gallery", label: "Gallery", icon: ImageIcon, count: gallery.length },
    { id: "details", label: "Details", icon: Building2 },
  ];

  return (
    <>
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative w-full h-52 sm:h-64 lg:h-72 overflow-hidden bg-gray-200">
        {school.banner_url ? (
          <Image
            src={school.banner_url}
            alt={`${school.name} banner`}
            fill
            priority
            className="object-cover"
          />
        ) : (
          /* Brand-colour gradient fallback — clearly intentional when no banner is set */
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 60%, ${primaryColor}bb 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-[0.12] bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]" />
            <div className="absolute top-8 left-14 w-48 h-48 rounded-full blur-3xl opacity-25 bg-white" />
            <div className="absolute bottom-2 right-10 w-64 h-64 rounded-full blur-3xl opacity-15 bg-white" />
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Profile Card ─────────────────────────────────────────────── */}
        <div className="relative bg-white rounded-[36px] shadow-xl shadow-gray-200/50 border border-gray-100 -mt-14 sm:-mt-16 mb-3">
          {/* Logo */}
          <div className="absolute -top-9 sm:-top-12 left-6 sm:left-8 z-10">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] sm:rounded-[26px] bg-white border-4 border-white shadow-xl overflow-hidden relative"
              style={{ boxShadow: `0 8px 28px ${primaryColor}35` }}
            >
              {school.logo_url ? (
                <Image
                  src={school.logo_url}
                  alt={school.name}
                  fill
                  className="object-contain p-1.5"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {school.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="pt-11 sm:pt-14 px-6 sm:px-8 pb-5 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Name + badges */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black font-nunito text-gray-900 tracking-tight">
                    {school.name}
                  </h1>
                  {school.is_verified && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 fill-white" /> Verified
                    </span>
                  )}
                  {school.subscription_plan &&
                    school.subscription_plan !== "FREE" && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${planBadgeStyle(school.subscription_plan)}`}
                      >
                        {school.subscription_plan === "ELITE" ? (
                          <Star className="w-3 h-3 fill-current" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {school.subscription_plan}
                      </span>
                    )}
                </div>

                {/* URL */}
                <p className="text-xs font-bold text-gray-400 mb-1.5">
                  qidzo.com/schools/{school.slug}
                </p>

                {/* City / country */}
                {(school.city || school.country) && (
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-hot-pink flex-shrink-0" />
                    {[school.city, school.state, school.country]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                {/* Grades pill */}
                {school.grades_offered && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-grass-green/10 border border-grass-green/20">
                    <GraduationCap className="w-3.5 h-3.5 text-grass-green" />
                    <span className="text-xs font-black text-grass-green">
                      {parseGrades(school.grades_offered)}
                    </span>
                  </div>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <div className="flex items-center gap-2">
                  {showFollowButton && (
                    <FollowButton
                      targetId={school.id}
                      targetType="SCHOOL"
                      className="px-8 py-2.5 bg-sky-blue text-white rounded-full font-black shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all"
                    />
                  )}
                  <button
                    onClick={handleContactClick}
                    className="px-6 py-2.5 bg-grass-green text-white rounded-full font-black shadow-lg shadow-grass-green/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Us
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-500 rounded-full border-2 border-gray-100 hover:bg-gray-100 transition-all active:scale-90 shadow-sm">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {school.website_url && (
                    <a
                      href={school.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-all hover:scale-[1.03] active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 8px 20px ${primaryColor}35`,
                      }}
                    >
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
              {[
                {
                  icon: ImageIcon,
                  label: "Photos",
                  value: images,
                  color: "text-sky-blue",
                  bg: "bg-sky-blue/10",
                },
                {
                  icon: Film,
                  label: "Videos",
                  value: videos,
                  color: "text-brand-purple",
                  bg: "bg-brand-purple/10",
                },
                {
                  icon: Users,
                  label: "Gallery Items",
                  value: gallery.length,
                  color: "text-grass-green",
                  bg: "bg-grass-green/10",
                },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setActiveTab("gallery")}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <div className={`p-1.5 rounded-xl ${s.bg} ${s.color}`}>
                    <s.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-base font-black font-nunito text-gray-900 leading-none">
                      {s.value}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                      {s.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── LinkedIn-style Tabs ──────────────────────────────────────── */}
          <div className="px-6 sm:px-8 border-t border-gray-100">
            <div className="flex overflow-x-auto gap-0 scrollbar-hide -mb-px">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-black whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-sky-blue text-sky-blue"
                        : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-sky-blue text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tab Content ────────────────────────────────────────────────── */}
        <div className="pb-16 pt-4">
          {activeTab === "posts" && (
            <PostsTab
              school={school}
              posts={posts}
              userRole={userRole}
              primaryColor={primaryColor}
            />
          )}
          {activeTab === "about" && (
            <AboutTab school={school} primaryColor={primaryColor} />
          )}
          {activeTab === "gallery" && (
            <GalleryTab gallery={gallery} primaryColor={primaryColor} />
          )}
          {activeTab === "details" && <DetailsTab school={school} />}
        </div>
      </div>

      {/* Contact Modal */}
      <SchoolContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        schoolId={school.id}
        schoolName={school.name}
        primaryColor={primaryColor}
        userEmail={userEmail}
        userPhone={userPhone}
        userName={userName}
      />
    </>
  );
}
