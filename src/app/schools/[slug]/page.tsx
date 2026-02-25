import { notFound } from "next/navigation";
import { getSchoolBySlug, getSchoolGalleryBySchoolId, getSchoolPosts } from "@/actions/school";
import { getCurrentUserRole } from "@/actions/auth";
import Navbar from "@/components/Navbar";
import SchoolPublicPageClient from "@/components/school/SchoolPublicPageClient";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function SchoolPage({ params }: PageProps) {
    const { slug } = await params;
    const school = await getSchoolBySlug(slug);

    if (!school) {
        notFound();
    }

    const [gallery, posts, userRole] = await Promise.all([
        getSchoolGalleryBySchoolId(school.id),
        getSchoolPosts(school.id),
        getCurrentUserRole()
    ]);

    return (
        <div className="min-h-screen bg-gray-50/30 font-inter">
            <Navbar />
            <main className="pt-16 pb-20 lg:pb-10">
                <SchoolPublicPageClient
                    school={school}
                    gallery={gallery}
                    posts={posts}
                    userRole={userRole}
                />
            </main>
        </div>
    );
}
