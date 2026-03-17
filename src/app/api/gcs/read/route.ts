/**
 * GCS Read API Route (Server-side only)
 * =======================================
 *
 * GET /api/gcs/read?objectUrl=gs://bucket/path/to/file.json
 *
 * Reads a file from GCS using the service account key and streams it back.
 * Browser cannot use gs:// URLs directly — this route acts as a proxy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

const keyFilePath =
  process.env.GCS_KEY_FILE ??
  path.join(process.cwd(), 'src', 'private', 'gcp-key.json');

const storage = new Storage({ keyFilename: keyFilePath });

export async function GET(req: NextRequest) {
  try {
    const objectUrl = req.nextUrl.searchParams.get('objectUrl');

    if (!objectUrl) {
      return NextResponse.json({ error: 'objectUrl is required' }, { status: 400 });
    }

    // Parse gs://bucket-name/path/to/file
    const match = objectUrl.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid gs:// URL format' }, { status: 400 });
    }

    const [, bucketName, objectName] = match;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    const [contents] = await file.download();
    const json = JSON.parse(contents.toString('utf-8'));

    return NextResponse.json(json);
  } catch (err) {
    console.error('[api/gcs/read] Error:', err);
    return NextResponse.json({ error: 'Failed to read from GCS' }, { status: 500 });
  }
}
