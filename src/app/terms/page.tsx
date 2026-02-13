"use client";

import { motion } from "framer-motion";
import { FileText, ArrowLeft, ShieldCheck, Rocket, Star, Heart } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  const sections = [
    {
      id: 1,
      title: "Introduction",
      content: "Welcome to Qidzo (“we”, “us”, “our”). These Terms & Conditions govern your use of the Qidzo website, mobile application, and related services. By subscribing, you agree to be bound by these Terms."
    },
    {
      id: 2,
      title: "Eligibility & Accounts",
      content: "Qidzo is intended for children aged 4–17 years. Only parents or legal guardians may create accounts and purchase subscriptions. Children may only access the platform through parent-managed accounts."
    },
    {
      id: 3,
      title: "Parental Responsibility",
      content: "Parents are fully responsible for supervising their child’s activity, setting permissions, and ensuring appropriate use of the platform."
    },
    {
      id: 4,
      title: "Subscription & Payments",
      content: "Qidzo is a paid subscription service. Fees are billed in advance based on the selected plan and renew automatically unless cancelled by the parent."
    },
    {
      id: 5,
      title: "Acceptable Use",
      content: "Users must not upload, share, or engage in harmful, abusive, or inappropriate behavior or content. Qidzo reserves the right to moderate, restrict, or remove content and suspend accounts."
    },
    {
      id: 6,
      title: "Termination",
      content: "Qidzo may suspend or terminate accounts that violate these Terms. Parents may cancel subscriptions at any time."
    },
    {
      id: 7,
      title: "Governing Law",
      content: "These Terms are governed by applicable international laws, subject to the local jurisdiction of Qidzo."
    },
    {
      id: 8,
      title: "Limitation of Liability",
      content: "The Service is provided \"as is.\" Qidzo is not liable for indirect damages arising from your use of the platform."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDF4FF] font-nunito relative overflow-hidden">
      {/* Playful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[10%] text-sky-400 opacity-20"
        >
          <Rocket className="w-24 h-24" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-[5%] text-yellow-400 opacity-20"
        >
          <Star className="w-32 h-32 fill-current" />
        </motion.div>
        <motion.div 
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[5%] text-hot-pink opacity-10"
        >
          <Heart className="w-20 h-20 fill-current" />
        </motion.div>
      </div>

      {/* Header Section */}
      <div className="bg-brand-purple pt-24 pb-32 px-4 relative overflow-hidden">
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
            <FileText className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-white/80 font-bold text-lg max-w-2xl mx-auto">
            Rules for the Qidzo world! Let's make it a safe and fun place for everyone. ✨
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-24 relative z-10">
        <div className="bg-white rounded-[48px] shadow-2xl shadow-brand-purple/10 border-8 border-white p-8 md:p-12 space-y-12">
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
                <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-brand-purple font-black text-xl group-hover:bg-brand-purple group-hover:text-white transition-all duration-300">
                  {section.id}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-brand-purple transition-colors">
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
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-purple/5 rounded-2xl text-brand-purple font-black">
              <ShieldCheck className="w-6 h-6" />
              Last Updated: February 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
