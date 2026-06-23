import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { withAuth } from "@/lib/middleware/auth.middleware";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
/** Vercel serverless body limit — direct multipart only works below this */
export const MAX_DIRECT_UPLOAD_BYTES = 4 * 1024 * 1024;

export const maxDuration = 60;

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function GET() {
  const blobConfigured = isBlobStorageConfigured();
  return NextResponse.json({
    blobConfigured,
    maxDirectUploadBytes: MAX_DIRECT_UPLOAD_BYTES,
    message: blobConfigured
      ? "Blob storage is ready for video uploads."
      : "Vercel Blob is not linked. Create a Blob store in Vercel Storage and redeploy, or upload videos under 4 MB.",
  });
}

export async function POST(request: NextRequest) {
  if (!isBlobStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          "Video storage (Vercel Blob) is not configured. This is not a database error. " +
          "In Vercel: Storage → Create Blob → connect to this project → Redeploy.",
        code: "BLOB_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  try {
    await withAuth(request);
  } catch {
    return NextResponse.json(
      { error: "Unauthorized. Log in again and retry the upload.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload request body" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "video/mp4",
          "video/quicktime",
          "video/webm",
          "video/x-msvideo",
          "video/x-m4v",
          "video/mpeg",
          "application/octet-stream",
        ],
        maximumSizeInBytes: MAX_VIDEO_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Blob upload failed";
    console.error("[posts/upload]", message);
    return NextResponse.json({ error: message, code: "BLOB_UPLOAD_FAILED" }, { status: 500 });
  }
}
