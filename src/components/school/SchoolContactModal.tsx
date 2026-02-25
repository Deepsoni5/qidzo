"use client";

import { useState, useEffect } from "react";
import {
  X,
  Send,
  Mail,
  Phone,
  User,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { submitSchoolInquiry } from "@/actions/school-inquiry";
import { toast } from "sonner";

interface SchoolContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  schoolName: string;
  primaryColor: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
}

const INQUIRY_CATEGORIES = [
  "Admission Inquiry",
  "Fee Structure",
  "Curriculum Information",
  "Facilities & Infrastructure",
  "Extracurricular Activities",
  "Transportation",
  "General Query",
];

export default function SchoolContactModal({
  isOpen,
  onClose,
  schoolId,
  schoolName,
  primaryColor,
  userEmail = "",
  userPhone = "",
  userName = "",
}: SchoolContactModalProps) {
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
    phone: userPhone,
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: userName,
        email: userEmail,
        phone: userPhone,
        subject: "",
        message: "",
      });
    }
  }, [isOpen, userName, userEmail, userPhone]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject) {
      toast.error("Please select an inquiry category");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitSchoolInquiry({
        schoolId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });

      if (result.success) {
        toast.success("Inquiry sent successfully! 🎉", {
          description: "The school will get back to you soon.",
        });
        onClose();
      } else {
        toast.error(result.error || "Failed to send inquiry");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 sm:px-8 py-6 border-b border-gray-100 bg-white rounded-t-[32px]"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}03)`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900 mb-1">
                Contact {schoolName}
              </h2>
              <p className="text-sm font-bold text-gray-500">
                Send your inquiry and we'll get back to you soon! 📧
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Your Name <span className="text-hot-pink">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Email Address <span className="text-hot-pink">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="your.email@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Phone Number <span className="text-hot-pink">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Subject/Category */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Inquiry Category <span className="text-hot-pink">*</span>
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 appearance-none cursor-pointer bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.25rem",
                }}
              >
                <option value="">Select a category</option>
                {INQUIRY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Your Message <span className="text-hot-pink">*</span>
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Tell us more about your inquiry..."
              rows={5}
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 resize-none"
            />
            <p className="mt-2 text-xs font-bold text-gray-400">
              {formData.message.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-black text-sm hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3.5 rounded-2xl text-white font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                boxShadow: `0 8px 20px ${primaryColor}35`,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Inquiry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
