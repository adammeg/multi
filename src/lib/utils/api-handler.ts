import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { AppError, errorResponse, successResponse } from "@/lib/utils/api-response";
import { rateLimit } from "@/lib/middleware/subscription.middleware";

export async function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, { code: error.code });
  }
  console.error("[API Error]", error);
  return errorResponse("Internal server error", 500);
}

export async function parseBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError("Validation failed", 422, "VALIDATION_ERROR");
  }
  return result.data;
}

export function withRateLimit(request: NextRequest) {
  rateLimit(request);
}

export { successResponse, errorResponse };
