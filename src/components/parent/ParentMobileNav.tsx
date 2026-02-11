"use client";

import { LayoutDashboard, Users, Settings, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ParentMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Website", icon: ArrowLeft, href: "/", color: "text-red-500" },
    { label: "Dashboard", icon: LayoutDashboard, href: "/parent/dashboard", color: "text-brand-purple" },
    { label: "Children", icon: Users, href: "/parent/children", color: "text-sky-blue" },
    { label: "Settings", icon: Settings, href: "/parent/settings", color: "text-gray-500" },
    { label: "Upgrade", icon: Zap, href: "/parent/upgrade", color: "text-sunshine-yellow" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 lg:hidden z-50 pb-safe">
      <div className="flex justify-around items-center">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link 
                key={i} 
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-brand-purple' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''} ${isActive ? item.color : ''}`} />
              <span className="text-[10px] font-bold font-nunito">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
