import type { NextConfig } from "next";

const tiktokVerificationFile =
  process.env.TIKTOK_VERIFICATION_FILENAME ?? "tiktok-developers-site-verification.txt";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "mongoose",
    "bcryptjs",
    "fluent-ffmpeg",
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
  ],
  experimental: {
    proxyClientMaxBodySize: "500mb",
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  async rewrites() {
    return [
      {
        source: `/${tiktokVerificationFile}`,
        destination: "/api/tiktok-verification",
      },
    ];
  },
};

export default nextConfig;
