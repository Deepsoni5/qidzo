import SchoolSettingsContent from "@/components/school/SchoolSettingsContent";

export const metadata = {
  title: "Settings | Qidzo Partner Portal",
  description:
    "Update your school profile, branding, contact details and location.",
};

export default function SchoolSettingsPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black font-nunito text-gray-900 tracking-tight">
          Settings
        </h1>
        <p className="text-gray-500 font-bold">
          Update your organization profile, branding and contact information.
        </p>
      </div>

      <SchoolSettingsContent />
    </div>
  );
}
