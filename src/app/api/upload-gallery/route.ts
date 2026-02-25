import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Detect resource type from MIME
        const isVideo = file.type.startsWith("video/");

        const result: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "qidzo/school_gallery",
                    resource_type: isVideo ? "video" : "image",
                    overwrite: false,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(buffer);
        });

        return NextResponse.json(
            {
                url: result.secure_url,
                public_id: result.public_id,
                resource_type: result.resource_type,   // "image" | "video"
                format: result.format,
                duration: result.duration ?? null,      // seconds, video only
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message ?? "Upload failed" },
            { status: 500 }
        );
    }
}
