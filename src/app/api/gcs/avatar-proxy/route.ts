/**
 * GCS Avatar Proxy (Server-side only)
 * =====================================
 *
 * GET /api/gcs/avatar-proxy?key=avatars/5/timestamp-uuid-file.jpg
 *
 * Generates a short-lived signed read URL for the avatar object and
 * redirects the browser to it. The stored avatarUrl in the backend is
 * always this short proxy URL (< 100 chars), bypassing the 500-char limit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/gcsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bucketName = process.env.GCS_BUCKET_NAME ?? 'eduvi_folders';

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key');

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    // Only allow keys within the avatars folder
    if (!key.startsWith('avatars/')) {
      return NextResponse.json({ error: 'Invalid key prefix' }, { status: 400 });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(key);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour — regenerated each browser request
    });

    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (err) {
    console.error('[api/gcs/avatar-proxy] Error:', err);
    return NextResponse.json({ error: 'Failed to serve avatar' }, { status: 500 });
  }
}
