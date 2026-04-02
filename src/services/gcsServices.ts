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

/**
 * Upload material file and optional preview file to GCS through Next.js server.
 * Returns gs:// URLs to be sent to backend as metadata.
 */
export async function uploadMaterialFilesToGcs(input: {
  file: File;
  previewFile?: File;
  prefix?: string;
  userId?: string | number;
}): Promise<{ resourceUrl: string; previewUrl: string | null }> {
  const formData = new FormData();
  formData.append('file', input.file);
  if (input.previewFile) formData.append('previewFile', input.previewFile);
  if (input.prefix) formData.append('prefix', input.prefix);
  if (input.userId !== undefined && input.userId !== null) {
    formData.append('userId', String(input.userId));
  }

  const res = await fetch('/api/gcs/material-upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `GCS material upload failed (${res.status})`,
    );
  }

  const result = await res.json();
  return {
    resourceUrl: result.resourceUrl as string,
    previewUrl: (result.previewUrl as string | null) ?? null,
  };
}
