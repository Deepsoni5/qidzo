import SchoolAnalyticsContent from "@/components/school/SchoolAnalyticsContent";
import { getSchoolAnalytics } from "@/actions/school-analytics";

export default async function SchoolAnalyticsPage() {
  const data = await getSchoolAnalytics();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black font-nunito text-gray-900 tracking-tight">
          Analytics Dashboard 📊
        </h1>
        <p className="text-gray-500 font-bold mt-1">
          Deep insights into your school's performance and engagement
        </p>
      </div>

      {data ? (
        <SchoolAnalyticsContent data={data} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-nunito font-black text-gray-400 uppercase tracking-widest text-sm">
            Unable to load analytics data.
          </p>
        </div>
      )}
    </div>
  );
}
