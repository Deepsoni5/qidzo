import { Zap } from "lucide-react";

export default function UpgradePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
      <div className="bg-sunshine-yellow/20 p-6 rounded-full mb-6">
        <Zap className="w-12 h-12 text-sunshine-yellow fill-sunshine-yellow" />
      </div>
      <h1 className="text-2xl font-black font-nunito text-gray-900 mb-2">Premium Features Coming Soon</h1>
      <p className="text-gray-500 font-bold max-w-md">
        Unlock advanced analytics, unlimited history, and special badges for your kids with Qidzo Premium!
      </p>
    </div>
  );
}
