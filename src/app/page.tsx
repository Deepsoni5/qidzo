import Navbar from "@/components/Navbar";
import CategoryBar from "@/components/CategoryBar";
import Feed from "@/components/Feed";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import LeftSidebar from "@/components/LeftSidebar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      
      <main className="pt-16 pb-24 lg:pb-0">
        <CategoryBar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar (Desktop Only) */}
            <LeftSidebar />

            {/* Main Feed */}
            <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
              <Feed />
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-80 shrink-0">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
