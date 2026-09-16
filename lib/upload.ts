export interface UploadResult {
  url: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: string;
}

/**
 * Uploads an image File to Cloudinary via /api/upload
 */
export async function uploadImageToCloudinary(
  file: File,
  folder = "task_attachments"
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        url: "",
        error: data?.error || "Upload failed with status " + res.status,
      };
    }

    return {
      url: data.url,
      public_id: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error occurred during image upload";
    return {
      url: "",
      error: message,
    };
  }
}

/**
 * Uploads a base64 Data URL to Cloudinary via /api/upload
 */
export async function uploadDataUrlToCloudinary(
  dataUrl: string,
  folder = "task_attachments"
): Promise<UploadResult> {
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataUrl, folder }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        url: "",
        error: data?.error || "Upload failed with status " + res.status,
      };
    }

    return {
      url: data.url,
      public_id: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error occurred during image upload";
    return {
      url: "",
      error: message,
    };
  }
}

/**
 * Extracts public_id from a Cloudinary image URL
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const afterUpload = parts[1].replace(/^v\d+\//, "");
    const cleanPath = afterUpload.split("?")[0];
    const lastDotIndex = cleanPath.lastIndexOf(".");
    return lastDotIndex !== -1 ? cleanPath.slice(0, lastDotIndex) : cleanPath;
  } catch {
    return null;
  }
}

/**
 * Deletes an image from Cloudinary by its URL or public_id
 */
export async function deleteImageFromCloudinary(urlOrPublicId: string): Promise<boolean> {
  try {
    if (!urlOrPublicId) return false;
    const publicId = urlOrPublicId.startsWith("http")
      ? extractCloudinaryPublicId(urlOrPublicId)
      : urlOrPublicId;

    if (!publicId) return false;

    const res = await fetch(`/api/upload?public_id=${encodeURIComponent(publicId)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

