/**
 * GCS Avatar Upload (Server-side only)
 * ======================================
 *
 * POST /api/gcs/avatar-upload
 * Body: FormData { file: File, userId?: string }
 *
 * Server uploads the avatar image directly to GCS using the service account key.
 * Browser never talks to GCS directly → no CORS / 403 issue.
 * Returns: { publicUrl: string }
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/gcsClient';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const bucketName = process.env.GCS_BUCKET_NAME ?? 'eduvi_folders';
const folder = process.env.GCS_FOLDER_AVATARS ?? 'avatars';

const normalizeSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'user';

const normalizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'avatar.jpg';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const userIdValue = formData.get('userId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'file must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'file size must be under 5 MB' }, { status: 400 });
    }

    const userFolder =
      typeof userIdValue === 'string' && userIdValue
        ? normalizeSegment(userIdValue)
        : 'anonymous';

    const timestamp = Date.now();
    const unique = randomUUID().slice(0, 8);
    const objectName = `${folder}/${userFolder}/${timestamp}-${unique}-${normalizeFileName(file.name)}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket(bucketName);
    const target = bucket.file(objectName);

    await target.save(buffer, {
      contentType: file.type,
      resumable: false,
    });

    // Return a short proxy URL instead of a long signed URL (backend has 500-char limit).
    // /api/gcs/avatar-proxy?key=<objectName> generates a fresh signed read URL on each request.
    const proxyUrl = `/api/gcs/avatar-proxy?key=${encodeURIComponent(objectName)}`;

    return NextResponse.json({ publicUrl: proxyUrl });
  } catch (err) {
    console.error('[api/gcs/avatar-upload] Error:', err);
    return NextResponse.json({ error: 'Avatar upload to GCS failed' }, { status: 500 });
  }
}
