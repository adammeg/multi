import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { AppError } from "@/lib/utils/api-response";
import type { JwtPayload } from "@/types";

export async function withAuth(
  request: NextRequest
): Promise<{ user: JwtPayload }> {
  await connectDB();

  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("accessToken")?.value;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  try {
    const user = verifyAccessToken(token);
    return { user };
  } catch {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
  }
}

export async function withAdmin(
  request: NextRequest
): Promise<{ user: JwtPayload }> {
  const { user } = await withAuth(request);
  if (user.role !== "admin") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
  return { user };
}

export async function withDb(): Promise<void> {
  await connectDB();
}
