"use client";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Video,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SchoolMobileNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/school/dashboard",
      color: "text-sky-blue",
    },
    {
      label: "Students",
      icon: Users,
      href: "/school/students",
      color: "text-hot-pink",
    },
    {
      label: "Add Student",
      icon: UserPlus,
      href: "/school/add-student",
      color: "text-grass-green",
    },
    {
      label: "Live",
      icon: Video,
      href: "/school/live",
      color: "text-red-500",
    },
    {
      label: "Tutorials",
      icon: BookOpen,
      href: "/school/resources",
      color: "text-brand-purple",
    },
    {
      label: "Inquiries",
      icon: Users,
      href: "/school/inquiries",
      color: "text-brand-purple",
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
