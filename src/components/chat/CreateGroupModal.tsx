"use client";

import { useState, useEffect } from "react";
import {
  X,
  Users,
  Search,
  Loader2,
  Check,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useChatContext } from "stream-chat-react";
import { getFollowingForGroup, validateGroupCreation } from "@/actions/groups";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

interface FollowingChild {
  child_id: string;
  name: string;
  username: string;
  avatar: string | null;
  age: number | null;
  country: string | null;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  currentUserId,
}: CreateGroupModalProps) {
  const { client } = useChatContext();

  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [following, setFollowing] = useState<FollowingChild[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load following list
  useEffect(() => {
    if (isOpen) {
      loadFollowing();
    }
  }, [isOpen]);

  const loadFollowing = async () => {
    setIsLoading(true);
    try {
      const result = await getFollowingForGroup();
      if (result.success && result.following) {
        setFollowing(result.following);
      } else {
        toast.error(result.error || "Failed to load friends");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Uploading group image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setGroupImage(data.url);
      toast.success("Group image uploaded! 📸", { id: toastId });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image", { id: toastId });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleMember = (childId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId],
    );
  };

  const handleCreateGroup = async () => {
    if (isCreating) return;

    // Validate
    const validation = await validateGroupCreation(groupName, selectedMembers);
    if (!validation.valid) {
      toast.error(validation.error || "Validation failed");
      return;
    }

    setIsCreating(true);
    try {
      // Create Stream channel
      const channelId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const channel = client.channel("team", channelId, {
        name: groupName.trim(),
        image: groupImage || undefined,
        members: [currentUserId, ...selectedMembers],
        created_by: { id: currentUserId },
      } as any); // Type assertion for custom fields

      await channel.create();
      await channel.watch();

      toast.success(`Group "${groupName}" created! 🎉`, {
        description: `${selectedMembers.length + 1} members added`,
      });

      // Reset and close
      setGroupName("");
      setGroupImage(null);
      setSelectedMembers([]);
      setSearchQuery("");
      onClose();
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Filter following based on search
  const filteredFollowing = following.filter(
    (child) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-[10000]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand-purple" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black font-nunito text-gray-900">
                  Create Group
                </h2>
                <p className="text-xs font-bold text-gray-500">
                  Chat with multiple friends at once
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isCreating}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 sm:space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                Group Name <span className="text-hot-pink">*</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Study Buddies 📚"
                maxLength={50}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-brand-purple focus:ring-0 text-sm font-bold text-gray-900 placeholder:text-gray-400"
              />
              <p className="mt-1.5 text-xs font-bold text-gray-400">
                {groupName.length}/50 characters
              </p>
            </div>

            {/* Group Image */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                Group Image (Optional)
              </label>
              <div className="flex items-center gap-4">
                {groupImage ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-purple/20">
                    <img
                      src={groupImage}
                      alt="Group"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setGroupImage(null)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-purple flex items-center justify-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                    {isUploadingImage ? (
                      <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </label>
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-600">
                    Upload a fun group image
                  </p>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    Max 5MB • JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* Member Selection */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                Add Members <span className="text-hot-pink">*</span>
              </label>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-purple focus:ring-0 text-sm font-bold text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Selected count */}
              {selectedMembers.length > 0 && (
                <div className="mb-3 px-3 py-2 bg-brand-purple/10 rounded-xl">
                  <p className="text-xs font-black text-brand-purple">
                    {selectedMembers.length} member
                    {selectedMembers.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              )}

              {/* Member list */}
              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto beautiful-scrollbar">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
                  </div>
                ) : filteredFollowing.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm font-bold text-gray-500">
                      {searchQuery
                        ? "No friends found"
                        : "You're not following anyone yet"}
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-1">
                      {searchQuery
                        ? "Try a different search"
                        : "Follow friends to add them to groups"}
                    </p>
                  </div>
                ) : (
                  filteredFollowing.map((child) => {
                    const isSelected = selectedMembers.includes(child.child_id);
                    return (
                      <button
                        key={child.child_id}
                        onClick={() => toggleMember(child.child_id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "border-brand-purple bg-brand-purple/5"
                            : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {child.avatar ? (
                              <img
                                src={child.avatar}
                                alt={child.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-black text-gray-600">
                                {child.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-purple flex items-center justify-center border-2 border-white">
                              <Check className="w-3 h-3 text-white stroke-3" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-black text-gray-900">
                            {child.name}
                          </p>
                          <p className="text-xs font-bold text-gray-500">
                            @{child.username}
                            {child.country && ` • ${child.country}`}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-sm text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={
                isCreating || !groupName.trim() || selectedMembers.length === 0
              }
              className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black text-sm bg-brand-purple text-white hover:bg-brand-purple/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
