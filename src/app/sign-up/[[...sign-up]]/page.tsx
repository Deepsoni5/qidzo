import SignUpForm from "@/components/auth/SignUpForm";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="z-10 w-full max-w-md mb-8 text-center">
         <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-brand-purple rounded-xl flex items-center justify-center text-white font-nunito text-3xl font-black shadow-lg shadow-brand-purple/30 border-b-4 border-black/10">
            Q
            </div>
            <span className="text-4xl font-nunito font-black text-brand-purple tracking-tight">
            Qidzo
            </span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 font-nunito">Parent Portal</h1>
        <p className="text-gray-500">Manage your child's learning journey</p>
      </div>

      <div className="z-10 w-full">
        <SignUpForm />
      </div>

      <div className="mt-8 text-center text-sm text-gray-400 z-10">
        <p>© 2026 Qidzo Inc. All rights reserved.</p>
      </div>
    </div>
  );
}
