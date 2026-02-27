import SchoolDashboardContent from "@/components/school/SchoolDashboardContent";
import { getSchoolDashboardData } from "@/actions/school";

export default async function SchoolDashboardPage() {
  const data = await getSchoolDashboardData();

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black font-nunito text-gray-900 tracking-tight">
          School Dashboard
        </h1>
        <p className="text-gray-500 font-bold">
          Monitor your school's digital growth and engagement.
        </p>
      </div>

      {data ? (
        <SchoolDashboardContent data={data} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-nunito font-black text-gray-400 uppercase tracking-widest text-sm">
            Unable to load dashboard data.
          </p>
        </div>
      )}
    </div>
  );
}
