"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  ArrowRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        source: "web_contact_page",
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success("Message sent successfully! 🚀");
      reset();
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 text-brand-purple rounded-full text-sm font-black uppercase tracking-wider mb-4"
            >
              <Sparkles className="w-4 h-4" />
              Get in Touch
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black font-nunito text-gray-900"
            >
              We'd Love to <span className="text-brand-purple">Hear From You!</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 font-bold text-lg max-w-2xl mx-auto"
            >
              Have a question about Qidzo? Our team is here to help you and your little explorers!
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-white p-8 rounded-[40px] border-4 border-gray-100 shadow-xl shadow-gray-200/50 space-y-8">
                <h3 className="text-2xl font-black font-nunito text-gray-900">Qidzo</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-brand-purple" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">Email Us</p>
                      <p className="text-gray-500 font-bold text-sm">wecare@qidzo.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-blue/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-sky-blue" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">Call Us</p>
                      <p className="text-gray-500 font-bold text-sm">+91 90083 67818</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-hot-pink/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-hot-pink" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">Visit Us</p>
                      <p className="text-gray-500 font-bold text-xs leading-relaxed">
                        MADHYAVARTI SOLUTIONS PRIVATE LIMITED<br/>
                        NO:8, K.NO.13-3, 28TH CROSS,<br/>
                        HULIMAVU MAIN ROAD, Hulimavu,<br/>
                        Bangalore South, Bangalore - 560076,<br/>
                        Karnataka
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div className="pt-4">
                  <div className="w-full h-48 rounded-3xl overflow-hidden border-2 border-gray-100 shadow-inner">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7778.901402925576!2d77.607355!3d12.878715!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae152a98db83ad%3A0x19fef03a9fe461e7!2s8%20k%2C%2013%2C%2028th%20Cross%20Rd%2C%20Raghavendra%20Layout%2C%20Hanuman%20Nagar%2C%20Hulimavu%2C%20Bengaluru%2C%20Karnataka%20560076!5e0!3m2!1sen!2sin!4v1767703515407!5m2!1sen!2sin" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen={true} 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-gray-50">
                  <div className="bg-brand-purple/5 p-6 rounded-3xl border-2 border-brand-purple/10">
                    <p className="text-brand-purple font-black text-sm mb-2 uppercase tracking-wider">Quick Support</p>
                    <p className="text-gray-600 font-bold text-sm">
                      Our typical response time is within 24 hours on business days!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="bg-white p-8 md:p-12 rounded-[40px] border-4 border-brand-purple/10 shadow-2xl shadow-brand-purple/5 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-hot-pink/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center py-12 space-y-6 relative z-10"
                    >
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                      </div>
                      <h2 className="text-3xl font-black font-nunito text-gray-900">Message Sent!</h2>
                      <p className="text-gray-500 font-bold text-lg max-w-sm mx-auto">
                        Thank you for reaching out. We've received your magic message and will get back to you soon!
                      </p>
                      <button
                        onClick={() => setIsSuccess(false)}
                        className="px-8 py-3 bg-brand-purple text-white rounded-2xl font-black shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                      >
                        Send Another Message <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-6 relative z-10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-4">
                            Your Name
                          </label>
                          <input
                            {...register("name")}
                            className={`w-full px-6 py-4 rounded-2xl border-4 bg-gray-50 focus:bg-white transition-all outline-none font-bold text-gray-700 ${
                              errors.name ? "border-red-100 focus:border-red-200" : "border-gray-50 focus:border-brand-purple/20"
                            }`}
                            placeholder="e.g. Super Parent"
                          />
                          {errors.name && (
                            <p className="text-red-500 text-xs font-black ml-4 uppercase tracking-tighter">
                              {errors.name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-4">
                            Email Address
                          </label>
                          <input
                            {...register("email")}
                            className={`w-full px-6 py-4 rounded-2xl border-4 bg-gray-50 focus:bg-white transition-all outline-none font-bold text-gray-700 ${
                              errors.email ? "border-red-100 focus:border-red-200" : "border-gray-50 focus:border-brand-purple/20"
                            }`}
                            placeholder="e.g. parent@magic.com"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs font-black ml-4 uppercase tracking-tighter">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-4">
                          Subject
                        </label>
                        <input
                          {...register("subject")}
                          className={`w-full px-6 py-4 rounded-2xl border-4 bg-gray-50 focus:bg-white transition-all outline-none font-bold text-gray-700 ${
                            errors.subject ? "border-red-100 focus:border-red-200" : "border-gray-50 focus:border-brand-purple/20"
                          }`}
                          placeholder="What can we help you with?"
                        />
                        {errors.subject && (
                          <p className="text-red-500 text-xs font-black ml-4 uppercase tracking-tighter">
                            {errors.subject.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-4">
                          Message
                        </label>
                        <textarea
                          {...register("message")}
                          rows={5}
                          className={`w-full px-6 py-4 rounded-2xl border-4 bg-gray-50 focus:bg-white transition-all outline-none font-bold text-gray-700 resize-none ${
                            errors.message ? "border-red-100 focus:border-red-200" : "border-gray-50 focus:border-brand-purple/20"
                          }`}
                          placeholder="Tell us all about it! 🌈"
                        />
                        {errors.message && (
                          <p className="text-red-500 text-xs font-black ml-4 uppercase tracking-tighter">
                            {errors.message.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-brand-purple text-white rounded-3xl font-black text-xl shadow-xl shadow-brand-purple/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Sending Magic...
                          </>
                        ) : (
                          <>
                            <Send className="w-6 h-6" />
                            Send Message
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
