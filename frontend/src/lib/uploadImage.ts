import { v2 as cloudinary } from "cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function saveUploadedImages(files: File[]): Promise<string[]> {
  const paths: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) continue;
    if (file.size > MAX_SIZE_BYTES) continue;

    try {
      const buffer = await file.arrayBuffer();
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "dreamstartup",
            public_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        uploadStream.end(Buffer.from(buffer));
      });

      paths.push(result.secure_url);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  return paths;
}
