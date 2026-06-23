import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is missing. In Vercel: Storage → Create Blob → connect to this project → Redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    await withAuth(request);
  } catch {
    return NextResponse.json(
      { error: "Unauthorized. Log in again and retry the upload." },
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
          "video/mpeg",
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
