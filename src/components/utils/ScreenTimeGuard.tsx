"use client";

import { useEffect, useState, useCallback } from "react";
import { checkScreenTimeStatus } from "@/actions/screen-time";
import { XCircle, Lock, Moon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScreenTimeGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<{
    isAllowed: boolean;
    reason?: string;
    message?: string;
    remainingMinutes?: number;
  }>({ isAllowed: true });
  
  const [isChecking, setIsChecking] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const result = await checkScreenTimeStatus();
      setStatus(result);
    } catch (error) {
      console.error("Failed to check screen time status:", error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkStatus();

    // Check every minute to enforce real-time lockout
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  if (isChecking) {
    return null; // Or a subtle loading spinner
  }

  if (!status.isAllowed) {
    const isSlotError = status.reason === 'outside_slot';
    
    return (
      <div className="fixed inset-0 z-[9999] bg-brand-purple/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl border-8 border-white overflow-hidden transform animate-in zoom-in duration-300">
          {/* Playful Header */}
          <div className={`${isSlotError ? 'bg-sky-blue' : 'bg-sunshine-yellow'} h-32 flex items-center justify-center relative overflow-hidden transition-colors duration-500`}>
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_20%_30%,_white_0%,_transparent_20%)]"></div>
            <div className="bg-white/30 p-4 rounded-full backdrop-blur-sm">
              {isSlotError ? (
                <Moon className="w-12 h-12 text-white fill-white animate-pulse" />
              ) : (
                <Lock className="w-12 h-12 text-white animate-bounce" />
              )}
            </div>
          </div>

          <div className="p-8 text-center">
            <h2 className="text-3xl font-black text-brand-purple mb-4 font-nunito leading-tight">
              {isSlotError ? "Parental Quiet Time! 🌙" : "Daily Goal Reached! 🌈"}
            </h2>
            
            <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed">
              {isSlotError 
                ? "Your parents have scheduled some quiet time for you right now. The platform is resting! 😴" 
                : "Great job exploring today! You've reached the daily limit set by your parents. Time for some offline magic! ✨"}
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border-2 border-gray-100">
                <div className={`${isSlotError ? 'bg-sky-blue/10' : 'bg-sunshine-yellow/10'} p-2 rounded-xl`}>
                  <Clock className={`w-6 h-6 ${isSlotError ? 'text-sky-blue' : 'text-sunshine-yellow'}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Message from Parents</p>
                  <p className="text-gray-700 font-black">
                    {isSlotError ? "Scheduled Break Time" : "Daily Limit Completed"}
                  </p>
                </div>
              </div>

              {status.reason === 'limit_reached' && (
                <p className="text-sm text-hot-pink font-bold bg-hot-pink/5 py-2 px-4 rounded-full inline-block">
                  Resets tomorrow at 12:00 AM 🌙
                </p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-100">
              <p className="text-gray-400 text-sm font-medium">
                Go play outside, read a book, or help with chores! Qidzo will see you soon! 🚀
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
