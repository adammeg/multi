import { NextRequest } from "next/server";
import { authService } from "@/features/auth/services/auth.service";
import { forgotPasswordSchema, resetPasswordSchema } from "@/features/auth/dto/auth.dto";
import { withDb } from "@/lib/middleware/auth.middleware";
import { handleApiError, parseBody, successResponse, withRateLimit } from "@/lib/utils/api-handler";

export async function POST(request: NextRequest) {
  try {
    withRateLimit(request);
    await withDb();
    const dto = await parseBody(request, forgotPasswordSchema);
    const result = await authService.forgotPassword(dto.email);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    withRateLimit(request);
    await withDb();
    const dto = await parseBody(request, resetPasswordSchema);
    const result = await authService.resetPassword(dto.token, dto.password);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
