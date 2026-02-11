"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Settings2, 
  GraduationCap, 
  Clock, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  Zap,
  Loader2
} from "lucide-react";
import { toggleChildFocusMode } from "@/actions/parent";
import { toast } from "sonner";

interface AdvancedSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  child: {
    id: string;
    name: string;
    focus_mode?: boolean;
  };
}

export function AdvancedSetupModal({ isOpen, onClose, onUpdate, child }: AdvancedSetupModalProps) {
  const [isExamMode, setIsExamMode] = useState(child.focus_mode || false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state with child prop when it changes or modal opens
  useEffect(() => {
    setIsExamMode(child.focus_mode || false);
  }, [child.focus_mode]);

  const handleToggleExamMode = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const result = await toggleChildFocusMode(child.id, checked);
      if (result.success) {
        setIsExamMode(checked);
        if (onUpdate) onUpdate(); // Notify parent to refresh data
        toast.success(checked ? "Exam Mode Enabled! 🎓" : "Exam Mode Disabled! ✨", {
          description: checked 
            ? `${child.name} can now focus better on their studies.` 
            : `${child.name} can now explore all features.`,
          style: {
            background: checked ? '#F0F9FF' : '#FDF2F8',
            border: `2px solid ${checked ? '#0EA5E9' : '#EC4899'}`,
            color: checked ? '#075985' : '#831843',
            fontSize: '16px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 'bold'
          },
          className: "rounded-2xl shadow-xl"
        });
      } else {
        toast.error("Failed to update Exam Mode", {
          description: "Please try again later."
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComingSoon = () => {
    toast.info("Screen Time Limit Coming Soon! 🚧", {
      description: "We're building a magical way to manage screen time.",
      style: {
        background: '#F0F9FF',
        border: '2px solid #0EA5E9',
        color: '#075985',
        fontSize: '16px',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 'bold'
      },
      className: "rounded-2xl shadow-xl"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-4 border-gray-100 rounded-[28px] shadow-2xl gap-0">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-brand-purple to-purple-600 p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center ring-2 ring-white/30 shrink-0">
              <Settings2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-nunito font-black leading-tight">Advanced Setup</DialogTitle>
              <DialogDescription className="text-purple-100 font-bold text-sm leading-tight mt-0.5">
                Customize for <span className="text-white underline decoration-white/30 underline-offset-2">{child.name}</span>
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Options Section */}
        <div className="p-5 bg-white space-y-3">
          
          {/* Option 1: Exam Mode */}
          <div 
            onClick={() => handleToggleExamMode(!isExamMode)}
            className={`p-4 rounded-[22px] border-2 transition-all duration-300 cursor-pointer ${isExamMode ? 'border-sky-blue bg-sky-50 shadow-md shadow-sky-blue/10' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${isExamMode ? 'bg-sky-blue text-white' : 'bg-white text-gray-400'}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-gray-800 leading-none mb-1">Exam Mode</h4>
                  <p className="text-[10px] font-bold text-gray-500">Limits distractions</p>
                </div>
              </div>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                {isUpdating && (
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3 h-3 animate-spin text-sky-blue" />
                  </div>
                )}
                <Switch 
                  checked={isExamMode} 
                  onCheckedChange={handleToggleExamMode}
                  disabled={isUpdating}
                  className="data-[state=checked]:bg-sky-blue cursor-pointer"
                />
              </div>
            </div>
            {isExamMode && (
              <div className="mt-3 flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-sky-100 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-blue shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-sky-700 leading-normal">
                  Focus Mode active! Only educational content is visible.
                </p>
              </div>
            )}
          </div>

          {/* Option 2: Screen Time Limit */}
          <button 
            onClick={handleComingSoon}
            className="w-full text-left p-4 rounded-[22px] border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white text-gray-400 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-gray-800 leading-none mb-1">Screen Time</h4>
                  <p className="text-[10px] font-bold text-gray-500">Better habits (Soon!)</p>
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-gray-100 group-hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>

          {/* Tips Section */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-100/50 flex items-start gap-3">
            <div className="bg-amber-100 p-1.5 rounded-lg shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-[10px] font-bold text-amber-800 leading-normal">
              <span className="text-amber-900 block mb-0.5">Parent Tip!</span>
              Set "Screen Time" rewards for completing "Exam Mode" study goals.
            </p>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-2.5">
          <button 
            onClick={onClose}
            className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-black py-3 rounded-xl border-2 border-gray-200 transition-all active:scale-95 text-sm cursor-pointer"
          >
            Close
          </button>
          <button 
            onClick={() => {
              if (onUpdate) onUpdate();
              onClose();
            }}
            className="flex-[1.5] bg-brand-purple hover:bg-brand-purple/90 text-white font-black py-3 rounded-xl shadow-lg shadow-brand-purple/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" /> Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
