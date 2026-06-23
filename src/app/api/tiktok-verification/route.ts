import { NextResponse } from "next/server";

/**
 * Serves TikTok domain verification file content from env vars.
 * Exposed at site root via rewrite in next.config.ts (e.g. /tiktok-developers-site-verification.txt).
 */
export async function GET() {
  const content = process.env.TIKTOK_VERIFICATION_CONTENT?.trim();
  if (!content) {
    return new NextResponse("TikTok verification not configured", { status: 404 });
  }

  const filename =
    process.env.TIKTOK_VERIFICATION_FILENAME ?? "tiktok-developers-site-verification.txt";
  const isHtml = filename.toLowerCase().endsWith(".html");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": isHtml ? "text/html; charset=utf-8" : "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
