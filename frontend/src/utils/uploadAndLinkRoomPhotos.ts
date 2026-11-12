const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export interface RoomPhotoAttachment {
  fileName: string;
  url: string;
}

export interface AttachRoomImagesResponse {
  success: boolean;
  message: string;
  data: {
    linked: number;
    unmatched: number;
    example: string;
    results: Array<{
      fileName: string;
      url: string;
      status: "linked" | "unmatched" | "invalid_url" | "invalid_name";
      propertyRef?: string;
      roomRef?: string;
      position?: number;
      message?: string;
    }>;
  };
}

async function uploadOneToCloudinary(file: File): Promise<RoomPhotoAttachment> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary is not configured.");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body },
  );
  const json = (await res.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message ?? `Upload failed for ${file.name}`);
  }

  return { fileName: file.name, url: json.secure_url };
}

/**
 * Upload files to Cloudinary (keeps original file names), then link to room types.
 * apiPost = your authenticated fetch/RTK helper that hits the gateway.
 */
export async function uploadAndLinkRoomPhotos(
  files: File[],
  apiPost: (
    path: string,
    body: unknown,
  ) => Promise<AttachRoomImagesResponse>,
  batchId?: string,
): Promise<AttachRoomImagesResponse> {
  const attachments: RoomPhotoAttachment[] = [];

  for (const file of files) {
    attachments.push(await uploadOneToCloudinary(file));
  }

  return apiPost("/api/v1/property-imports/room-images", {
    batchId,
    attachments,
  });
}