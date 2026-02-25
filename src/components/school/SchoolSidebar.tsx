"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Settings,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Users,
  Images,
  BarChart3,
  Mail,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSchoolProfile } from "@/actions/school";

export default function SchoolSidebar() {
  const pathname = usePathname();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    getSchoolProfile().then((s) => {
      if (s?.slug) setSlug(s.slug);
    });
  }, []);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/school/dashboard",
      color: "text-sky-blue",
    },
    {
      label: "Gallery",
      icon: Images,
      href: "/school/gallery",
      color: "text-brand-purple",
    },
    {
      label: "Post Magic",
      icon: ImageIcon,
      href: "/school/posts",
      color: "text-hot-pink",
    },
    {
      label: "Inquiries",
      icon: Mail,
      href: "/school/inquiries",
      color: "text-grass-green",
    },
    {
      label: "Exams Portal",
      icon: FileText,
      href: "/school/exams",
      color: "text-sunshine-yellow",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/school/analytics",
      color: "text-sky-blue",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/school/settings",
      color: "text-gray-500",
    },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto p-4 scrollbar-hide">
      <div className="space-y-2">
        {menuItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 p-3.5 rounded-2xl font-nunito font-bold cursor-pointer transition-all duration-300 ${
                isActive
                  ? "bg-sky-blue/10 scale-105 shadow-sm border border-sky-blue/20"
                  : "hover:bg-gray-50 hover:scale-105"
              }`}
            >
              <item.icon
                className={`w-6 h-6 ${item.color} ${isActive ? "fill-current opacity-80" : ""}`}
              />
              <span
                className={`text-base ${isActive ? "text-sky-blue font-black" : "text-gray-600"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
        {/* "View Public Page" link — shown only when slug is loaded */}
        {slug && (
          <Link
            href={`/schools/${slug}`}
            target="_blank"
            className="flex items-center gap-3 p-3.5 rounded-2xl font-nunito font-bold cursor-pointer transition-all duration-300 hover:bg-sky-blue/10 hover:text-sky-blue text-gray-500 group border border-dashed border-gray-200 hover:border-sky-blue/40"
          >
            <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="text-sm leading-tight">View School Page</span>
          </Link>
        )}

        <Link
          href="/contact"
          className="flex items-center gap-3 p-3.5 rounded-2xl font-nunito font-bold cursor-pointer transition-all duration-300 hover:bg-sky-50 hover:text-sky-blue text-gray-500 group"
        >
          <Mail className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-base">Support</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 p-3.5 rounded-2xl font-nunito font-bold cursor-pointer transition-all duration-300 hover:bg-red-50 hover:text-red-500 text-gray-500 group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="text-base">Back to Website</span>
        </Link>
      </div>
    </div>
  );
}
