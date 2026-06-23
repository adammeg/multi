import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/features/auth/services/auth.service";
import { refreshTokenSchema } from "@/features/auth/dto/auth.dto";
import { withDb } from "@/lib/middleware/auth.middleware";
import { handleApiError, parseBody, successResponse } from "@/lib/utils/api-handler";

export async function POST(request: NextRequest) {
  try {
    await withDb();
    const body = await parseBody(request, refreshTokenSchema);
    const cookieToken = request.cookies.get("refreshToken")?.value;
    const token = body.refreshToken || cookieToken;
    if (!token) throw new Error("No refresh token");
    const result = await authService.refresh(token);

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
