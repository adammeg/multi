import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { authService } from "@/features/auth/services/auth.service";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const result = await authService.verifyEmail(user.userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
