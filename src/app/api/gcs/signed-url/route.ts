/**
 * GCS Signed URL API Route (Server-side only)
 * ============================================
 *
 * POST /api/gcs/signed-url
 * Body: { productCode: string }
 *
 * Returns a signed URL so the browser can upload the edited slide JSON
 * directly to Google Cloud Storage without exposing the service account key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/gcsClient';

const bucketName = process.env.GCS_BUCKET_NAME ?? 'eduvi_folders';
const folder = process.env.GCS_FOLDER_EDITED_SLIDES ?? 'edited_slides';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productCode } = body as { productCode?: string };

    if (!productCode || typeof productCode !== 'string') {
      return NextResponse.json(
        { error: 'productCode is required' },
        { status: 400 },
      );
    }

    // Sanitise: allow only alphanumeric, dash, underscore
    if (!/^[\w-]+$/.test(productCode)) {
      return NextResponse.json(
        { error: 'Invalid productCode format' },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const objectName = `${folder}/${productCode}/${timestamp}.json`;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    // Generate a signed URL valid for 15 minutes, allowing only PUT
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'application/json',
    });

    // The public GCS URL the backend can use to fetch the file
    const gcsObjectUrl = `gs://${bucketName}/${objectName}`;

    return NextResponse.json({
      signedUrl,
      gcsObjectUrl,
      objectName,
    });
  } catch (err) {
    console.error('[api/gcs/signed-url] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 },
    );
  }
}
