import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      {/* 404 Visual */}
      <div className="relative mb-8">
        <div className="text-[150px] font-black font-nunito text-gray-200 leading-none select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white p-6 rounded-[32px] shadow-xl border-4 border-gray-100 rotate-12 transform hover:rotate-0 transition-transform duration-300">
             <span className="text-6xl">🙈</span>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-black font-nunito text-gray-900 mb-4">
        Oops! Where did it go?
      </h1>
      
      <p className="text-lg font-bold text-gray-500 max-w-md mb-8">
        We looked everywhere—under the bed, inside the toy box, even in outer space! But we couldn't find this page.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 bg-brand-purple text-white px-8 py-4 rounded-2xl font-black font-nunito text-lg shadow-xl shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all border-b-4 border-purple-800/20 active:border-b-0 active:translate-y-1"
        >
          <Home className="w-6 h-6" /> Go Home
        </Link>
        
        <button 
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl font-black font-nunito text-lg shadow-xl shadow-gray-200/50 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all border-b-4 border-gray-200 active:border-b-0 active:translate-y-1"
        >
          <ArrowLeft className="w-6 h-6" /> Go Back
        </button>
      </div>
    </div>
  );
}
