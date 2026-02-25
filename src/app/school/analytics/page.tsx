import SchoolAnalyticsContent from "@/components/school/SchoolAnalyticsContent";

export default function SchoolAnalyticsPage() {
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

      <SchoolAnalyticsContent />
    </div>
  );
}
