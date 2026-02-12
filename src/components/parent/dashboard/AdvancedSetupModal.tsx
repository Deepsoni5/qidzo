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
  Loader2,
  ChevronLeft,
  CheckCircle2,
  Plus
} from "lucide-react";
import { toggleChildFocusMode, updateChildScreenTime } from "@/actions/parent";
import { toast } from "sonner";

interface AdvancedSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  child: {
    id: string;
    name: string;
    focus_mode?: boolean;
    screen_time_limit?: number | null;
    allowed_time_slots?: string[] | string;
  };
}

export function AdvancedSetupModal({ isOpen, onClose, onUpdate, child }: AdvancedSetupModalProps) {
  const [isExamMode, setIsExamMode] = useState(child.focus_mode || false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [view, setView] = useState<'main' | 'screen-time'>('main');
  
  // Screen Time States
  const [screenLimit, setScreenLimit] = useState<number | null>(child.screen_time_limit || null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(() => {
    if (Array.isArray(child.allowed_time_slots)) return child.allowed_time_slots;
    if (typeof child.allowed_time_slots === 'string') {
      try {
        return JSON.parse(child.allowed_time_slots);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isCustomSlot, setIsCustomSlot] = useState(false);
  const [customStart, setCustomStart] = useState("12:00");
  const [customEnd, setCustomEnd] = useState("13:00");
  const [slotMode, setSlotMode] = useState<'anytime' | 'specific'>(
    selectedSlots.length > 0 ? 'specific' : 'anytime'
  );

  // Update customEnd whenever screenLimit or customStart changes
  useEffect(() => {
    if (screenLimit) {
      const [hours, minutes] = customStart.split(':').map(Number);
      const endHours = (hours + screenLimit) % 24;
      setCustomEnd(`${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }, [screenLimit, customStart]);

  // Sync state with child prop when it changes or modal opens
  useEffect(() => {
    setIsExamMode(child.focus_mode || false);
    setScreenLimit(child.screen_time_limit || null);
    if (Array.isArray(child.allowed_time_slots)) {
      setSelectedSlots(child.allowed_time_slots);
      setSlotMode(child.allowed_time_slots.length > 0 ? 'specific' : 'anytime');
    } else if (typeof child.allowed_time_slots === 'string') {
      try {
        const slots = JSON.parse(child.allowed_time_slots);
        setSelectedSlots(slots);
        setSlotMode(slots.length > 0 ? 'specific' : 'anytime');
      } catch {
        setSelectedSlots([]);
        setSlotMode('anytime');
      }
    } else {
      setSlotMode('anytime');
    }
  }, [child, isOpen]);

  const generateSlots = (hours: number) => {
    const slots = [];
    for (let i = 0; i < 24; i += hours) {
      const start = i;
      const end = (i + hours) % 24;
      const displayEnd = end === 0 ? 24 : end;
      slots.push(`${start}:00-${displayEnd}:00`);
    }
    return slots;
  };

  const toggleSlot = (slot: string) => {
    // If selecting a new slot, clear previous ones and set only the new one
    // If clicking an already selected slot, clear it (deselect)
    setSelectedSlots(prev => prev.includes(slot) ? [] : [slot]);
  };

  const handleSaveScreenTime = async () => {
    setIsUpdating(true);
    try {
      // If anytime is selected, we clear the slots
      const slotsToSave = slotMode === 'anytime' ? [] : selectedSlots;
      const result = await updateChildScreenTime(child.id, screenLimit, slotsToSave);
      if (result.success) {
        toast.success("Screen Time Updated! ⏰", {
          description: `Settings for ${child.name} have been saved.`,
          style: {
            background: '#F0F9FF',
            border: '2px solid #0EA5E9',
            color: '#075985',
            fontSize: '16px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 'bold'
          }
        });
        setView('main');
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to update screen time");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleAddCustomSlot = () => {
    const startParts = customStart.split(':').map(Number);
    const endParts = customEnd.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    let endMinutes = endParts[0] * 60 + endParts[1];

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Handle overnight slots
    }

    const durationHours = (endMinutes - startMinutes) / 60;

    if (screenLimit && durationHours > screenLimit) {
      toast.error("Slot Too Long! ⚠️", {
        description: `Custom slot (${durationHours}h) cannot exceed your daily limit of ${screenLimit}h.`,
        style: {
          background: '#FFF7ED',
          border: '2px solid #F97316',
          color: '#9A3412',
          fontSize: '14px',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 'bold'
        }
      });
      return;
    }

    const newSlot = `${customStart}-${customEnd}`;
    if (!selectedSlots.includes(newSlot)) toggleSlot(newSlot);
    setIsCustomSlot(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-4 border-gray-100 rounded-[28px] shadow-2xl gap-0">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-brand-purple to-purple-600 p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            {view === 'main' ? (
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center ring-2 ring-white/30 shrink-0">
                <Settings2 className="w-6 h-6 text-white" />
              </div>
            ) : (
              <button 
                onClick={() => setView('main')}
                className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center ring-2 ring-white/30 shrink-0 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
            <div>
              <DialogTitle className="text-2xl font-nunito font-black leading-tight">
                {view === 'main' ? 'Advanced Setup' : 'Screen Time'}
              </DialogTitle>
              <DialogDescription className="text-purple-100 font-bold text-sm leading-tight mt-0.5">
                {view === 'main' 
                  ? <>Customize for <span className="text-white underline decoration-white/30 underline-offset-2">{child.name}</span></>
                  : <>Set boundaries for <span className="text-white underline decoration-white/30 underline-offset-2">{child.name}</span></>
                }
              </DialogDescription>
            </div>
          </div>
        </div>

        {view === 'main' ? (
          /* Main View */
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
              onClick={() => setView('screen-time')}
              className="w-full text-left p-4 rounded-[22px] border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white text-sky-blue rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-gray-800 leading-none mb-1">Screen Time</h4>
                    <p className="text-[10px] font-bold text-gray-500">
                      {screenLimit ? `${screenLimit}h daily limit set` : 'Better digital habits'}
                    </p>
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
        ) : (
          /* Screen Time View */
          <div className="p-5 bg-white space-y-5 overflow-y-auto max-h-[450px]">
            {/* Step 1: Hours Selection */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">1. Daily Hour Limit</h4>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((h) => (
                  <button
                    key={h}
                    onClick={() => setScreenLimit(h)}
                    className={`py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 border-2 cursor-pointer ${screenLimit === h ? 'bg-sky-blue border-sky-blue text-white shadow-md shadow-sky-blue/20' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'}`}
                  >
                    {h}h
                  </button>
                ))}
                <button
                  onClick={() => setScreenLimit(null)}
                  className={`col-span-4 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 border-2 cursor-pointer ${screenLimit === null ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'}`}
                >
                  No Limit
                </button>
              </div>
            </div>

            {/* Step 2: Slot Selection */}
            {screenLimit && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">2. When can they use it?</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSlotMode('anytime')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${slotMode === 'anytime' ? 'border-brand-purple bg-purple-50 shadow-md shadow-purple-100' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}
                    >
                      <Sparkles className={`w-5 h-5 ${slotMode === 'anytime' ? 'text-brand-purple' : 'text-gray-400'}`} />
                      <span className={`text-[11px] font-black ${slotMode === 'anytime' ? 'text-brand-purple' : 'text-gray-500'}`}>Anytime</span>
                      <p className="text-[8px] font-bold text-gray-400 text-center leading-tight">Flexible usage throughout the day</p>
                    </button>
                    
                    <button
                      onClick={() => setSlotMode('specific')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${slotMode === 'specific' ? 'border-sky-blue bg-sky-50 shadow-md shadow-sky-blue/10' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}
                    >
                      <Clock className={`w-5 h-5 ${slotMode === 'specific' ? 'text-sky-blue' : 'text-gray-400'}`} />
                      <span className={`text-[11px] font-black ${slotMode === 'specific' ? 'text-sky-blue' : 'text-gray-500'}`}>Specific Slots</span>
                      <p className="text-[8px] font-bold text-gray-400 text-center leading-tight">Limit usage to certain hours</p>
                    </button>
                  </div>
                </div>

                {slotMode === 'specific' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Choose Time Windows</h4>
                      <button 
                        onClick={() => setIsCustomSlot(!isCustomSlot)}
                        className="text-[10px] font-black text-brand-purple flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Custom Slot
                      </button>
                    </div>
                    
                    {isCustomSlot && (
                      <div className="bg-purple-50 p-3 rounded-2xl border-2 border-purple-100 flex items-center gap-3 animate-in zoom-in-95">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-black text-purple-600 block">From</label>
                          <input 
                            type="time" 
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="w-full bg-white border-none text-xs font-bold p-1.5 rounded-lg outline-none ring-2 ring-purple-100"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-black text-purple-600 block">To</label>
                          <input 
                            type="time" 
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="w-full bg-white border-none text-xs font-bold p-1.5 rounded-lg outline-none ring-2 ring-purple-100"
                          />
                        </div>
                        <button 
                          onClick={handleAddCustomSlot}
                          className="bg-brand-purple text-white p-2 rounded-xl self-end active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {generateSlots(screenLimit).map((slot) => (
                        <button
                          key={slot}
                          onClick={() => toggleSlot(slot)}
                          className={`p-3 rounded-xl font-bold text-[11px] transition-all border-2 flex items-center justify-between group cursor-pointer ${selectedSlots.includes(slot) ? 'bg-sky-blue border-sky-blue text-white shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-sky-200'}`}
                        >
                          {slot}
                          {selectedSlots.includes(slot) && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-sky-blue" />}
                        </button>
                      ))}
                      {/* Selected Custom Slots */}
                      {selectedSlots.filter(s => !generateSlots(screenLimit).includes(s)).map(slot => (
                        <button
                          key={slot}
                          onClick={() => toggleSlot(slot)}
                          className="p-3 rounded-xl font-bold text-[11px] transition-all border-2 flex items-center justify-between bg-sky-blue border-sky-blue text-white shadow-md cursor-pointer"
                        >
                          {slot} (Custom)
                          <CheckCircle2 className="w-3.5 h-3.5 fill-white text-sky-blue" />
                        </button>
                      ))}
                    </div>

                    {selectedSlots.length === 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                        <p className="text-[10px] font-bold text-amber-700">
                          Please select at least one time slot or choose "Anytime" above.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Section */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-2.5">
          <button 
            onClick={onClose}
            className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-black py-3 rounded-xl border-2 border-gray-200 transition-all active:scale-95 text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={view === 'main' ? onClose : handleSaveScreenTime}
            disabled={isUpdating || (view === 'screen-time' && slotMode === 'specific' && selectedSlots.length === 0)}
            className="flex-[1.5] bg-brand-purple hover:bg-brand-purple/90 text-white font-black py-3 rounded-xl shadow-lg shadow-brand-purple/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-current" />
            )}
            {view === 'main' ? 'Save Changes' : 'Update Settings'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

