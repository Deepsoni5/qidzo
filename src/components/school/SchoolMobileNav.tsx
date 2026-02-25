"use client";

import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  ArrowLeft,
  Images,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SchoolMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Website", icon: ArrowLeft, href: "/", color: "text-red-500" },
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
      label: "Inquiries",
      icon: Users,
      href: "/school/inquiries",
      color: "text-grass-green",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/school/analytics",
      color: "text-sky-blue",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-3 lg:hidden z-50 pb-safe shadow-2xl">
      <div className="flex justify-around items-center">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={i}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive ? "text-sky-blue scale-110" : "text-gray-400 hover:text-gray-600"}`}
            >
              <item.icon
                className={`w-6 h-6 ${isActive ? "fill-current opacity-80" : ""} ${isActive ? item.color : ""}`}
              />
              <span
                className={`text-[10px] font-black font-nunito ${isActive ? "text-sky-blue" : ""}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
