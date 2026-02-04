"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { format, differenceInYears, subYears } from "date-fns";
import confetti from "canvas-confetti";
import * as LucideIcons from "lucide-react";
import { 
  User, Calendar, Upload, Lock, Heart, Check, ChevronRight, 
  ChevronLeft, Loader2, RefreshCw, Eye, EyeOff, X
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Types
type Step = 1 | 2 | 3 | 4 | 5;

interface Category {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

interface FormData {
  name: string;
  birth_date: Date | undefined;
  gender: string;
  username: string;
  bio: string;
  avatar: string;
  password: string;
passwordConfirm: string;
  preferred_categories: string[]; // array of category_ids
}

const INITIAL_DATA: FormData = {
  name: "",
  birth_date: undefined,
  gender: "",
  username: "",
  bio: "",
  avatar: "",
  password: "",
  passwordConfirm: "",
  preferred_categories: [],
};

export default function AddChildPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdChild, setCreatedChild] = useState<any>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("qidzo_add_child_form");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Convert date string back to Date object
        if (parsed.birth_date) {
          parsed.birth_date = new Date(parsed.birth_date);
        }
        setFormData({ ...INITIAL_DATA, ...parsed });
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("qidzo_add_child_form", JSON.stringify(formData));
  }, [formData]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const updateFields = (fields: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5) as Step);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1) as Step);
  };

  const validateStep = (currentStep: Step) => {
    switch (currentStep) {
      case 1:
        if (!formData.name || formData.name.length < 2) {
          toast.error("Please enter a valid name (2-50 characters)");
          return false;
        }
        if (!formData.birth_date) {
          toast.error("Please select a date of birth");
          return false;
        }
        const age = differenceInYears(new Date(), formData.birth_date);
        if (age < 4 || age > 17) {
          toast.error("Child must be between 4 and 17 years old");
          return false;
        }
        return true;
      case 2:
        if (!formData.username || formData.username.length < 3) {
          toast.error("Please enter a username (min 3 chars)");
          return false;
        }
        if (usernameAvailable === false) {
          toast.error("Username is already taken");
          return false;
        }
        return true;
      case 3:
        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return false;
        }
        if (formData.password !== formData.passwordConfirm) {
          toast.error("Passwords do not match");
          return false;
        }
        return true;
      case 4:
        if (formData.preferred_categories.length < 3) {
          toast.error("Please select at least 3 interests");
          return false;
        }
        if (formData.preferred_categories.length > 8) {
          toast.error("Please select maximum 8 interests");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleCheckUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await fetch('/api/children/check-username', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setUsernameAvailable(data.available);
      if (!data.available) {
        // toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const toastId = toast.loading("Uploading avatar...");
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      updateFields({ avatar: data.url });
      toast.success("Avatar uploaded successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to upload avatar", { id: toastId });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    if (!user) {
      toast.error("You must be logged in to add a child");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating child profile...");

    try {
      const age = differenceInYears(new Date(), formData.birth_date!);
      
      const payload = {
        clerk_id: user.id, // Send Clerk ID to look up custom parent_id backend-side
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        password: formData.password,
        birth_date: formData.birth_date ? format(formData.birth_date, "yyyy-MM-dd") : null,
        age,
        gender: formData.gender,
        avatar: formData.avatar,
        preferred_categories: formData.preferred_categories,
      };

      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create profile");
      }

      setCreatedChild(data.child);
      toast.success("Child profile created successfully!", { id: toastId });
      
      // Clear storage
      localStorage.removeItem("qidzo_add_child_form");
      
      // Move to success step
      setStep(5);
      
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Render Steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFields({ name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none"
                  placeholder="e.g. Alex Johnson"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.birth_date ? format(formData.birth_date, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    updateFields({ birth_date: date });
                  }}
                  max={format(new Date(), "yyyy-MM-dd")}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none"
                />
                {formData.birth_date && (
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    Age: {differenceInYears(new Date(), formData.birth_date)} years old
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gender (Optional)</label>
                <div className="flex gap-3">
                  {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                    <button
                      key={g}
                      onClick={() => updateFields({ gender: g })}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        formData.gender === g
                          ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
                      updateFields({ username: val });
                      handleCheckUsername(val);
                    }}
                    className={`w-full px-4 py-3 rounded-2xl border-2 outline-none font-nunito font-bold transition-all ${
                      usernameAvailable === true ? "border-green-500" : 
                      usernameAvailable === false ? "border-red-500" : "border-gray-100 focus:border-brand-purple"
                    }`}
                    placeholder="e.g. RocketStar892"
                  />
                  <div className="absolute right-4 top-3.5">
                    {checkingUsername ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : usernameAvailable === true ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <X className="w-5 h-5 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {usernameAvailable === false && (
                  <p className="text-xs font-bold text-red-500 mt-1">Username is taken</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bio (Optional)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateFields({ bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none resize-none h-24"
                  placeholder="Tell us a little about your child..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Avatar (Optional)</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer bg-white border-2 border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Photo
                      <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileUpload} />
                    </label>
                    <p className="text-xs text-gray-400 mt-2 font-bold">Max 2MB. JPG or PNG only.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFields({ password: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none"
                    placeholder="Min 6 characters"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.passwordConfirm}
                  onChange={(e) => updateFields({ passwordConfirm: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none"
                  placeholder="Re-enter password"
                />
              </div>

              <div className="bg-sky-blue/10 p-4 rounded-2xl border border-sky-blue/20">
                <h4 className="font-black text-sky-blue mb-2 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Login Credentials
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold">Username:</span>
                    <span className="font-black text-gray-900">{formData.username || "..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold">Password:</span>
                    <span className="font-black text-gray-900">
                      {formData.password ? (showPassword ? formData.password : "••••••••") : "..."}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-sky-blue mt-3 font-bold text-center">
                  Save these credentials! Your child will use them to login.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="font-black text-lg text-gray-900">What does {formData.name} like?</h3>
              <p className="text-sm text-gray-500 font-bold">Choose 3-8 interests</p>
              <div className="mt-2 inline-block px-3 py-1 bg-brand-purple/10 text-brand-purple rounded-full text-xs font-black">
                {formData.preferred_categories.length} of 8 selected
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
              {categories.map((cat) => {
                const isSelected = formData.preferred_categories.includes(cat.category_id);
                const isHovered = hoveredCategory === cat.id;
                const displayColor = cat.color || "#8B5CF6"; // Fallback to brand purple

                // Convert kebab-case icon name to PascalCase for Lucide component
                // e.g. "landmark" -> "Landmark", "book-open" -> "BookOpen"
                const iconName = cat.icon
                  .split('-')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join('');
                
                // Dynamic icon lookup from LucideIcons namespace
                const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[cat.icon] || LucideIcons.HelpCircle;

                return (
                  <button
                    key={cat.id}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => {
                      const current = formData.preferred_categories;
                      if (isSelected) {
                        updateFields({ preferred_categories: current.filter(id => id !== cat.category_id) });
                      } else {
                        if (current.length >= 8) return;
                        updateFields({ preferred_categories: [...current, cat.category_id] });
                      }
                    }}
                    style={{
                      borderColor: isSelected || isHovered ? displayColor : "#f3f4f6", // gray-100
                      backgroundColor: isSelected ? `${displayColor}15` : "white", // ~8% opacity
                      transform: isSelected ? "scale(1.05)" : "scale(1)",
                    }}
                    className={`relative p-3 rounded-2xl border-2 text-left transition-all duration-200 group ${
                      isSelected
                        ? "shadow-md"
                        : "hover:shadow-sm"
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg mb-2 transition-colors"
                      style={{
                        backgroundColor: isSelected ? displayColor : "#f3f4f6",
                        color: isSelected ? "white" : (isHovered ? displayColor : "#6b7280")
                      }}
                    >
                       <IconComponent className="w-4 h-4" /> 
                    </div>
                    <p className="font-bold text-xs text-gray-900 leading-tight">{cat.name}</p>
                    {isSelected && (
                      <div 
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: displayColor }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            
            <h2 className="text-3xl font-black font-nunito text-gray-900">Profile Created!</h2>
            <p className="text-gray-500 font-bold">
              {createdChild?.name} is ready to start learning.
            </p>

            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-xl max-w-sm mx-auto transform rotate-1">
              <h3 className="font-black text-gray-900 mb-4 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-brand-purple" /> Login Card
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400">USERNAME</span>
                  <span className="font-black font-mono text-lg text-brand-purple">{createdChild?.username}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400">PASSWORD</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black font-mono text-lg text-brand-purple">
                      {showPassword ? formData.password : "••••••••"}
                    </span>
                    <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-brand-purple">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-4">
                ID: {createdChild?.child_id}
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
              <button
                onClick={() => {
                  setFormData(INITIAL_DATA);
                  setStep(1);
                  setCreatedChild(null);
                }}
                className="w-full py-3 rounded-xl font-black text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 transition-colors"
              >
                Add Another Child
              </button>
              <Link
                href="/parent/dashboard"
                className="w-full py-3 rounded-xl font-black text-white bg-brand-purple hover:bg-brand-purple/90 transition-colors shadow-lg shadow-brand-purple/20"
              >
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100 relative overflow-hidden">
        {/* Progress Bar */}
        {step < 5 && (
          <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
            <div 
              className="h-full bg-brand-purple transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Header */}
        {step < 5 && (
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black font-nunito text-gray-900">
                {step === 1 && "Basic Information"}
                {step === 2 && "Username & Avatar"}
                {step === 3 && "Secure Account"}
                {step === 4 && "Interests"}
              </h1>
              <p className="text-sm font-bold text-gray-400">Step {step} of 4</p>
            </div>
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        {step < 5 && (
          <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end">
            {step === 4 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-brand-purple text-white rounded-xl font-black shadow-lg shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Profile"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
