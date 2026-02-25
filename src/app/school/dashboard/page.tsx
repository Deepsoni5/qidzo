import SchoolDashboardContent from "@/components/school/SchoolDashboardContent";

export default function SchoolDashboardPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black font-nunito text-gray-900 tracking-tight">
          School Dashboard
        </h1>
        <p className="text-gray-500 font-bold">Monitor your school's digital growth and engagement.</p>
      </div>
      
      <SchoolDashboardContent />
    </div>
  );
}
