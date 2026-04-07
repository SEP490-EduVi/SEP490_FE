// src/services/gcsServices.ts
//
// Uses signed URLs to upload directly from the browser to GCS.
// The Next.js server only generates short-lived signed URLs (~15 min),
// so large payloads bypass the Vercel 4.5 MB function body limit.

/**
 * Upload slide data to GCS via signed URL (browser → GCS direct).
 * 1. POST /api/gcs/signed-url  → get { signedUrl, gcsObjectUrl }
 * 2. PUT JSON directly to signedUrl
 * Returns the gs:// URL to send to the backend.
 */
export async function uploadSlideToGcs(
  productCode: string,
  data: unknown,
): Promise<string> {
  // Step 1: Get signed URL from our server
  const signedRes = await fetch('/api/gcs/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productCode }),
  });

  if (!signedRes.ok) {
    const body = await signedRes.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Failed to get signed URL (${signedRes.status})`,
    );
  }

  const { signedUrl, gcsObjectUrl } = await signedRes.json();

  // Step 2: Upload JSON directly to GCS via signed URL
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!uploadRes.ok) {
    throw new Error(`GCS direct upload failed (${uploadRes.status})`);
  }

  return gcsObjectUrl as string;
}

/**
 * Upload material file (and optional preview) to GCS via signed URLs.
 * 1. POST /api/gcs/material-signed-url → get signed URLs
 * 2. PUT files directly to GCS
 * Returns gs:// URLs for backend metadata.
 */
export async function uploadMaterialFilesToGcs(input: {
  file: File;
  previewFile?: File;
  prefix?: string;
  userId?: string | number;
}): Promise<{ resourceUrl: string; previewUrl: string | null }> {
  // Step 1: Get signed URL(s) from our server
  const signedRes = await fetch('/api/gcs/material-signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: input.file.name,
      contentType: input.file.type || 'application/octet-stream',
      prefix: input.prefix,
      userId: input.userId !== undefined && input.userId !== null
        ? String(input.userId)
        : undefined,
      previewFileName: input.previewFile?.name,
      previewContentType: input.previewFile?.type,
    }),
  });

  if (!signedRes.ok) {
    const body = await signedRes.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Failed to get material signed URL (${signedRes.status})`,
    );
  }

  const { resource, preview } = await signedRes.json();

  // Step 2: Upload main file directly to GCS
  const uploadRes = await fetch(resource.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': input.file.type || 'application/octet-stream' },
    body: input.file,
  });

  if (!uploadRes.ok) {
    throw new Error(`GCS material upload failed (${uploadRes.status})`);
  }

  // Step 3: Upload preview file if provided
  let previewUrl: string | null = null;
  if (input.previewFile && preview) {
    const previewRes = await fetch(preview.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': input.previewFile.type || 'application/octet-stream' },
      body: input.previewFile,
    });

    if (!previewRes.ok) {
      console.warn(`GCS preview upload failed (${previewRes.status}), continuing without preview`);
    } else {
      previewUrl = preview.gcsUrl as string;
    }
  }

  return {
    resourceUrl: resource.gcsUrl as string,
    previewUrl,
  };
}

/**
 * Upload avatar image to GCS via Next.js server route (browser → server → GCS).
 * POST /api/gcs/avatar-upload with FormData → server saves to GCS directly.
 * Returns the public HTTPS URL to store as avatarUrl in the backend.
 */
export async function uploadAvatarToGcs(
  file: File,
  userId?: string | number,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (userId !== undefined && userId !== null) {
    formData.append('userId', String(userId));
  }

  const res = await fetch('/api/gcs/avatar-upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Avatar upload failed (${res.status})`,
    );
  }

  const { publicUrl } = await res.json();
  return publicUrl as string;
}
