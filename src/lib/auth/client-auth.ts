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

  if (message.includes("client token")) {
    return (
      "Video upload is not configured on the server. In Vercel: open your project → " +
      "Storage → Create Blob store → connect it to this project → Redeploy. " +
      "Then log out, log in again, and retry."
    );
  }

  if (message.includes("Unauthorized") || message.includes("401")) {
    return "Your session expired. Log out, log in again, then retry the upload.";
  }

  return message;
}
