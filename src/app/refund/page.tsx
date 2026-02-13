"use client";

import { motion } from "framer-motion";
import { RefreshCw, ArrowLeft, ShieldCheck, DollarSign, CreditCard, Heart, Smile } from "lucide-react";
import Link from "next/link";

export default function RefundPage() {
  const sections = [
    {
      id: 1,
      title: "General Policy",
      content: "All Qidzo subscriptions are prepaid. Refunds are not guaranteed once a subscription period has started."
    },
    {
      id: 2,
      title: "Refund Eligibility",
      content: "Refunds may be considered if requested within 7 days of initial purchase and if the service has not been substantially used."
    },
    {
      id: 3,
      title: "Cancellation",
      content: "Parents may cancel subscriptions at any time to avoid future billing. Cancellation does not automatically entitle the user to a refund. To avoid the next charge, cancellation must be completed at least 24 hours before the renewal date."
    },
    {
      id: 4,
      title: "Contact for Refunds",
      content: "Refunds are issued to the original payment method. Processing times vary by bank but typically take 5–10 business days. Refund requests should be sent to wecare@qidzo.com with relevant subscription details."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF1F2] font-nunito relative overflow-hidden">
      {/* Playful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[15%] text-hot-pink opacity-20"
        >
          <RefreshCw className="w-24 h-24" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -30, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-[10%] text-brand-purple opacity-20"
        >
          <DollarSign className="w-32 h-32" />
        </motion.div>
        <motion.div 
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[50%] left-[5%] text-sky-400 opacity-10"
        >
          <Smile className="w-24 h-24 fill-current" />
        </motion.div>
      </div>

      {/* Header Section */}
      <div className="bg-hot-pink pt-24 pb-32 px-4 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 opacity-10">
          <svg viewBox="0 0 1440 320" className="w-full h-24 fill-white">
            <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 font-black transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[32px] flex items-center justify-center mx-auto mb-6 border-4 border-white/30 shadow-2xl">
            <RefreshCw className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Refund Policy
          </h1>
          <p className="text-white/80 font-bold text-lg max-w-2xl mx-auto">
            Clear and simple rules about subscriptions and payments. 💖
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-24 relative z-10">
        <div className="bg-white rounded-[48px] shadow-2xl shadow-hot-pink/10 border-8 border-white p-8 md:p-12 space-y-12">
          {sections.map((section, index) => (
            <motion.div 
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-hot-pink/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-hot-pink font-black text-xl group-hover:bg-hot-pink group-hover:text-white transition-all duration-300">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-hot-pink transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 font-bold leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="pt-12 border-t-4 border-dashed border-gray-100 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-hot-pink/5 rounded-2xl text-hot-pink font-black">
              <ShieldCheck className="w-6 h-6" />
              Last Updated: February 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
