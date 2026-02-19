"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Upload,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getMyChildren } from "@/actions/parent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Child {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  age: number;
  bio?: string | null;
}

interface ChildPasswordCardProps {
  child: Child;
  onEditProfile: () => void;
}

function ChildPasswordCard({ child, onEditProfile }: ChildPasswordCardProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const toastId = toast.loading("Updating password...");
    setLoading(true);

    try {
      const res = await fetch("/api/children/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: child.id,
          newPassword: password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast.success(`Password updated for ${child.name}`, { id: toastId });
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={
            child.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.username}`
          }
          alt={child.name}
          className="w-14 h-14 rounded-full border-4 border-gray-50 bg-gray-50 object-cover"
        />
        <div>
          <h3 className="text-lg font-black font-nunito text-gray-900">
            {child.name}
          </h3>
          <p className="text-xs font-bold text-gray-400">
            @{child.username} • {child.age} yrs
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none"
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none"
            placeholder="Re-enter password"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-purple text-white font-black text-sm shadow-lg shadow-brand-purple/20 hover:bg-brand-purple/90 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 font-black text-sm border-2 border-gray-200 hover:border-brand-purple hover:bg-brand-purple/5 hover:text-brand-purple hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span>Update Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChildProfileModalProps {
  child: Child | null;
  onClose: () => void;
  onChildUpdated: (updated: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    bio?: string | null;
  }) => void;
}

function ChildProfileModal({
  child,
  onClose,
  onChildUpdated,
}: ChildProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");

  useEffect(() => {
    if (!child) return;
    setFullName(child.name || "");
    setUsername(child.username || "");
    setOriginalUsername(child.username || "");
    setBio(child.bio || "");
    setAvatar(child.avatar || null);
    setUsernameAvailable(null);
    setCheckingUsername(false);
  }, [child]);

  if (!child) return null;

  const handleCheckUsername = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    if (value === originalUsername) {
      setUsernameAvailable(true);
      return;
    }

    setCheckingUsername(true);
    try {
      const res = await fetch("/api/children/check-username", {
        method: "POST",
        body: JSON.stringify({ username: value }),
      });
      const data = await res.json();
      setUsernameAvailable(Boolean(data.available));
      if (!data.available) {
        toast.error("Username is already taken");
      }
    } catch (error) {
      setUsernameAvailable(null);
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
      setAvatar(data.url);
      toast.success("Avatar uploaded successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to upload avatar", { id: toastId });
    }
  };

  const handleSave = async () => {
    const nameTrimmed = fullName.trim();
    const usernameTrimmed = username.trim();

    if (!nameTrimmed) {
      toast.error("Full name is required");
      return;
    }

    if (usernameTrimmed.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Username is already taken");
      return;
    }

    if (usernameTrimmed !== originalUsername && usernameAvailable !== true) {
      await handleCheckUsername(usernameTrimmed);
      if (usernameAvailable === false) return;
    }

    const toastId = toast.loading("Updating profile...");
    setSaving(true);

    try {
      const res = await fetch("/api/children/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: child.id,
          name: nameTrimmed,
          username: usernameTrimmed,
          bio: bio || null,
          avatar,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully", { id: toastId });
      onChildUpdated({
        id: child.id,
        name: nameTrimmed,
        username: usernameTrimmed,
        avatar: avatar || null,
        bio: bio || null,
      });
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!child} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-4 border-gray-100 rounded-[28px] shadow-2xl gap-0">
        <div className="bg-gradient-to-br from-brand-purple to-purple-600 p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/30 overflow-hidden">
              {avatar || child.avatar ? (
                <img
                  src={avatar || child.avatar || ""}
                  alt={child.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-2xl font-nunito font-black text-white">
                  Update {child.name}
                </DialogTitle>
                <DialogDescription className="text-purple-100 font-bold text-xs">
                  Edit name, username, avatar and bio for this kid.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none"
              placeholder="Enter child full name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
                  setUsername(val);
                  handleCheckUsername(val);
                }}
                className={`w-full px-4 py-3 rounded-2xl border-2 outline-none font-nunito font-bold transition-all ${
                  usernameAvailable === true
                    ? "border-green-500"
                    : usernameAvailable === false
                    ? "border-red-500"
                    : "border-gray-100 focus:border-brand-purple"
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
              <p className="text-xs font-bold text-red-500 mt-1">
                Username is taken
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 transition-all font-nunito font-bold outline-none resize-none h-24"
              placeholder="Tell us a little about your child..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {avatar || child.avatar ? (
                  <img
                    src={avatar || child.avatar || ""}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer bg-white border-2 border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2 font-bold">
                  Max 2MB. JPG or PNG only.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-black text-sm hover:bg-gray-50 transition-all cursor-pointer"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-purple text-white font-black text-sm shadow-lg shadow-brand-purple/20 hover:bg-brand-purple/90 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await getMyChildren();
        setChildren((data || []) as Child[]);
      } catch (error) {
        console.error("Error loading children for settings:", error);
        toast.error("Failed to load children");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading your children...</p>
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
          <Settings className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-black font-nunito text-gray-900 mb-2">
          No children found
        </h1>
        <p className="text-gray-500 font-bold max-w-md">
          Add a child profile first, then you can manage their passwords here.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black font-nunito text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-purple" />
            Parent Settings
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            Change your kids&apos; login passwords safely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <ChildPasswordCard
            key={child.id}
            child={child}
            onEditProfile={() => setEditingChild(child)}
          />
        ))}
      </div>

      {editingChild && (
        <ChildProfileModal
          child={editingChild}
          onClose={() => setEditingChild(null)}
          onChildUpdated={(updated) => {
            setChildren((prev) =>
              prev.map((c) =>
                c.id === updated.id ? { ...c, ...updated } : c
              )
            );
          }}
        />
      )}
    </div>
  );
}
