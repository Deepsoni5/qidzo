"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminEmail, setAdminEmail] = useState<string | undefined>();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getAdminSession();
      if (!session) {
        redirect("/admin-login");
      }
      setAdminEmail(session.email);
    };
    checkSession();
  }, []);

  // Show loader on pathname change
  useEffect(() => {
    setIsPageLoading(true);
    const timeout = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminSidebar 
        adminEmail={adminEmail} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      {/* Main Content Area */}
      <motion.main
        initial={false}
        animate={{ 
          marginLeft: isMobile ? "0px" : (isCollapsed ? "88px" : "280px"),
          paddingTop: isMobile ? "64px" : "0px"
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-screen transition-all duration-300 relative"
      >
        {/* Page Transition Loader */}
        <AnimatePresence mode="wait">
          {isPageLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex items-center justify-center"
              style={{ 
                marginLeft: isMobile ? "0px" : (isCollapsed ? "88px" : "280px"),
                width: isMobile ? "100%" : `calc(100% - ${isCollapsed ? '88px' : '280px'})`
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
                  <Loader2 className="w-8 h-8 text-brand-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-sm font-black text-brand-purple animate-pulse tracking-widest uppercase">Loading Qidzo...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
