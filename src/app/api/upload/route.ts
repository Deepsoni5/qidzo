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

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "qidzo/profile_picture",
          resource_type: "image",
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
      { url: result.secure_url, public_id: result.public_id },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Upload failed" },
      { status: 500 }
    )
  }
}

