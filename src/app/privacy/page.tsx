"use client";

import { motion } from "framer-motion";
import { Shield, ArrowLeft, ShieldCheck, Lock, Eye, Heart, Star } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const sections = [
    {
      id: 1,
      title: "Privacy Commitment",
      content: "Qidzo is committed to protecting the privacy of parents and children and complies with global data protection laws, including COPPA, GDPR, and other applicable regulations."
    },
    {
      id: 2,
      title: "Information We Collect",
      content: "We collect parent account details, child profile information, platform usage data, and technical data necessary to provide and improve the Service."
    },
    {
      id: 3,
      title: "Use of Information",
      content: "Information is used to operate the platform, ensure child safety, process payments, communicate with parents, and improve features."
    },
    {
      id: 4,
      title: "Data Sharing",
      content: "We do not sell children’s personal data. Information may be shared with trusted service providers strictly for operational and legal purposes."
    },
    {
      id: 5,
      title: "Parental Rights",
      content: "Parents have the right to access, correct, download, or delete their child’s personal data at any time themselves or by contacting wecare@qidzo.com"
    },
    {
      id: 6,
      title: "Verifiable Parental Consent (VPC)",
      content: "Before collecting personal information from children under 13 (or 16 in certain jurisdictions), we obtain VPC through methods such as credit card verification or email consent."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-nunito relative overflow-hidden">
      {/* Playful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 left-[10%] text-sky-400 opacity-20"
        >
          <Lock className="w-24 h-24" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-[5%] text-brand-purple opacity-20"
        >
          <Shield className="w-32 h-32 fill-current" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[5%] text-hot-pink opacity-10"
        >
          <Heart className="w-20 h-20 fill-current" />
        </motion.div>
      </div>

      {/* Header Section */}
      <div className="bg-sky-500 pt-24 pb-32 px-4 relative overflow-hidden">
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
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-white/80 font-bold text-lg max-w-2xl mx-auto">
            Your safety and privacy are our #1 priority. Here's how we keep your magic safe! 🛡️
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-24 relative z-10">
        <div className="bg-white rounded-[48px] shadow-2xl shadow-sky-500/10 border-8 border-white p-8 md:p-12 space-y-12">
          {sections.map((section, index) => (
            <motion.div 
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-sky-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-sky-600 font-black text-xl group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-sky-500 transition-colors">
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
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-sky-50 rounded-2xl text-sky-600 font-black">
              <ShieldCheck className="w-6 h-6" />
              Last Updated: February 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
