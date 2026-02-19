 "use client";

import { useEffect, useState } from "react";
import { Settings, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMyChildren } from "@/actions/parent";

interface Child {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  age: number;
}

function ChildPasswordCard({ child }: { child: Child }) {
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

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-purple text-white font-black text-sm shadow-lg shadow-brand-purple/20 hover:bg-brand-purple/90 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
          <span>Change Password</span>
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

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
          <ChildPasswordCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  );
}
