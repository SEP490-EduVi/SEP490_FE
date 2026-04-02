import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/gcsClient';

const bucketName = process.env.GCS_BUCKET_NAME ?? 'eduvi_folders';
const folder = process.env.GCS_FOLDER_MATERIAL ?? 'material';

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

async function saveFile(file: File, objectName: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = storage.bucket(bucketName);
  const target = bucket.file(objectName);

  await target.save(buffer, {
    contentType: file.type || 'application/octet-stream',
    resumable: false,
  });

  return `gs://${bucketName}/${objectName}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const previewFile = formData.get('previewFile');
    const prefixValue = formData.get('prefix');
    const userIdValue = formData.get('userId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (previewFile !== null && !(previewFile instanceof File)) {
      return NextResponse.json({ error: 'previewFile is invalid' }, { status: 400 });
    }

    const prefix = typeof prefixValue === 'string' && prefixValue
      ? normalizeSegment(prefixValue)
      : 'expert-material';
    const userFolder = typeof userIdValue === 'string' && userIdValue
      ? normalizeSegment(userIdValue)
      : 'anonymous';

    const timestamp = Date.now();
    const unique = randomUUID().slice(0, 8);
    const resourceObjectName = `${folder}/${userFolder}/${prefix}/${timestamp}-${unique}-${normalizeFileName(file.name)}`;
    const resourceUrl = await saveFile(file, resourceObjectName);

    let previewUrl: string | null = null;
    if (previewFile instanceof File && previewFile.size > 0) {
      const previewObjectName = `${folder}/${userFolder}/${prefix}/${timestamp}-${unique}-preview-${normalizeFileName(previewFile.name)}`;
      previewUrl = await saveFile(previewFile, previewObjectName);
    }

    return NextResponse.json({ resourceUrl, previewUrl });
  } catch (err) {
    console.error('[api/gcs/material-upload] Error:', err);
    return NextResponse.json({ error: 'Material upload to GCS failed' }, { status: 500 });
  }
}
