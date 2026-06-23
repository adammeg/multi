import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { postService } from "@/features/posts/services/post.service";
import { createPostJsonSchema, createPostSchema } from "@/features/posts/dto/post.dto";
import { handleApiError, successResponse, withRateLimit } from "@/lib/utils/api-handler";
import { AppError, errorResponse } from "@/lib/utils/api-response";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
    const result = await postService.getPosts(user.userId, page, limit);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    withRateLimit(request);
    const { user } = await withAuth(request);

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        throw new AppError("Invalid JSON body", 400);
      }

      let dto;
      try {
        dto = createPostJsonSchema.parse(body);
      } catch (err) {
        if (err instanceof ZodError) {
          const message = err.issues.map((i) => i.message).join("; ");
          return errorResponse(message, 400, { code: "VALIDATION_ERROR" });
        }
        throw err;
      }

      const { videoUrl, videoFilename, ...postDto } = dto;
      const post = await postService.createPostFromUrl(
        user.userId,
        postDto,
        videoUrl,
        videoFilename
      );
      return successResponse(post, 201);
    }

    if (!contentType.includes("multipart/form-data")) {
      throw new AppError(
        "Content-Type must be application/json or multipart/form-data",
        400
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new AppError(
        "Failed to read upload. On Vercel, videos must use direct upload — redeploy with Blob storage enabled.",
        400,
        "INVALID_FORM_DATA"
      );
    }

    const video = formData.get("video") as File | null;
    if (!video || video.size === 0) {
      throw new AppError("Video file is required", 400);
    }

    const scheduledForRaw = formData.get("scheduledFor");
    const scheduledFor =
      typeof scheduledForRaw === "string" && scheduledForRaw.length > 0
        ? scheduledForRaw
        : undefined;

    let dto;
    try {
      dto = createPostSchema.parse({
        caption: String(formData.get("caption") ?? ""),
        hashtags: JSON.parse((formData.get("hashtags") as string) ?? "[]"),
        platforms: JSON.parse((formData.get("platforms") as string) ?? "[]"),
        scheduledFor,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join("; ");
        return errorResponse(message, 400, { code: "VALIDATION_ERROR" });
      }
      throw err;
    }

    const buffer = Buffer.from(await video.arrayBuffer());
    const post = await postService.createPost(user.userId, dto, buffer, video.name);
    return successResponse(post, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
