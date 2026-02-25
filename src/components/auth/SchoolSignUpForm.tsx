"use client";

import { useState, useEffect } from "react";
import { useSignUp, useUser } from "@clerk/nextjs";
import { updateClerkUserMetadata } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabaseClient";
import { create } from "domain";

const gradeOptions = [
  "Nursery",
  "LKG",
  "UKG",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const verificationSchema = z.object({
  code: z.string().min(6, "Code must be 6 digits"),
});

const profileSchema = z.object({
  schoolName: z.string().min(3, "School name is required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  contactPhone: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits")
    .regex(/^[0-9]+$/, "Phone number must contain only digits"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  websiteUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\//.test(val),
      "Website must start with http:// or https://"
    ),
  gradeFrom: z.string().min(1, "Select start grade"),
  gradeTo: z.string().min(1, "Select end grade"),
  about: z.string().min(20, "Tell parents more about your school"),
  logo: z.string().min(1, "School logo is required"),
  banner: z.string().optional(),
  brandPrimaryColor: z.string().optional(),
  brandSecondaryColor: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;
type VerificationValues = z.infer<typeof verificationSchema>;
type ProfileValues = z.infer<typeof profileSchema>;

type Step = "auth" | "verification" | "details" | "branding";

export default function SchoolSignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("auth");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<"logo" | "banner" | null>(null);

  const authForm = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const verificationForm = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      schoolName: "",
      contactPerson: "",
      contactPhone: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      addressLine1: "",
      addressLine2: "",
      websiteUrl: "",
      gradeFrom: "",
      gradeTo: "",
      about: "",
      logo: "",
      banner: "",
      brandPrimaryColor: "#8B5CF6",
      brandSecondaryColor: "#FBBF24",
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading("logo");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        profileForm.setValue("logo", data.url, { shouldValidate: true });
        toast.success("Logo uploaded! 📸", {
          className: "bg-green-50 border-green-200",
          classNames: {
            title: "text-green-800 font-bold",
          },
        });
      } else {
        toast.error("Logo upload failed", {
          description: data.error || "Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Logo upload error");
    } finally {
      setIsUploading(null);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading("banner");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        profileForm.setValue("banner", data.url, { shouldValidate: true });
        toast.success("Banner uploaded! 📸", {
          className: "bg-green-50 border-green-200",
          classNames: {
            title: "text-green-800 font-bold",
          },
        });
      } else {
        toast.error("Banner upload failed", {
          description: data.error || "Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Banner upload error");
    } finally {
      setIsUploading(null);
    }
  };
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    const prefillFromClerk = async () => {
      const { data } = await supabase
        .from("schools")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (data) {
        router.push("/school/dashboard");
        return;
      }

      setStep("details");
      if (user.primaryEmailAddress?.emailAddress) {
        authForm.setValue("email", user.primaryEmailAddress.emailAddress);
      }
      if (user.fullName) {
        profileForm.setValue("contactPerson", user.fullName);
      }
    };

    prefillFromClerk();
  }, [isUserLoaded, user, router, authForm, profileForm]);

  const handleOAuth = (strategy: "oauth_google" | "oauth_facebook") => {
    if (!isLoaded || !signUp) return;
    return signUp.authenticateWithRedirect({
      strategy,
      redirectUrl: "/school/sign-up",
      redirectUrlComplete: "/school/sign-up",
    });
  };

  const onAuthSubmit = async (data: AuthValues) => {
    if (!isLoaded || !signUp) return;
    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verification");
      toast.success("Account created", {
        description: "Check your email for the verification code.",
      });
    } catch (err: any) {
      const errorCode = err.errors?.[0]?.code;
      let userMsg =
        err.errors?.[0]?.message || "Something went wrong. Please try again.";

      if (errorCode === "form_identifier_exists") {
        userMsg =
          "This email is already registered. Please use School Login instead.";
      }

      toast.error("Sign up failed", {
        description: userMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerificationSubmit = async (data: VerificationValues) => {
    if (!isLoaded || !signUp) return;
    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: data.code,
      });

      if (completeSignUp.status !== "complete") {
        toast.error("Verification failed. Please try again.");
        return;
      }

      if (completeSignUp.createdUserId) {
        setCreatedUserId(completeSignUp.createdUserId);
      }
      if (completeSignUp.createdSessionId) {
        setCreatedSessionId(completeSignUp.createdSessionId);
      }

      toast.success("Email verified");
      setStep("details");
    } catch (err: any) {
      toast.error(
        err.errors?.[0]?.message || "Invalid code, please check and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateSchoolId = () => {
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `SCH${rand}`;
  };

  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleDetailsNext = async () => {
    const fieldsToValidate: (keyof ProfileValues)[] = [
      "schoolName",
      "contactPerson",
      "contactPhone",
      "gradeFrom",
      "gradeTo",
      "about",
    ];
    const isValid = await profileForm.trigger(fieldsToValidate);
    if (isValid) {
      setStep("branding");
    }
  };

  const onProfileSubmit = async (data: ProfileValues) => {
    if (!isLoaded) return;

    const userId = user?.id || signUp?.createdUserId || createdUserId;
    if (!userId) {
      toast.error("Error: user session not found. Please restart signup.");
      return;
    }

    setIsLoading(true);

    try {
      let schoolId = generateSchoolId();
      const slug = generateSlug(data.schoolName);

      const gradesOffered = `${data.gradeFrom} to ${data.gradeTo}`;
      const gradesArray = [gradesOffered];

      const emailFromAuth = authForm.getValues("email");

      const firstName = data.contactPerson.split(" ")[0] || data.contactPerson;
      const lastName =
        data.contactPerson.split(" ").slice(1).join(" ") || undefined;

      await updateClerkUserMetadata(
        userId,
        firstName,
        lastName || "",
        "school"
      );

      let insertError = null as any;
      for (let attempt = 0; attempt < 5; attempt++) {
        const { error } = await supabase.from("schools").insert({
          school_id: schoolId,
          clerk_id: userId,
          name: data.schoolName,
          slug,
          contact_email: emailFromAuth,
          contact_phone: `+91${data.contactPhone}`,
          website_url: data.websiteUrl || null,
          address_line1: data.addressLine1,
          address_line2: data.addressLine2 || null,
          city: data.city,
          state: data.state,
          country: data.country,
          postal_code: data.postalCode,
          grades_offered: gradesArray,
          about: data.about,
          logo_url: data.logo,
          banner_url: data.banner || null,
          brand_primary_color: data.brandPrimaryColor || null,
          brand_secondary_color: data.brandSecondaryColor || null,
        });
        if (!error) {
          insertError = null;
          break;
        }
        insertError = error;
        if (error.code === "23505") {
          schoolId = generateSchoolId();
          continue;
        } else {
          break;
        }
      }

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("School already exists", {
            description:
              "An account for this school or email already exists. Please use School Login.",
          });
        } else {
          toast.error("School creation failed", {
            description: insertError.message,
          });
        }
        return;
      }

      if (!user && (signUp?.createdSessionId || createdSessionId)) {
        const sessionId = signUp?.createdSessionId || createdSessionId;
        if (sessionId) {
          await setActive({ session: sessionId });
        }
      }

      toast.success("School registered", {
        description: "Welcome to Qidzo School Pages.",
      });
      router.push("/school/dashboard");
    } catch (err: any) {
      toast.error("Unexpected error", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress =
    step === "auth"
      ? 25
      : step === "verification"
      ? 50
      : step === "details"
      ? 75
      : 100;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-gray-100">
      <div className="h-2 bg-gray-100 w-full">
        <div
          className="h-full bg-brand-purple transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-8">
        <div id="clerk-captcha" />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-nunito font-black text-gray-800 mb-2">
            {step === "auth" && "Create School Account"}
            {step === "verification" && "Verify Email"}
            {step === "details" && "School Details"}
            {step === "branding" && "Campus & Branding"}
          </h2>
          <p className="text-gray-500 font-medium">
            {step === "auth" && "Use Google, Facebook or email to get started"}
            {step === "verification" &&
              "We sent a code to " + authForm.getValues("email")}
            {step === "details" &&
              "Tell us the basics about your school so parents trust you"}
            {step === "branding" &&
              "Add location and branding so your page feels unique"}
          </p>
        </div>

        {step === "auth" && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                onClick={() => handleOAuth("oauth_google")}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
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
                className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                onClick={() => handleOAuth("oauth_facebook")}
              >
                <svg className="w-5 h-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.592v1.4h3.67l-.418 3.667h-3.252v7.98h-4.968Z" />
                </svg>
                Facebook
              </Button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-bold">
                  Or use email
                </span>
              </div>
            </div>

            <Form {...authForm}>
              <form
                onSubmit={authForm.handleSubmit(onAuthSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={authForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="principal@school.com"
                          {...field}
                          className="rounded-xl border-2 focus:border-brand-purple"
                        />
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
                      <FormLabel className="font-bold text-gray-700">
                        Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 8 characters"
                            {...field}
                            className="rounded-xl border-2 focus:border-brand-purple pr-10"
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute cursor-pointer right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02] cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : "Next"}
                </Button>
              </form>
            </Form>
          </>
        )}

        {step === "verification" && (
          <Form {...verificationForm}>
            <form
              onSubmit={verificationForm.handleSubmit(onVerificationSubmit)}
              className="space-y-6"
            >
              <FormField
                control={verificationForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      Verification Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        {...field}
                        className="rounded-xl border-2 focus:border-brand-purple text-center text-2xl tracking-widest"
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02] cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Verify"}
              </Button>
            </form>
          </Form>
        )}

        {step === "details" && (
          <Form {...profileForm}>
            <form className="space-y-4">
              <FormField
                control={profileForm.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      School Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC International School"
                        {...field}
                        className="rounded-xl border-2 focus:border-brand-purple"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      Contact Person
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Principal or Admin Name"
                        {...field}
                        className="rounded-xl border-2 focus:border-brand-purple"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      Phone Number
                    </FormLabel>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center bg-gray-100 border-2 border-gray-200 rounded-xl px-3 font-bold text-gray-500 select-none">
                        +91
                      </div>
                      <FormControl>
                        <Input
                          placeholder="9876543210"
                          {...field}
                          maxLength={10}
                          className="rounded-xl border-2 focus:border-brand-purple"
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={profileForm.control}
                  name="gradeFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        Grade From
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2 focus:border-brand-purple cursor-pointer">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2">
                          {gradeOptions.map((grade) => (
                            <SelectItem
                              key={grade}
                              value={grade}
                              className="cursor-pointer"
                            >
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="gradeTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        Grade To
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2 focus:border-brand-purple cursor-pointer">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2">
                          {gradeOptions.map((grade) => (
                            <SelectItem
                              key={grade}
                              value={grade}
                              className="cursor-pointer"
                            >
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      About School
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Share your vision, facilities and what makes your school special."
                        {...field}
                        className="rounded-2xl border-2 focus:border-brand-purple"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={handleDetailsNext}
                className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02] cursor-pointer"
                disabled={isLoading}
              >
                Continue
              </Button>
            </form>
          </Form>
        )}

        {step === "branding" && (
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              {/* Media Uploads */}
              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Logo Upload (Required) */}
                <div className="flex flex-col items-center">
                  <FormLabel className="font-bold text-gray-700 mb-2 self-start">
                    School Logo (Required)
                  </FormLabel>
                  <div className="relative group w-full">
                    <div className="w-full h-32 rounded-2xl overflow-hidden border-4 border-dashed border-gray-100 group-hover:border-brand-purple transition-all bg-gray-50 flex items-center justify-center relative">
                      {profileForm.watch("logo") ? (
                        <>
                          <img
                            src={profileForm.watch("logo")}
                            alt="Logo"
                            className="w-full h-full object-contain p-2"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              profileForm.setValue("logo", "");
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors z-30 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center z-10"
                        >
                          {isUploading === "logo" ? (
                            <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-8 h-8 text-gray-300" />
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Upload Logo
                              </span>
                            </>
                          )}
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={!!isUploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  {profileForm.formState.errors.logo && (
                    <p className="text-sm font-medium text-destructive mt-1 self-start">
                      {profileForm.formState.errors.logo.message}
                    </p>
                  )}
                </div>

                {/* Banner Upload (Optional) */}
                <div className="flex flex-col items-center">
                  <FormLabel className="font-bold text-gray-700 mb-2 self-start">
                    Campus Banner (Optional)
                  </FormLabel>
                  <div className="relative group w-full">
                    <div className="w-full h-40 rounded-2xl overflow-hidden border-4 border-dashed border-gray-100 group-hover:border-brand-purple transition-all bg-gray-50 flex items-center justify-center relative">
                      {profileForm.watch("banner") ? (
                        <>
                          <img
                            src={profileForm.watch("banner")}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              profileForm.setValue("banner", "");
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors z-30 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <label
                          htmlFor="banner-upload"
                          className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center z-10"
                        >
                          {isUploading === "banner" ? (
                            <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-8 h-8 text-gray-300" />
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Upload Banner
                              </span>
                            </>
                          )}
                          <input
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBannerUpload}
                            disabled={!!isUploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={profileForm.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Street, area"
                        {...field}
                        className="rounded-xl border-2 focus:border-brand-purple"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      Address line 2 (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Landmark, building"
                        {...field}
                        className="rounded-xl border-2 focus:border-brand-purple"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={profileForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        City
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mumbai"
                          {...field}
                          className="rounded-xl border-2 focus:border-brand-purple"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        State
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Maharashtra"
                          {...field}
                          className="rounded-xl border-2 focus:border-brand-purple"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={profileForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        Country
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="India"
                          {...field}
                          className="rounded-xl border-2 focus:border-brand-purple"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        PIN code
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="400001"
                          {...field}
                          className="rounded-xl border-2 focus:border-brand-purple"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">
                      Website (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.abcschool.in"
                        {...field}
                        className="rounded-xl border-2 focus:border-brand-purple"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={profileForm.control}
                  name="brandPrimaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        Primary color (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="#8B5CF6"
                          {...field}
                          className="rounded-xl border-2 focus:border-brand-purple"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="brandSecondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">
                        Secondary color (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="#FBBF24"
                          {...field}
                          className="rounded-xl border-2 focus:border-brand-purple"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              

              <Button
                type="submit"
                className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02] cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
