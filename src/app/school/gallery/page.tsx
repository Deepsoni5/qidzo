import SchoolGalleryContent from "@/components/school/SchoolGalleryContent";

export const metadata = {
  title: "Gallery | Qidzo Partner Portal",
  description: "Upload and manage your school's photo and video gallery.",
};

export default function SchoolGalleryPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black font-nunito text-gray-900 tracking-tight">
          Gallery
        </h1>
        <p className="text-gray-500 font-bold">
          Showcase your school's best moments — photos, events and short videos.
        </p>
      </div>

      <SchoolGalleryContent />
    </div>
  );
}
