import ParentNavbar from "@/components/parent/ParentNavbar";
import ParentSidebar from "@/components/parent/ParentSidebar";
import ParentMobileNav from "@/components/parent/ParentMobileNav";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-inter pb-20 lg:pb-0">
      <ParentNavbar />
      
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <ParentSidebar />
          
          <main className="flex-1 w-full min-w-0 py-6">
            {children}
          </main>
        </div>
      </div>
      
      <ParentMobileNav />
    </div>
  );
}
