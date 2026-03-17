/**
 * GCS Upload API Route (Server-side only)
 * ========================================
 *
 * POST /api/gcs/upload
 * Body: { productCode: string, data: object }
 *
 * Server uploads the slide JSON directly to GCS using the service account key.
 * Browser never talks to GCS → no CORS issue.
 * Returns: { gcsObjectUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/gcsClient';

const bucketName = process.env.GCS_BUCKET_NAME ?? 'eduvi_folders';
const folder = process.env.GCS_FOLDER_EDITED_SLIDES ?? 'edited_slides';
  try {
    const body = await req.json();
    const { productCode, data } = body as { productCode?: string; data?: unknown };

    if (!productCode || typeof productCode !== 'string') {
      return NextResponse.json({ error: 'productCode is required' }, { status: 400 });
    }

    if (!/^[\w-]+$/.test(productCode)) {
      return NextResponse.json({ error: 'Invalid productCode format' }, { status: 400 });
    }

    if (data === undefined || data === null) {
      return NextResponse.json({ error: 'data is required' }, { status: 400 });
    }

    const timestamp = Date.now();
    const objectName = `${folder}/${productCode}/${timestamp}.json`;
    const jsonBuffer = Buffer.from(JSON.stringify(data), 'utf-8');

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(jsonBuffer, {
      contentType: 'application/json',
      resumable: false,
    });

    const gcsObjectUrl = `gs://${bucketName}/${objectName}`;

    return NextResponse.json({ gcsObjectUrl });
  } catch (err) {
    console.error('[api/gcs/upload] Error:', err);
    return NextResponse.json({ error: 'GCS upload failed' }, { status: 500 });
  }
}
