import { promises as fs } from "fs";
import path from "path";
import { ffmpeg, configureFfmpeg } from "@/lib/video/ffmpeg";
import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/utils/api-response";
import type { VideoMetadata } from "@/types";

const MAX_DURATION_SECONDS = 60;
const MAX_FILE_SIZE_MB = 500;
const TARGET_ASPECT_RATIO = 9 / 16;
const ASPECT_TOLERANCE = 0.05;

export interface VideoValidationResult {
  valid: boolean;
  metadata: VideoMetadata;
  errors: string[];
  warnings: string[];
}

export class VideoService {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(getEnv().STORAGE_LOCAL_PATH);
  }

  async validateVideo(filePath: string): Promise<VideoValidationResult> {
    const fullPath = path.join(this.basePath, filePath);
    const metadata = await this.extractMetadata(fullPath);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (metadata.duration > MAX_DURATION_SECONDS) {
      errors.push(`Video exceeds ${MAX_DURATION_SECONDS}s limit (${metadata.duration.toFixed(1)}s)`);
    }

    const ratio = metadata.width / metadata.height;
    if (Math.abs(ratio - TARGET_ASPECT_RATIO) > ASPECT_TOLERANCE) {
      errors.push(`Aspect ratio must be 9:16 (current: ${metadata.aspectRatio})`);
    }

    if (metadata.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
      errors.push(`File size exceeds ${MAX_FILE_SIZE_MB}MB`);
    }

    if (metadata.width < 720) {
      warnings.push("Resolution below 720p may reduce quality on some platforms");
    }

    return {
      valid: errors.length === 0,
      metadata,
      errors,
      warnings,
    };
  }

  async extractMetadata(filePath: string): Promise<VideoMetadata> {
    configureFfmpeg();
    const stat = await fs.stat(filePath);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) {
          return reject(
            new AppError(
              "Could not analyze video. Ensure the file is a valid video (MP4/MOV, 9:16, max 60s).",
              400,
              "VIDEO_ANALYSIS_FAILED"
            )
          );
        }

        const videoStream = data.streams.find((s) => s.codec_type === "video");
        if (!videoStream) return reject(new AppError("No video stream found", 400));

        const width = videoStream.width ?? 0;
        const height = videoStream.height ?? 0;
        const duration = data.format.duration ?? 0;

        resolve({
          duration,
          width,
          height,
          aspectRatio: `${width}:${height}`,
          fileSize: stat.size,
          format: data.format.format_name ?? "unknown",
        });
      });
    });
  }

  async generateThumbnail(
    videoPath: string,
    outputSubfolder = "thumbnails"
  ): Promise<string> {
    const fullVideoPath = path.join(this.basePath, videoPath);
    const dir = path.join(this.basePath, outputSubfolder);
    await fs.mkdir(dir, { recursive: true });

    const thumbName = `${path.basename(videoPath, path.extname(videoPath))}_thumb.jpg`;
    const outputPath = path.join(dir, thumbName);

    return new Promise((resolve, reject) => {
      ffmpeg(fullVideoPath)
        .screenshots({
          timestamps: ["00:00:01"],
          filename: thumbName,
          folder: dir,
          size: "360x640",
        })
        .on("end", () => resolve(path.join(outputSubfolder, thumbName)))
        .on("error", (err) => reject(new AppError(`Thumbnail generation failed: ${err.message}`, 500)));
    });
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.basePath, filePath));
    } catch {
      // Already deleted
    }
  }
}

export const videoService = new VideoService();
