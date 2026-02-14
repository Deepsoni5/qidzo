"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Star, Gamepad2, Rocket, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginChild } from "@/actions/auth";
import { toast } from "sonner";

export default function KidsLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const result = await loginChild(formData);
      if (result.success) {
        toast.success("You're in! 🎉", {
          description: "Be kind, stay safe, and share only kid‑friendly content. No adult content. Your activity is monitored for safety.",
          style: {
            background: '#F0FDF4', // green-50
            border: '2px solid #22C55E', // green-500
            color: '#14532D', // green-900
            fontSize: '1.1rem',
            borderRadius: '16px',
          },
          icon: <span className="text-2xl">🛡️</span>,
          duration: 3000,
        });
        
        // Slight delay to let them see the success message
        setTimeout(() => {
            router.push("/");
            router.refresh(); // Ensure navbar updates
        }, 1000);
      } else {
        toast.error("Uh oh! Try again 🙈", {
          description: result.error || "That didn't work. Check your spelling!",
          style: {
            background: '#FEF2F2', // red-50
            border: '2px solid #EF4444', // red-500
            color: '#7F1D1D', // red-900
            fontSize: '1.1rem',
            borderRadius: '16px',
          },
          icon: <span className="text-2xl">❌</span>,
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("Something went wrong 😵", {
          description: "Please ask a grown-up for help.",
          style: {
            background: '#FEF2F2',
            border: '2px solid #EF4444',
            color: '#7F1D1D',
            fontSize: '1.1rem',
            borderRadius: '16px',
          }
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF4FF] relative overflow-hidden font-nunito flex items-center justify-center p-4 pt-24 sm:pt-28">
      {/* Playful Background Elements - Simplified */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-sky-400 opacity-60">
            <Rocket className="w-12 h-12" />
        </div>
        <div className="absolute bottom-20 right-10 text-yellow-400 opacity-60">
            <Star className="w-16 h-16 fill-current" />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] bg-white rounded-[32px] shadow-xl border-4 border-white relative z-10"
      >
        {/* Header Section - Minimalist */}
        <div className="bg-brand-purple p-8 text-center rounded-t-[28px] relative overflow-hidden">
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-md mb-4 rotate-3">
                    <span className="text-3xl">🦄</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                    Kids Login
                </h1>
            </div>
            
             {/* Wavy bottom decoration */}
             <div className="absolute -bottom-1 left-0 right-0 opacity-20 text-white">
                <svg viewBox="0 0 1440 320" className="w-full h-12 fill-current">
                    <path fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </div>

        {/* Form Section */}
        <div className="p-6 bg-white rounded-b-[32px]">
            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-gray-400 font-bold ml-2 text-xs uppercase tracking-wider">Username</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="w-5 h-5 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                        </div>
                        <input 
                            name="username"
                            type="text" 
                            required
                            placeholder="SuperKid123"
                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-bold text-gray-700 placeholder-gray-300 focus:outline-none focus:border-brand-purple focus:bg-white transition-all duration-200"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-400 font-bold ml-2 text-xs uppercase tracking-wider">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="w-5 h-5 text-gray-300 group-focus-within:text-hot-pink transition-colors" />
                        </div>
                        <input 
                            name="password"
                            type={showPassword ? "text" : "password"} 
                            required
                            placeholder="••••••••"
                            className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-bold text-gray-700 placeholder-gray-300 focus:outline-none focus:border-hot-pink focus:bg-white transition-all duration-200"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-gray-400 hover:text-hot-pink transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full mt-2 bg-gradient-to-r from-brand-purple to-hot-pink text-white font-black text-xl py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Loading...</span>
                        </div>
                    ) : (
                        <>
                            Let's Play! <ArrowRight className="w-6 h-6 stroke-[3px]" />
                        </>
                    )}
                </button>
            </form>

            {/* Parent Section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-gray-400 font-medium text-sm">
                        Are you a grown-up?
                    </p>
                    <Link href="/sign-in" className="w-full">
                        <button className="w-full py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-brand-purple hover:border-brand-purple hover:bg-purple-50 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            Parents Login Here
                        </button>
                    </Link>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
