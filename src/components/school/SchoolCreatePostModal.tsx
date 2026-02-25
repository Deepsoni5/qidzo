"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Loader2,
  Send,
  Check,
  Sparkles,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import { createSchoolPost, getSchoolCategories } from "@/actions/school-post";

interface Category {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  display_order: number;
}

interface SchoolCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DynamicIcon = ({
  name,
  className,
  color,
}: {
  name: string;
  className?: string;
  color?: string;
}) => {
  let IconComponent = (LucideIcons as any)[name];

  if (!IconComponent && name) {
    const pascalName = name
      .split(/[-_ ]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
    IconComponent = (LucideIcons as any)[pascalName];
  }

  if (!IconComponent)
    return (
      <Sparkles className={className} style={color ? { color } : undefined} />
    );
  return (
    <IconComponent
      className={className}
      style={color ? { color } : undefined}
    />
  );
};

const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
  DOCUMENT: 25 * 1024 * 1024,
};

export default function SchoolCreatePostModal({
  isOpen,
  onClose,
  onSuccess,
}: SchoolCreatePostModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<
    "IMAGE" | "VIDEO" | "DOCUMENT" | "NONE"
  >("NONE");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      document.body.style.overflow = "hidden";
    } else {
      resetForm();
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchCategories = async () => {
    const data = await getSchoolCategories();
    setCategories(data);
  };

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setContent("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("NONE");
    setSelectedCategory(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "IMAGE" | "VIDEO" | "DOCUMENT",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = FILE_SIZE_LIMITS[type];
    if (file.size > maxSize) {
      toast.error(`File too large! Max size: ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setMediaFile(file);
    setMediaType(type);

    if (type === "IMAGE" || type === "VIDEO") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("NONE");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadToCloudinary = async (
    file: File,
  ): Promise<{ url: string; thumbnail?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "qidzo_posts",
    );
    formData.append("folder", `qidzo/schools/posts/${Date.now()}`);

    const resourceType =
      mediaType === "VIDEO"
        ? "video"
        : mediaType === "DOCUMENT"
          ? "raw"
          : "image";
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            thumbnail: response.eager?.[0]?.secure_url || response.secure_url,
          });
        } else {
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.open("POST", cloudinaryUrl);
      xhr.send(formData);
    });
  };

  const handleNext = () => {
    if (!content.trim()) {
      toast.error("Please write something!");
      return;
    }
    if (content.length > 2000) {
      toast.error("Content too long! Max 2000 characters.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    setIsLoading(true);
    setIsUploading(true);

    try {
      let mediaUrl: string | null = null;
      let mediaThumbnail: string | null = null;

      if (mediaFile && mediaType !== "NONE") {
        const uploaded = await uploadToCloudinary(mediaFile);
        mediaUrl = uploaded.url;
        mediaThumbnail = uploaded.thumbnail || null;
      }

      setIsUploading(false);

      const result = await createSchoolPost({
        categoryId: selectedCategory,
        title: title.trim() || undefined,
        content: content.trim(),
        mediaType,
        mediaUrl,
        mediaThumbnail,
        fileName: mediaFile?.name,
        fileSize: mediaFile?.size,
      });

      if (result.success) {
        toast.success("Post created successfully! 🎉");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Post creation error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 sm:px-8 py-6 border-b border-gray-100 bg-white rounded-t-[32px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900">
                {step === 1 ? "Create Post" : "Choose Category"}
              </h2>
              <p className="text-sm font-bold text-gray-500 mt-1">
                {step === 1
                  ? "Share updates with your community 📢"
                  : "Select the best category for your post"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-sky-blue" : "bg-gray-200"}`}
            />
            <div
              className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-sky-blue" : "bg-gray-200"}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-6">
          {step === 1 ? (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a catchy title..."
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                  Content <span className="text-hot-pink">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What would you like to share with parents and students?"
                  rows={6}
                  maxLength={2000}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 resize-none"
                />
                <p className="mt-2 text-xs font-bold text-gray-400">
                  {content.length}/2000 characters
                </p>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3">
                  Add Media (Optional)
                </label>

                {!mediaFile ? (
                  <div className="grid grid-cols-3 gap-3">
                    {/* Image */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-sky-blue hover:bg-sky-blue/5 transition-all group"
                    >
                      <div className="p-3 rounded-xl bg-sky-blue/10 text-sky-blue group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black text-gray-600">
                        Image
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, "IMAGE")}
                        className="hidden"
                      />
                    </button>

                    {/* Video */}
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/*";
                        input.onchange = (e: any) =>
                          handleFileSelect(e, "VIDEO");
                        input.click();
                      }}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-purple hover:bg-brand-purple/5 transition-all group"
                    >
                      <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purple group-hover:scale-110 transition-transform">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black text-gray-600">
                        Video
                      </span>
                    </button>

                    {/* Document */}
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
                        input.onchange = (e: any) =>
                          handleFileSelect(e, "DOCUMENT");
                        input.click();
                      }}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-grass-green hover:bg-grass-green/5 transition-all group"
                    >
                      <div className="p-3 rounded-xl bg-grass-green/10 text-grass-green group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black text-gray-600">
                        Document
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border-2 border-gray-200 p-4">
                    <button
                      onClick={removeMedia}
                      className="absolute -top-2 -right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {mediaType === "IMAGE" && mediaPreview && (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    )}

                    {mediaType === "VIDEO" && mediaPreview && (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full h-48 rounded-xl"
                      />
                    )}

                    {mediaType === "DOCUMENT" && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="p-3 rounded-xl bg-grass-green/10">
                          <FileText className="w-8 h-8 text-grass-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">
                            {mediaFile.name}
                          </p>
                          <p className="text-xs font-bold text-gray-500">
                            {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={!content.trim()}
                className="w-full px-6 py-4 rounded-2xl bg-sky-blue text-white font-black text-base shadow-lg shadow-sky-blue/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next: Choose Category
                <Send className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Categories Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.category_id)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                      selectedCategory === category.category_id
                        ? "border-sky-blue bg-sky-blue/5 scale-[1.02]"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className="shrink-0 p-3 rounded-xl"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <DynamicIcon
                        name={category.icon}
                        className="w-6 h-6"
                        color={category.color}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-black text-gray-900">
                          {category.name}
                        </h3>
                        {selectedCategory === category.category_id && (
                          <Check className="w-5 h-5 text-sky-blue shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-500 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-black text-base hover:bg-gray-50 transition-all active:scale-95"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedCategory || isLoading}
                  className="flex-1 px-6 py-4 rounded-2xl bg-grass-green text-white font-black text-base shadow-lg shadow-grass-green/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isUploading
                        ? `Uploading... ${uploadProgress}%`
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Post
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
