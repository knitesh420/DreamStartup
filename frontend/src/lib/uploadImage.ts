import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "@/lib/ApiError";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export async function saveUploadedImages(files: File[]): Promise<string[]> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(
      500,
      "Image upload is not configured on the server. Set Cloudinary environment variables."
    );
  }

  const paths: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ApiError(
        400,
        `Unsupported image type: ${file.type || "unknown"}`
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new ApiError(
        400,
        `${file.name || "Image"} exceeds the 5 MB upload limit`
      );
    }

    try {
      const buffer = await file.arrayBuffer();
      const result = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: "dreamstartup",
              public_id: `${Date.now()}-${Math.random()
                .toString(36)
                .substring(7)}`,
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              if (!result?.secure_url) {
                reject(new Error("Cloudinary upload returned no secure URL"));
                return;
              }

              resolve({ secure_url: result.secure_url });
            },
          );

          uploadStream.end(Buffer.from(buffer));
        }
      );

      paths.push(result.secure_url);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : typeof error === "object" &&
                error !== null &&
                "error" in error &&
                typeof (error as { error?: { message?: unknown } }).error?.message ===
                  "string"
              ? (error as { error: { message: string } }).error.message
              : "Failed to upload image to Cloudinary";
      throw new ApiError(500, message);
    }
  }

  return paths;
}
