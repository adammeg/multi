import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { handleApiError } from "@/lib/utils/api-handler";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
    const body = (await request.json()) as HandleUploadBody;

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
    return handleApiError(error);
  }
}
