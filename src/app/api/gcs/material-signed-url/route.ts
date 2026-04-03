/**
 * GCS Material Signed URL (Server-side only)
 * ============================================
 *
 * POST /api/gcs/material-signed-url
 * Body: { fileName: string, contentType: string, prefix?: string, userId?: string,
 *         previewFileName?: string, previewContentType?: string }
 *
 * Returns signed upload URL(s) so the browser can upload material files
 * directly to GCS without hitting Vercel's 4.5 MB body limit.
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/gcsClient';

const bucketName = process.env.GCS_BUCKET_NAME ?? 'eduvi_folders';
const folder = process.env.GCS_FOLDER_MATERIAL ?? 'materials';

const normalizeSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'material';

const normalizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file.bin';

async function createSignedUrl(objectName: string, contentType: string) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectName);

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  const gcsUrl = `gs://${bucketName}/${objectName}`;
  return { signedUrl, gcsUrl };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fileName,
      contentType,
      prefix,
      userId,
      previewFileName,
      previewContentType,
    } = body as {
      fileName?: string;
      contentType?: string;
      prefix?: string;
      userId?: string;
      previewFileName?: string;
      previewContentType?: string;
    };

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 },
      );
    }

    const prefixSegment = prefix ? normalizeSegment(prefix) : 'expert-material';
    const userFolder = userId ? normalizeSegment(userId) : 'anonymous';
    const timestamp = Date.now();
    const unique = randomUUID().slice(0, 8);

    // Main file signed URL
    const resourceObjectName = `${folder}/${userFolder}/${prefixSegment}/${timestamp}-${unique}-${normalizeFileName(fileName)}`;
    const resource = await createSignedUrl(resourceObjectName, contentType);

    // Preview file signed URL (optional)
    let preview: { signedUrl: string; gcsUrl: string } | null = null;
    if (previewFileName && previewContentType) {
      const previewObjectName = `${folder}/${userFolder}/${prefixSegment}/${timestamp}-${unique}-preview-${normalizeFileName(previewFileName)}`;
      preview = await createSignedUrl(previewObjectName, previewContentType);
    }

    return NextResponse.json({
      resource: {
        signedUrl: resource.signedUrl,
        gcsUrl: resource.gcsUrl,
      },
      preview: preview
        ? { signedUrl: preview.signedUrl, gcsUrl: preview.gcsUrl }
        : null,
    });
  } catch (err) {
    console.error('[api/gcs/material-signed-url] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 },
    );
  }
}
