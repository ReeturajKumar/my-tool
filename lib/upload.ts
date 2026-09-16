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
