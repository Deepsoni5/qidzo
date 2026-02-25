"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Upload, Check, AlertCircle, Shield, MapPin, Palette, GraduationCap, Globe, Phone, Mail, Building2, Info } from "lucide-react";
import Image from "next/image";
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
import { getSchoolProfile, updateSchoolSettings } from "@/actions/school";

// ─── Grade Options ────────────────────────────────────────────────────────────
const gradeOptions = [
    "Nursery", "LKG", "UKG",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
];

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const settingsSchema = z.object({
    name: z.string().min(3, "School name must be at least 3 characters"),
    contactEmail: z.string().email("Enter a valid email"),
    contactPhone: z
        .string()
        .min(10, "Phone must be 10 digits")
        .max(10, "Phone must be 10 digits")
        .regex(/^[0-9]+$/, "Only digits allowed"),
    websiteUrl: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^https?:\/\//.test(val),
            "Website must start with http:// or https://"
        ),
    addressLine1: z.string().min(5, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),
    postalCode: z.string().min(3, "Postal code is required"),
    gradeFrom: z.string().min(1, "Select start grade"),
    gradeTo: z.string().min(1, "Select end grade"),
    about: z.string().min(20, "About must be at least 20 characters"),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    brandPrimaryColor: z.string().optional(),
    brandSecondaryColor: z.string().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

// ─── Helper: parse grades_offered ─────────────────────────────────────────────
function parseGrades(gradesOffered: string[] | string | null): { from: string; to: string } {
    if (!gradesOffered) return { from: "", to: "" };
    const raw = Array.isArray(gradesOffered) ? gradesOffered[0] : gradesOffered;
    if (!raw) return { from: "", to: "" };
    const parts = raw.split(" to ");
    return { from: parts[0]?.trim() || "", to: parts[1]?.trim() || "" };
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({
    title,
    subtitle,
    icon: Icon,
    color,
    children,
}: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-8 py-5 border-b border-gray-100 flex items-center gap-4`}>
                <div className={`p-2.5 rounded-2xl ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-base font-black font-nunito text-gray-900">{title}</h2>
                    <p className="text-xs font-bold text-gray-400">{subtitle}</p>
                </div>
            </div>
            <div className="px-8 py-6">{children}</div>
        </div>
    );
}

// ─── Image Upload Button ──────────────────────────────────────────────────────
function ImageUploadField({
    label,
    value,
    uploading,
    required,
    accept,
    onUpload,
    hint,
}: {
    label: string;
    value: string | undefined;
    uploading: boolean;
    required?: boolean;
    accept?: string;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    hint?: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative group">
                {value ? (
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-gray-200">
                        <Image src={value} alt={label} fill className="object-cover" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <div className="text-white text-xs font-black flex flex-col items-center gap-1">
                                <Upload className="w-5 h-5" />
                                Change
                            </div>
                            <input type="file" accept={accept || "image/*"} className="hidden" onChange={onUpload} />
                        </label>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:border-sky-400 hover:bg-sky-50/30 transition-all cursor-pointer group">
                        {uploading ? (
                            <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-sky-400 transition-colors mb-2" />
                                <span className="text-xs font-bold text-gray-400 group-hover:text-sky-400 transition-colors">
                                    Click to upload
                                </span>
                            </>
                        )}
                        <input type="file" accept={accept || "image/*"} className="hidden" onChange={onUpload} />
                    </label>
                )}
            </div>
            {hint && <p className="text-[11px] font-bold text-gray-400">{hint}</p>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SchoolSettingsContent() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
    const [schoolId, setSchoolId] = useState<string | null>(null);

    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: "",
            contactEmail: "",
            contactPhone: "",
            websiteUrl: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "India",
            postalCode: "",
            gradeFrom: "",
            gradeTo: "",
            about: "",
            logoUrl: "",
            bannerUrl: "",
            brandPrimaryColor: "#8B5CF6",
            brandSecondaryColor: "#FBBF24",
        },
    });

    // ── Load existing data ──────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const school = await getSchoolProfile();
            if (!school) {
                setLoading(false);
                return;
            }

            setSchoolId(school.id);
            const grades = parseGrades(school.grades_offered);

            // Strip +91 prefix from phone if present
            const rawPhone = (school.contact_phone || "").replace(/^\+91/, "");

            form.reset({
                name: school.name || "",
                contactEmail: school.contact_email || "",
                contactPhone: rawPhone,
                websiteUrl: school.website_url || "",
                addressLine1: school.address_line1 || "",
                addressLine2: school.address_line2 || "",
                city: school.city || "",
                state: school.state || "",
                country: school.country || "India",
                postalCode: school.postal_code || "",
                gradeFrom: grades.from,
                gradeTo: grades.to,
                about: school.about || "",
                logoUrl: school.logo_url || "",
                bannerUrl: school.banner_url || "",
                brandPrimaryColor: school.brand_primary_color || "#8B5CF6",
                brandSecondaryColor: school.brand_secondary_color || "#FBBF24",
            });

            setLoading(false);
        })();
    }, [form]);

    // ── Image Upload ────────────────────────────────────────────────────────────
    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        field: "logoUrl" | "bannerUrl"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(field === "logoUrl" ? "logo" : "banner");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok && data.url) {
                form.setValue(field, data.url, { shouldValidate: true });
                toast.success(
                    field === "logoUrl" ? "Logo updated! 🖼️" : "Banner updated! 🖼️",
                    { description: "Image uploaded successfully." }
                );
            } else {
                toast.error("Upload failed", { description: data.error || "Please try again." });
            }
        } catch {
            toast.error("Upload error", { description: "Network problem, please retry." });
        } finally {
            setUploading(null);
        }
    };

    // ── Submit ──────────────────────────────────────────────────────────────────
    const onSubmit = async (values: SettingsValues) => {
        setSaving(true);
        try {
            const gradesOffered = [`${values.gradeFrom} to ${values.gradeTo}`];

            const result = await updateSchoolSettings({
                name: values.name,
                contact_email: values.contactEmail,
                contact_phone: `+91${values.contactPhone}`,
                website_url: values.websiteUrl,
                address_line1: values.addressLine1,
                address_line2: values.addressLine2,
                city: values.city,
                state: values.state,
                country: values.country,
                postal_code: values.postalCode,
                about: values.about,
                logo_url: values.logoUrl,
                banner_url: values.bannerUrl,
                brand_primary_color: values.brandPrimaryColor,
                brand_secondary_color: values.brandSecondaryColor,
                grades_offered: gradesOffered,
            });

            if (result.success) {
                toast.success("Settings saved! ✅", {
                    description: "Your school profile has been updated successfully.",
                });
            } else {
                toast.error("Save failed", {
                    description: result.error || "Please check the form and try again.",
                });
            }
        } catch {
            toast.error("Unexpected error", { description: "Please try again." });
        } finally {
            setSaving(false);
        }
    };

    // ── Loading skeleton ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-sky-blue animate-spin" />
                <p className="font-nunito font-black text-gray-400 uppercase tracking-widest text-sm animate-pulse">
                    Loading Settings...
                </p>
            </div>
        );
    }

    // ── Watched values for live previews ───────────────────────────────────────
    const logoUrl = form.watch("logoUrl");
    const bannerUrl = form.watch("bannerUrl");
    const primaryColor = form.watch("brandPrimaryColor");
    const secondaryColor = form.watch("brandSecondaryColor");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* ── 1. Basic Information ───────────────────────────────────────────── */}
                <SectionCard
                    title="Basic Information"
                    subtitle="Core school identity details"
                    icon={Building2}
                    color="bg-sky-blue/10 text-sky-blue"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">School Name <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="ABC International School" {...field} className="rounded-xl border-2 focus:border-sky-400 h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="contactEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> Contact Email <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="principal@school.com" {...field} className="rounded-xl border-2 focus:border-sky-400 h-11" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <div className="flex items-center justify-center bg-gray-100 border-2 border-gray-200 rounded-xl px-3 font-bold text-gray-500 select-none text-sm">
                                            +91
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder="9876543210"
                                                {...field}
                                                maxLength={10}
                                                className="rounded-xl border-2 focus:border-sky-400 h-11"
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

                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="websiteUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700 flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5" /> Website URL
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://yourschool.edu.in" {...field} className="rounded-xl border-2 focus:border-sky-400 h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* ── 2. Grades Offered ─────────────────────────────────────────────── */}
                <SectionCard
                    title="Grades Offered"
                    subtitle="The grade range your school teaches"
                    icon={GraduationCap}
                    color="bg-grass-green/10 text-grass-green"
                >
                    <div className="grid grid-cols-2 gap-5">
                        <FormField
                            control={form.control}
                            name="gradeFrom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">From Grade <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-xl border-2 h-11 cursor-pointer focus:border-grass-green">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-2">
                                            {gradeOptions.map((g) => (
                                                <SelectItem key={g} value={g} className="cursor-pointer">{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="gradeTo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">To Grade <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-xl border-2 h-11 cursor-pointer focus:border-grass-green">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-2">
                                            {gradeOptions.map((g) => (
                                                <SelectItem key={g} value={g} className="cursor-pointer">{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </SectionCard>

                {/* ── 3. About School ───────────────────────────────────────────────── */}
                <SectionCard
                    title="About Your School"
                    subtitle="Describe your school's vision, mission and facilities"
                    icon={Info}
                    color="bg-brand-purple/10 text-brand-purple"
                >
                    <FormField
                        control={form.control}
                        name="about"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">
                                    About <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={5}
                                        placeholder="Tell parents about your school's vision, mission, infrastructure, achievements and what makes you unique..."
                                        {...field}
                                        className="rounded-2xl border-2 focus:border-brand-purple resize-none"
                                    />
                                </FormControl>
                                <FormMessage />
                                <p className="text-[11px] font-bold text-gray-400 mt-1">
                                    {field.value?.length || 0} characters (minimum 20)
                                </p>
                            </FormItem>
                        )}
                    />
                </SectionCard>

                {/* ── 4. Location ───────────────────────────────────────────────────── */}
                <SectionCard
                    title="Location & Address"
                    subtitle="Your school's physical location"
                    icon={MapPin}
                    color="bg-hot-pink/10 text-hot-pink"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="addressLine1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Address Line 1 <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="123, School Road, Area Name" {...field} className="rounded-xl border-2 focus:border-hot-pink h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="addressLine2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                            Address Line 2
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Landmark, Sector, etc." {...field} className="rounded-xl border-2 focus:border-hot-pink h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">City <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Mumbai" {...field} className="rounded-xl border-2 focus:border-hot-pink h-11" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">State <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Maharashtra" {...field} className="rounded-xl border-2 focus:border-hot-pink h-11" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Postal Code <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="400001" {...field} className="rounded-xl border-2 focus:border-hot-pink h-11" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Country <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="India" {...field} className="rounded-xl border-2 focus:border-hot-pink h-11" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </SectionCard>

                {/* ── 5. Branding & Visuals ─────────────────────────────────────────── */}
                <SectionCard
                    title="Branding & Visuals"
                    subtitle="Logo, banner and brand colours for your school page"
                    icon={Palette}
                    color="bg-sunshine-yellow/10 text-sunshine-yellow"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo */}
                        <ImageUploadField
                            label="School Logo"
                            value={logoUrl}
                            uploading={uploading === "logo"}
                            required
                            hint="Recommended: 200×200px PNG/JPG, transparent background"
                            onUpload={(e) => handleImageUpload(e, "logoUrl")}
                        />

                        {/* Banner */}
                        <ImageUploadField
                            label="Banner Image"
                            value={bannerUrl}
                            uploading={uploading === "banner"}
                            hint="Recommended: 1200×400px JPG/PNG for best results"
                            onUpload={(e) => handleImageUpload(e, "bannerUrl")}
                        />

                        {/* Brand Colours */}
                        <div>
                            <FormField
                                control={form.control}
                                name="brandPrimaryColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Primary Brand Color</FormLabel>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex-shrink-0 shadow-sm"
                                                style={{ backgroundColor: field.value || "#8B5CF6" }}
                                            />
                                            <FormControl>
                                                <Input
                                                    type="color"
                                                    {...field}
                                                    className="h-11 w-full rounded-xl border-2 cursor-pointer p-1"
                                                />
                                            </FormControl>
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-400">{field.value}</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div>
                            <FormField
                                control={form.control}
                                name="brandSecondaryColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Secondary Brand Color</FormLabel>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex-shrink-0 shadow-sm"
                                                style={{ backgroundColor: field.value || "#FBBF24" }}
                                            />
                                            <FormControl>
                                                <Input
                                                    type="color"
                                                    {...field}
                                                    className="h-11 w-full rounded-xl border-2 cursor-pointer p-1"
                                                />
                                            </FormControl>
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-400">{field.value}</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Live preview strip */}
                    {(primaryColor || secondaryColor) && (
                        <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Brand Colour Preview</p>
                            <div className="flex gap-3 items-center">
                                <div
                                    className="flex-1 h-10 rounded-xl shadow-sm"
                                    style={{ backgroundColor: primaryColor || "#8B5CF6" }}
                                />
                                <div
                                    className="flex-1 h-10 rounded-xl shadow-sm"
                                    style={{ backgroundColor: secondaryColor || "#FBBF24" }}
                                />
                                <div
                                    className="flex-1 h-10 rounded-xl shadow-sm"
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor || "#8B5CF6"}, ${secondaryColor || "#FBBF24"})`,
                                    }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-2">Primary · Secondary · Gradient blend</p>
                        </div>
                    )}
                </SectionCard>

                {/* ── Save Button ────────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-[28px] shadow-sm border border-gray-100 px-8 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <Shield className="w-4 h-4 text-grass-green" />
                        All changes are saved securely to your school profile.
                    </div>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-sky-blue hover:bg-sky-500 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-sky-200/50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer min-w-40"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Save Changes
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
