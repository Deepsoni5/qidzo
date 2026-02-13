"use client";

import PricingSection from "@/components/parent/pricing/PricingSection";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function UpgradePage() {
  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header Section */}
      <div className="text-center mb-10 space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 text-brand-purple rounded-full text-xs font-black uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Level Up Your Experience
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-black font-nunito text-gray-900"
        >
          Choose the Perfect Plan
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 font-bold text-base max-w-xl mx-auto"
        >
          Unlock magical features and help your kids reach their full potential with Qidzo Premium.
        </motion.p>
      </div>

      <PricingSection showTitle={false} />

      {/* Trust Badges */}
      <div className="mt-16 pt-10 border-t border-gray-100 text-center">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8 opacity-60">Trusted by parents worldwide</p>
      </div>
    </div>
  );
}
