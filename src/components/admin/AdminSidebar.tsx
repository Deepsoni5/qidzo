"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  BarChart3,
  Heart,
  MessageSquare,
  TicketPercent,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logoutAdmin } from "@/actions/auth";

interface SidebarProps {
  adminEmail?: string;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function AdminSidebar({ adminEmail, isCollapsed, setIsCollapsed }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "Users", icon: Users, href: "/admin/users" },
    { label: "Posts", icon: FileText, href: "/admin/posts" },
    { label: "Likes", icon: Heart, href: "/admin/likes" },
    { label: "Comments", icon: MessageSquare, href: "/admin/comments" },
    { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
    { label: "Coupons", icon: TicketPercent, href: "/admin/coupons" },
  ];

  const handleLogout = async () => {
    await logoutAdmin();
    window.location.href = "/admin-login";
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-950 border-b border-white/5 z-[60] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-brand-purple" />
          <span className="font-black text-white text-xl">Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? "88px" : "280px" }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-gray-950 border-r border-white/5 z-50 transition-all duration-300 overflow-hidden"
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 mb-4 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-purple/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-black text-xl text-white tracking-tight"
              >
                Qidzo Admin
              </motion.span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all group relative ${
                  isActive 
                    ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "group-hover:scale-110 transition-transform"}`} />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-bold text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isCollapsed && (
                  <div className="absolute left-16 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Collapse */}
        <div className="p-3 border-t border-white/5 space-y-2 shrink-0">
          {!isCollapsed && adminEmail && (
            <div className="px-3 py-4 mb-2 bg-white/5 rounded-2xl overflow-hidden">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Signed in as</p>
              <p className="text-xs font-bold text-gray-300 truncate">{adminEmail}</p>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl font-bold text-sm transition-all group overflow-hidden`}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 text-gray-500 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-gray-950 z-[80] flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-black text-xl text-white">Admin CP</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-4 rounded-2xl font-bold text-base transition-all ${
                        isActive 
                          ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20" 
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 text-red-400 hover:text-red-300 font-bold text-base mt-auto border-t border-white/5 pt-6"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
