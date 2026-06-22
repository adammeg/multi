import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  return NextResponse.json(
    { success: false, error: message, errors },
    { status }
  );
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}
