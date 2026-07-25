import { getStoredToken } from "./auth";

const STORAGE_KEY = "kostel_uploads";

export function normalizeUploadUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

export function getStoredUploads(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUploadUrl(url: string): void {
  if (!url) return;
  const normalized = normalizeUploadUrl(url);
  const existing = getStoredUploads();
  if (!existing.includes(normalized)) {
    existing.push(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
}

export function removeUploadUrl(url: string): void {
  if (!url) return;
  const normalized = normalizeUploadUrl(url);
  const existing = getStoredUploads().filter((u) => u !== normalized);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function clearUploads(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function getPresignedUrl(
  filename: string,
  contentType: string,
): Promise<{ presignedUrl: string; cdnUrl: string }> {
  const token = getStoredToken();
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename, contentType }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to get presigned URL (${res.status})`);
  }

  return res.json();
}

export async function uploadToCdn(
  presignedUrl: string,
  file: File | Blob,
): Promise<boolean> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  return res.ok;
}
