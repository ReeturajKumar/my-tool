import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            "Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
          code: "CLOUDINARY_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "task_attachments";

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
          },
          (error, res) => {
            if (error || !res) {
              reject(error || new Error("Upload to Cloudinary failed"));
            } else {
              resolve(res);
            }
          }
        );
        stream.end(buffer);
      });

      return NextResponse.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    }

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { data, folder = "task_attachments" } = body;
      if (!data) {
        return NextResponse.json({ error: "No image data provided" }, { status: 400 });
      }

      const result = await cloudinary.uploader.upload(data, {
        folder,
        resource_type: "image",
      });

      return NextResponse.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    }

    return NextResponse.json(
      { error: "Invalid content type. Expected multipart/form-data or application/json" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload image";
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("public_id");
    if (!publicId) {
      return NextResponse.json({ error: "Missing public_id parameter" }, { status: 400 });
    }

    const res = await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true, result: res });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete image";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
