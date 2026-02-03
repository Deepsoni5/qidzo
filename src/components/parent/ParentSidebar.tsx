"use client";
import { LayoutDashboard, Users, Settings, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ParentSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/parent/dashboard", color: "text-brand-purple" },
    { label: "My Children", icon: Users, href: "/parent/children", color: "text-sky-blue" },
    { label: "Settings", icon: Settings, href: "/parent/settings", color: "text-gray-500" },
    { label: "Upgrade", icon: Zap, href: "/parent/upgrade", color: "text-sunshine-yellow" },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto p-4">
      <div className="space-y-2">
        {menuItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
                <Link 
                    key={i} 
                    href={item.href}
                    className={`flex items-center gap-3 p-3 rounded-2xl font-nunito font-bold cursor-pointer transition-all duration-300 ${isActive ? 'bg-brand-purple/10 scale-105 shadow-sm' : 'hover:bg-gray-50 hover:scale-105'}`}
                >
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                    <span className={`text-base ${isActive ? 'text-brand-purple font-black' : 'text-gray-600'}`}>{item.label}</span>
                </Link>
            )
        })}
      </div>
      
      <div className="mt-auto">
         {/* Footer or extra links could go here */}
      </div>
    </div>
  );
}
