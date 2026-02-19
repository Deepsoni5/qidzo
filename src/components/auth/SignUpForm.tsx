"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useSignUp, useSignIn, useUser } from "@clerk/nextjs";
import { updateClerkUserMetadata } from "@/actions/auth";
import { invalidateParentCache } from "@/actions/parent";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInYears } from "date-fns";
import { Loader2, Eye, EyeOff, Check, X, Upload, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabaseClient";

// --- Step 1: Email & Password Schema ---
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// --- Step 2: Verification Code Schema ---
const verificationSchema = z.object({
  code: z.string().min(6, "Code must be 6 digits"),
});

// --- Step 3: Profile Details Schema ---
const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+91[0-9]{10}$/.test(val), "Phone number must start with +91 and be 10 digits"),
  dob: z
    .string()
    .optional()
    .refine((dateStr) => {
      if (!dateStr) return true
      const date = new Date(dateStr)
      const age = differenceInYears(new Date(), date)
      return age >= 22
    }, "You must be 22+ to create a parents account"),
  avatar: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;
type VerificationValues = z.infer<typeof verificationSchema>;
type ProfileValues = z.infer<typeof profileSchema>;

export default function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<"auth" | "verification" | "profile">("auth");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for username availability
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak"|"medium"|"strong"|null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  // Forms
  const authForm = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const verificationForm = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    mode: "onChange",
    defaultValues: {
      code: "",
    },
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      username: "",
      phone: "+91",
      dob: "",
      avatar: "", // Default avatar selection logic can go here
    },
  });

  // Handle OAuth Redirect Return
  useEffect(() => {

    if (isUserLoaded && user) {
        const checkProfile = async () => {
            // Check if profile exists in Supabase
            const { data, error } = await supabase.from("parents").select("id").eq("clerk_id", user.id).single();
            

            if (data) {
                // Profile exists, redirect to dashboard
                router.push("/");
            } else {
                // Profile missing, go to profile step
                setStep("profile");
                
                // Pre-fill data from Clerk user
                if (user.primaryEmailAddress?.emailAddress) {
                    authForm.setValue("email", user.primaryEmailAddress.emailAddress);
                }
                if (user.fullName) {
                    profileForm.setValue("fullName", user.fullName);
                }
                if (user.imageUrl) {
                    setAvatarPreview(user.imageUrl);
                    profileForm.setValue("avatar", user.imageUrl);
                }
            }
        };
        checkProfile();
    }
  }, [isUserLoaded, user, router]); // removed authForm and profileForm from dependency to avoid loop if they change reference (though they shouldn't)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        if (res.ok) {
            profileForm.setValue("avatar", data.url);
            setAvatarPreview(data.url);
            toast.success("Avatar uploaded! 📸", {
                className: "bg-green-50 border-green-200",
                classNames: {
                    title: "text-green-800 font-bold",
                },
            });
        } else {
            toast.error("Upload failed", { 
                description: data.error,
                className: "bg-red-50 border-red-200",
                classNames: {
                    title: "text-red-800 font-bold",
                    description: "text-red-700 font-semibold",
                },
            });
        }
    } catch (err) {
        console.error(err);
        toast.error("Upload error", {
            className: "bg-red-50 border-red-200",
            classNames: {
                title: "text-red-800 font-bold",
            },
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleOAuth = (strategy: 'oauth_google' | 'oauth_facebook') => {
    if (!isLoaded || !signUp) {
        return;
    }
    return signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-up",
        redirectUrlComplete: "/sign-up",
    });
  };

  // Step 1: Create Clerk Account
  const onAuthSubmit = async (data: AuthValues) => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verification");
      toast.success("Account created! 🚀", {
        description: "Please check your email for the verification code.",
      });
    } catch (err: any) {
      const errorCode = err.errors?.[0]?.code;
      let userMsg = err.errors?.[0]?.message || "Something went wrong. Please try again.";

      if (errorCode === "form_identifier_exists") {
        userMsg = "This email is already registered! Please try logging in instead.";
      }

      toast.error("Sign up failed 🛑", {
        description: userMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateParentId = () => {
    const year = new Date().getFullYear()
    const yy = String(year).slice(-2)
    const rand = Math.floor(100000 + Math.random() * 900000) // 6 digits
    return `QP${yy}${rand}`
  }

  // Step 2: Verify Email
  const onVerificationSubmit = async (data: VerificationValues) => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: data.code,
      });

      if (completeSignUp.status !== "complete") {
        toast.error("Verification failed. Please try again.");
      } else {
        // Don't set active yet, wait for profile creation
        // But Clerk might auto-login? 
        // We will setActive after profile creation to ensure data consistency?
        // Actually, if we don't setActive, we might not be able to get the clerk ID easily?
        // Let's setActive here, but maybe we need it for the user ID.
        // completeSignUp.createdUserId gives the ID.
        if (completeSignUp.createdUserId) {
            setCreatedUserId(completeSignUp.createdUserId);
        }
        if (completeSignUp.createdSessionId) {
            setCreatedSessionId(completeSignUp.createdSessionId);
        }
        
        toast.success("Email verified!");
        setStep("profile");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      toast.error(err.errors?.[0]?.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  // Check username availability
  const checkUsername = async (username: string) => {
    if (username.length < 3) return;
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("parents")
        .select("username")
        .eq("username", username)
        .single();
      
      // if data exists, username is taken
      // if error is PGRST116 (JSON object requested, multiple (or no) rows returned), it's likely free if no rows
      // actually .single() returns error if no rows found, which means available
      
      if (data) {
        setUsernameAvailable(false);
      } else {
        setUsernameAvailable(true);
      }
    } catch (error) {
        // Assume available if error (likely "row not found")
        setUsernameAvailable(true);
    } finally {
        setCheckingUsername(false);
    }
  };

  // Step 3: Create Supabase Profile
  const onProfileSubmit = async (data: ProfileValues) => {
    if (!isLoaded) return;
    
    // For OAuth, user is already signed in so we use user.id
    // For email/password, we use signUp.createdUserId or stored state
    const userId = user?.id || signUp?.createdUserId || createdUserId;

    

    if (!userId) {
        console.error("[SignUp] Error: User ID not found");
        toast.error("Error: User ID not found. Please restart.");
        return;
    }
    setIsLoading(true);

    try {
        const parentId = generateParentId();
        const avatarUrl = data.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
        const trialStart = new Date();
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 7);

        // 1. Update Clerk User Metadata (Critical for UI Sync)
        const [firstName, ...lastNameParts] = data.fullName.trim().split(' ');
        const lastName = lastNameParts.join(' ');

        // Use Server Action to update Clerk User Metadata (Robust & Secure)
        // This works even if client-side session is not yet active or signUp state is lost
        const updateRes = await updateClerkUserMetadata(userId, firstName, lastName);
        
        if (updateRes.success) {
            console.log("[SignUp] Clerk Metadata updated successfully");
        } else {
            console.error("[SignUp] Failed to update Clerk Metadata:", updateRes.error);
            // Non-blocking, proceed with DB insert
        }

        console.log("[SignUp] Inserting parent into Supabase...");
        const { error } = await supabase.from("parents").insert({
            clerk_id: userId,
            email: authForm.getValues("email"),
            parent_id: parentId,
            username: data.username,
            name: data.fullName,
            phone: data.phone,
            date_of_birth: data.dob ? new Date(data.dob) : null,
            avatar: avatarUrl,
            subscription_plan: 'ELITE',
            subscription_status: 'ACTIVE',
            subscription_ends_at: trialEnd.toISOString(),
            max_children_slots: 1,
            role: 'parent'
        });

        if (error) {
            console.error(error);
            if (error.code === '23505') { // Unique violation
                 toast.error("Profile Exists ⚠️", {
                     description: "Username or Email is already taken.",
                 });
            } else {
                 toast.error("Profile Creation Failed 🛑", {
                     description: error.message,
                 });
            }
            return;
        }

        // Finalize Clerk Session (only needed if not already active)
        if (!user && (signUp?.createdSessionId || createdSessionId)) {
            const sessionId = signUp?.createdSessionId || createdSessionId;
            if (sessionId) {
                await setActive({ session: sessionId });
            }
        }
        
        // Invalidate cache to ensure Navbar updates immediately
        await invalidateParentCache(userId);

        toast.success("Welcome to Qidzo! 🎉", {
            description: "Your parent account is ready to go!",
            duration: 5000,
        });
        router.push("/parent/dashboard"); 

    } catch (err: any) {
        console.error(err);
        toast.error("Unexpected Error 🛑", {
            description: "Something went wrong. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  // --- Render ---

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-gray-100">
      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 w-full">
        <div 
            className="h-full bg-brand-purple transition-all duration-500 ease-in-out"
            style={{ 
                width: step === "auth" ? "33%" : step === "verification" ? "66%" : "100%" 
            }}
        />
      </div>

      <div className="p-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-nunito font-black text-gray-800 mb-2">
                {step === "auth" && "Join the Fun! 🚀"}
                {step === "verification" && "Verify Email 📧"}
                {step === "profile" && "Setup Profile 👤"}
            </h2>
            <p className="text-gray-500 font-medium">
                {step === "auth" && "Create your parent account to get started"}
                {step === "verification" && "We sent a code to " + authForm.getValues("email")}
                {step === "profile" && "Tell us a bit about yourself"}
            </p>
        </div>

        {/* Step 1: Auth Form */}
        {step === "auth" && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Button 
                    variant="outline" 
                    className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => handleOAuth('oauth_google')}
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Google
                </Button>
                <Button 
                    variant="outline" 
                    className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => handleOAuth('oauth_facebook')}
                >
                    <svg className="w-5 h-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.592v1.4h3.67l-.418 3.667h-3.252v7.98h-4.968Z" />
                    </svg>
                    Facebook
                </Button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500 font-bold tracking-wider">Or register with</span>
                </div>
            </div>

          <Form {...authForm}>
            <form onSubmit={authForm.handleSubmit(onAuthSubmit)} className="space-y-4">
              <FormField
                control={authForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="parent@example.com" {...field} className="rounded-xl border-2 focus:border-brand-purple" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={authForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Password</FormLabel>
                    <div className="relative">
                        <FormControl>
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Min 8 chars" 
                            {...field} 
                            className="rounded-xl border-2 focus:border-brand-purple pr-10" 
                            onChange={(e) => {
                              field.onChange(e)
                              const v = e.target.value
                              const score =
                                /[A-Z]/.test(v) && /[0-9]/.test(v) && v.length >= 12
                                  ? "strong"
                                  : /[A-Z]/.test(v) && /[0-9]/.test(v) && v.length >= 8
                                  ? "medium"
                                  : "weak"
                              setPasswordStrength(score)
                            }}
                        />
                        </FormControl>
                        <button
                            type="button"
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {passwordStrength && (
                      <p className={`text-xs mt-1 font-medium ${
                        passwordStrength === "strong" ? "text-green-600" :
                        passwordStrength === "medium" ? "text-yellow-600" : "text-red-600"
                      }`}>
                        Password strength: {passwordStrength}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2 my-4">
                  <input type="checkbox" id="terms" className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple" required />
                  <label htmlFor="terms" className="text-sm text-gray-500">
                      I agree to the <a href="#" className="text-brand-purple font-bold hover:underline">Terms</a> & <a href="#" className="text-brand-purple font-bold hover:underline">Privacy Policy</a>
                  </label>
              </div>

              {/* Clerk CAPTCHA Container */}
              <div id="clerk-captcha" />

              <Button 
                type="submit" 
                className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Next"}
              </Button>

              <div className="text-center mt-4">
                <span className="text-gray-500">Already have an account? </span>
                <a href="/sign-in" className="text-brand-purple font-bold hover:underline">Login</a>
              </div>
            </form>
          </Form>
          </>
        )}

        {/* Step 2: Verification Form */}
        {step === "verification" && (
          <Form {...verificationForm}>
            <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-6">
              <FormField
                control={verificationForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Verification Code</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} className="rounded-xl border-2 focus:border-brand-purple text-center text-2xl tracking-widest" maxLength={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Verify Email"}
              </Button>
            </form>
          </Form>
        )}

        {/* Step 3: Profile Form */}
        {step === "profile" && (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 group-hover:border-brand-purple transition-colors bg-gray-50 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-brand-purple text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-brand-purple/90 transition-colors"
                  >
                    <Upload size={16} />
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 font-medium">Upload Profile Picture</p>
              </div>

              {/* Full Name */}
              <FormField
                control={profileForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="rounded-xl border-2 focus:border-brand-purple" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Username */}
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Username</FormLabel>
                    <div className="relative">
                        <FormControl>
                        <Input 
                            placeholder="super_parent" 
                            {...field} 
                            className="rounded-xl border-2 focus:border-brand-purple" 
                            onChange={(e) => {
                                field.onChange(e);
                                setUsernameAvailable(null);
                                if (e.target.value.length >= 3) {
                                    checkUsername(e.target.value);
                                }
                            }}
                        />
                        </FormControl>
                        {field.value.length >= 3 && (
                            <div className="absolute right-3 top-2.5">
                                {checkingUsername ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                ) : usernameAvailable ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <X className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                        )}
                    </div>
                    {usernameAvailable === false && !checkingUsername && (
                        <>
                          <p className="text-xs text-red-500 font-medium mt-1">Username is already taken</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Array.from({ length: 3 }).map((_, i) => {
                              const base = field.value.replace(/[^a-zA-Z0-9_]/g, "")
                              const suggestion =
                                i === 0
                                  ? `${base}_${Math.floor(100 + Math.random() * 900)}`
                                  : i === 1
                                  ? `${base}${Math.floor(1000 + Math.random() * 9000)}`
                                  : `${base}_${new Date().getFullYear().toString().slice(-2)}`
                              return (
                                <button
                                  type="button"
                                  key={i}
                                  className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                                  onClick={() => {
                                    profileForm.setValue("username", suggestion, { shouldValidate: true })
                                    checkUsername(suggestion)
                                  }}
                                >
                                  {suggestion}
                                </button>
                              )
                            })}
                          </div>
                        </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+919876543210" {...field} className="rounded-xl border-2 focus:border-brand-purple" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DOB */}
              <FormField
                control={profileForm.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="rounded-xl border-2 focus:border-brand-purple" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-hot-pink hover:bg-hot-pink/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-hot-pink/20 transition-all hover:scale-[1.02]"
                disabled={isLoading || usernameAvailable === false}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Create Account 🎉"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
