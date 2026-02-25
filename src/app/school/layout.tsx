import SchoolNavbar from "@/components/school/SchoolNavbar";
import SchoolSidebar from "@/components/school/SchoolSidebar";
import SchoolMobileNav from "@/components/school/SchoolMobileNav";

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-inter pb-20 lg:pb-0">
      <SchoolNavbar />
      
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <SchoolSidebar />
          
          <main className="flex-1 w-full min-w-0 py-6">
            {children}
          </main>
        </div>
      </div>
      
      <SchoolMobileNav />
    </div>
  );
}
