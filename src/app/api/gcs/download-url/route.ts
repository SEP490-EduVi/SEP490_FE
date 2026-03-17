/**
 * GCS Download Signed URL (Server-side only)
 * ===========================================
 *
 * POST /api/gcs/download-url
 * Body: { gcsUrl: string }  — a gs://bucket/path format URL
 *
 * Returns a short-lived signed GET URL the browser can use to stream
 * video (or any other binary file) directly from GCS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

const keyFilePath =
  process.env.GCS_KEY_FILE ??
  path.join(process.cwd(), 'src', 'private', 'gcp-key.json');

const storage = new Storage({ keyFilename: keyFilePath });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gcsUrl } = body as { gcsUrl?: string };

    if (!gcsUrl || typeof gcsUrl !== 'string') {
      return NextResponse.json({ error: 'gcsUrl is required' }, { status: 400 });
    }

    const match = gcsUrl.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid gs:// URL format' }, { status: 400 });
    }

    const [, bucketName, objectName] = match;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return NextResponse.json({ signedUrl });
  } catch (err) {
    console.error('[api/gcs/download-url] Error:', err);
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }
}
