// src/services/gcsServices.ts
//
// Uploads the slide JSON to GCS via the Next.js server API route.
// The server handles authentication with the service account key.
// Browser never communicates with GCS directly (avoids CORS issues).

/**
 * Upload slide data to GCS through the Next.js server.
 * Returns the GCS object URL (gs://...) to send to the backend.
 */
export async function uploadSlideToGcs(
  productCode: string,
  data: unknown,
): Promise<string> {
  const res = await fetch('/api/gcs/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productCode, data }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `GCS upload failed (${res.status})`,
    );
  }

  const result = await res.json();
  return result.gcsObjectUrl as string;
}
