import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/features/auth/services/auth.service";
import { loginSchema } from "@/features/auth/dto/auth.dto";
import { withDb } from "@/lib/middleware/auth.middleware";
import { handleApiError, parseBody, successResponse, withRateLimit } from "@/lib/utils/api-handler";

export async function POST(request: NextRequest) {
  try {
    withRateLimit(request);
    await withDb();
    const dto = await parseBody(request, loginSchema);
    const result = await authService.login(dto, {
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
    });

    const response = successResponse(result);
    response.cookies.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 900,
      path: "/",
    });
    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 604800,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
