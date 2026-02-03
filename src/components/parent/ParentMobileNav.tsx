"use client";

import { Home, Users, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ParentMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: Home, href: "/parent/dashboard" },
    { label: "Children", icon: Users, href: "/parent/children" },
    { label: "Profile", icon: User, href: "/parent/settings" },
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
              <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold font-nunito">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
