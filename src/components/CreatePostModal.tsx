"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, Video, X, Send, Check } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createPost } from "@/actions/post";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex code
  display_order: number;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
}

// Helper to render dynamic Lucide icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  // 1. Try exact match
  let IconComponent = (LucideIcons as any)[name];

  // 2. Try PascalCase if not found (e.g. "image" -> "Image", "bar-chart" -> "BarChart")
  if (!IconComponent && name) {
    const pascalName = name
      .split(/[-_ ]/) // Split by hyphen, underscore, or space
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
    
    IconComponent = (LucideIcons as any)[pascalName];
  }

  if (!IconComponent) return <LucideIcons.Sparkles className={className} />;
  return <IconComponent className={className} />;
};

export function CreatePostModal({ isOpen, onClose, childId }: CreatePostModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Content, 2: Category
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "NONE">("NONE");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    } else {
        // Reset state on close
        setStep(1);
        setTitle("");
        setContent("");
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType("NONE");
        setSelectedCategory(null);
        setUploadProgress(0);
        setIsUploading(false);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (data) setCategories(data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(`File too large! Max ${isVideo ? "50MB" : "10MB"} allowed.`);
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? "VIDEO" : "IMAGE");

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("NONE");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const containsLink = (text: string) => {
    const pattern =
      /(https?:\/\/\S+|www\.\S+|\S+\.(com|net|org|io|in|edu|co|me|ai)(\/\S*)?)/i;
    return pattern.test(text);
  };

  const uploadFileWithProgress = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } catch (e) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          reject(new Error("Upload failed"));
        }
      };
      
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (containsLink(title) || containsLink(content)) {
      toast.error("Links are not allowed in Magic text", {
        description: "Keep Qidzo safe and real by sharing stories, not links.",
      });
      return;
    }

    if (!content.trim()) {
      toast.error("Please add some content to your post!");
      return;
    }
    if (!selectedCategory) {
      toast.error("Please select a category!");
      return;
    }

    setIsLoading(true);

    try {
      let mediaUrl = null;
      let mediaThumbnail = null; 

      // 1. Upload Media if exists
      if (mediaFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        mediaUrl = await uploadFileWithProgress(mediaFile);
        
        setIsUploading(false);
      }

      // 2. Create Post
      const result = await createPost({
        childId,
        categoryId: selectedCategory,
        title,
        content,
        mediaType,
        mediaUrl,
        mediaThumbnail
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Magic Created! 🌟");
      onClose();
      
    } catch (error: any) {
      console.error("Post creation error:", error);
      toast.error("Failed to Post Magic! 😢", {
        description: error.message || "Something went wrong. Please try again!"
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] flex flex-col bg-white border-4 border-brand-purple rounded-[32px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 bg-brand-purple text-white relative overflow-hidden shrink-0">
            {/* Decorative background circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="absolute top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            
          <DialogTitle className="text-3xl font-black font-nunito flex items-center gap-3 relative z-10">
            {step === 1 ? (
                <>
                <span className="text-4xl">✨</span> Create Magic
                </>
            ) : (
                <>
                <span className="text-4xl">🎨</span> Pick a Theme
                </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 sm:p-8 bg-[#FDF4FF] flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                  <Input
                    placeholder="Give your magic a title... (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-bold border-2 border-brand-purple/20 focus-visible:ring-brand-purple rounded-2xl py-7 px-5 bg-white shadow-sm placeholder:text-gray-300"
                  />
                  
                  <Textarea
                    placeholder="What's on your mind? Share something fun! 🌟"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] text-lg resize-none border-2 border-brand-purple/20 focus-visible:ring-brand-purple rounded-2xl p-5 bg-white shadow-sm placeholder:text-gray-300"
                  />
              </div>

              {mediaPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-4 border-white bg-gray-50 shadow-md h-48 sm:h-64 w-full flex items-center justify-center group bg-black/5">
                    {/* Overlay for remove button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    
                  <button 
                    onClick={removeMedia}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:scale-110 z-10 cursor-pointer pointer-events-auto"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {mediaType === "IMAGE" ? (
                    <img src={mediaPreview} alt="Preview" className="h-full w-full object-contain" />
                  ) : (
                    <video src={mediaPreview} controls className="h-full w-full object-contain" />
                  )}
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-16 border-2 border-dashed border-brand-purple/30 hover:border-brand-purple hover:bg-brand-purple/5 text-brand-purple rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="font-bold text-sm">Add Photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-16 border-2 border-dashed border-hot-pink/30 hover:border-hot-pink hover:bg-hot-pink/5 text-hot-pink rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Video className="w-6 h-6" />
                    <span className="font-bold text-sm">Add Video</span>
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*" 
                    onChange={handleFileSelect}
                  />
                </div>
              )}

              <Button 
                onClick={() => {
                  if (containsLink(title) || containsLink(content)) {
                    toast.error("Links are not allowed in Magic text", {
                      description:
                        "Keep Qidzo safe and real by sharing stories, not links.",
                    });
                    return;
                  }
                  setStep(2);
                }}
                disabled={!content.trim()}
                className="w-full h-16 text-xl font-black bg-brand-purple hover:bg-brand-purple/90 rounded-2xl shadow-xl shadow-brand-purple/20 mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Next Step <Send className="w-6 h-6 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
                {/* Upload Progress Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 rounded-[32px]">
                        <div className="w-full max-w-xs space-y-4 text-center">
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        fill="none"
                                        stroke="#f3f4f6"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        fill="none"
                                        stroke="#8B5CF6"
                                        strokeWidth="8"
                                        strokeDasharray={2 * Math.PI * 60}
                                        strokeDashoffset={2 * Math.PI * 60 * (1 - uploadProgress / 100)}
                                        className="transition-all duration-300 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-2xl font-black text-brand-purple">{uploadProgress}%</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-gray-800 animate-pulse">Uploading Magic... ✨</h3>
                            <p className="text-gray-500 font-bold text-sm">Hold on tight!</p>
                        </div>
                    </div>
                )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.category_id)}
                    style={{
                        borderColor: selectedCategory === cat.category_id ? cat.color : 'transparent',
                        backgroundColor: selectedCategory === cat.category_id ? `${cat.color}15` : 'white',
                    }}
                    className={cn(
                        "relative p-4 rounded-3xl border-4 transition-all duration-200 flex flex-col items-center gap-3 text-center shadow-sm hover:shadow-md cursor-pointer group hover:-translate-y-1",
                        selectedCategory !== cat.category_id && "border-transparent hover:bg-white"
                    )}
                  >
                    {/* Icon Container */}
                    <div 
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                    >
                        {/* Try to match lucide icon, else fallback to text (emoji) if simple string */}
                        <DynamicIcon name={cat.icon} className="w-8 h-8" />
                    </div>

                    <span className="font-black text-gray-700 text-sm leading-tight px-1">
                        {cat.name}
                    </span>

                    {selectedCategory === cat.category_id && (
                      <div 
                        style={{ backgroundColor: cat.color }}
                        className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in"
                      >
                        <Check className="w-5 h-5 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  className="flex-1 h-16 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl cursor-pointer"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedCategory || isLoading}
                  className="flex-[2] h-16 text-xl font-black bg-gradient-to-r from-brand-purple to-hot-pink hover:opacity-90 rounded-2xl shadow-xl shadow-brand-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {isUploading ? "Uploading..." : "Posting..."}
                    </div>
                  ) : (
                    "Post Magic! 🚀"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
