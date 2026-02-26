import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

export const runtime = "nodejs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const customFolder = formData.get("folder") as string | null
    const customResourceType = formData.get("resource_type") as "image" | "video" | "raw" | "auto" | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine resource type if not provided
    let resourceType: "image" | "video" | "raw" | "auto" = customResourceType || "auto";
    if (!customResourceType) {
      if (file.type.startsWith("image/")) resourceType = "image";
      else if (file.type.startsWith("video/")) resourceType = "video";
      else resourceType = "raw";
    }

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: customFolder || "qidzo/general",
          resource_type: resourceType,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(buffer)
    })

    return NextResponse.json(
      { 
        url: result.secure_url, 
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        duration: result.duration ?? null
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Upload failed" },
      { status: 500 }
    )
  }
}

