"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { loginAdmin } from "@/actions/auth";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const result = await loginAdmin(formData);
      if (result.success) {
        toast.success("Welcome back, Admin! 🛡️", {
          description: "Accessing the command center...",
          style: {
            background: '#F0FDF4',
            border: '2px solid #22C55E',
            color: '#14532D',
            fontSize: '1rem',
            borderRadius: '16px',
          },
        });
        
        setTimeout(() => {
          router.push("/admin/dashboard");
          router.refresh();
        }, 1000);
      } else {
        toast.error("Access Denied 🚫", {
          description: result.error || "Invalid credentials. Please try again.",
          style: {
            background: '#FEF2F2',
            border: '2px solid #EF4444',
            color: '#7F1D1D',
            fontSize: '1rem',
            borderRadius: '16px',
          },
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("System Error 😵", {
        description: "Something went wrong. Please try again later.",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-hot-pink/5 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-8 left-8 z-20">
        <Link 
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-100 rounded-2xl font-black text-sm text-gray-600 shadow-sm hover:border-gray-800 hover:text-gray-900 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Website
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 border-4 border-white overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 text-center relative">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-lg mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin Access
            </h1>
            <p className="text-gray-400 text-sm font-bold mt-1">Authorized Personnel Only</p>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Admin Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-gray-800 transition-colors" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-800 focus:ring-4 focus:ring-gray-800/5 transition-all duration-300 font-bold text-gray-700"
                    placeholder="admin@xyz.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Secret Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-gray-800 transition-colors" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-800 focus:ring-4 focus:ring-gray-800/5 transition-all duration-300 font-bold text-gray-700"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:shadow-gray-900/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authenticate <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
            <Image 
                src="/f_q_logo.png" 
                alt="Qidzo Logo" 
                width={120} 
                height={48} 
                className="mx-auto grayscale opacity-50"
            />
        </div>
      </motion.div>
    </div>
  );
}
