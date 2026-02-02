import { Search, Bell, User } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center text-white font-nunito text-2xl font-black shadow-lg shadow-brand-purple/30 border-b-4 border-black/10">
                Q
              </div>
              <span className="text-2xl font-nunito font-black text-brand-purple hidden sm:block tracking-tight">
                Qidzo
              </span>
            </div>


          {/* Search */}
          <div className="flex-1 max-w-md mx-4 sm:mx-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-2xl">
                🔍
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-3 py-2 border-2 border-transparent bg-gray-100 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-sky-blue transition-all duration-300 font-medium"
                placeholder="Search for magic... ✨"
              />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-hot-pink border-2 border-white rounded-full"></span>
            </button>
              <button className="flex items-center gap-2 p-1 pl-1 pr-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors group">
                <div className="w-8 h-8 rounded-full bg-hot-pink p-0.5">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <User className="w-5 h-5 text-hot-pink" />
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 hidden sm:block">Leo</span>
              </button>

          </div>
        </div>
      </div>
    </nav>
  );
}
