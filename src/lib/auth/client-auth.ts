"use client";

import { useAuthStore } from "@/stores/auth.store";

export async function getUploadAuthHeaders(): Promise<Record<string, string>> {
  const { accessToken, setAuth, user } = useAuthStore.getState();

  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (res.ok && json.data?.accessToken) {
      if (user) {
        setAuth(user, json.data.accessToken);
      } else {
        useAuthStore.setState({ accessToken: json.data.accessToken });
      }
      return { Authorization: `Bearer ${json.data.accessToken}` };
    }
  } catch {
    // fall through
  }

  return {};
}

export function formatBlobUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Upload failed";

  if (message.includes("CORS") || message.includes("/api/blob/mpu") || message.includes("mpu")) {
    return (
      "Upload blocked by browser (multipart CORS). Redeploy the latest app version and retry. " +
      "If the video is over ~100 MB, compress it before uploading."
    );
  }

  if (message.includes("client token") || message.includes("BLOB_NOT_CONFIGURED") || message.includes("503")) {
    return (
      "Video storage (Vercel Blob) is not set up — this is separate from MongoDB. " +
      "In Vercel: Storage → Create Blob → connect to multi-flame → Redeploy. " +
      "Or use a video smaller than 4 MB until Blob is configured."
    );
  }

  if (message.includes("Unauthorized") || message.includes("401")) {
    return "Your session expired. Log out, log in again, then retry the upload.";
  }

  return message;
}
