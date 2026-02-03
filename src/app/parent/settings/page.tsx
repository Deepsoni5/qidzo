import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <Settings className="w-12 h-12 text-gray-400" />
      </div>
      <h1 className="text-2xl font-black font-nunito text-gray-900 mb-2">Settings Coming Soon</h1>
      <p className="text-gray-500 font-bold max-w-md">
        We're working on giving you full control over your account and preferences. Stay tuned!
      </p>
    </div>
  );
}
