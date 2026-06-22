import ffmpeg from "fluent-ffmpeg";

let configured = false;

export function configureFfmpeg() {
  if (configured) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg") as { path: string };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffprobeInstaller = require("@ffprobe-installer/ffprobe") as { path: string };
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
    configured = true;
  } catch {
    // Fall back to system ffmpeg/ffprobe if available (e.g. Docker)
  }
}

configureFfmpeg();

export { ffmpeg };
