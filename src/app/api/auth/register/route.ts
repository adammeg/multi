import { NextRequest } from "next/server";
import { authService } from "@/features/auth/services/auth.service";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } from "@/features/auth/dto/auth.dto";
import { withDb } from "@/lib/middleware/auth.middleware";
import { handleApiError, parseBody, successResponse, withRateLimit } from "@/lib/utils/api-handler";

export async function POST(request: NextRequest) {
  try {
    withRateLimit(request);
    await withDb();
    const dto = await parseBody(request, registerSchema);
    const result = await authService.register(dto);
    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
