export function getVideoUploadMeta(file: File): { pathname: string; contentType: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExt: Record<string, string> = {
    mov: "video/quicktime",
    mp4: "video/mp4",
    m4v: "video/x-m4v",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
  };

  const contentType = file.type || byExt[ext] || "video/mp4";
  const pathname = file.name.replace(/[^\w.\-]+/g, "_");

  return { pathname, contentType };
}
