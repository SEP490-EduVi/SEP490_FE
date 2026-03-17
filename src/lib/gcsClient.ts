import { Storage } from '@google-cloud/storage';
import path from 'path';

function createStorage(): Storage {
  if (process.env.GCS_KEY) {
    const credentials = JSON.parse(process.env.GCS_KEY);
    return new Storage({ credentials });
  }
  const keyFilePath =
    process.env.GCS_KEY_FILE ??
    path.join(process.cwd(), 'src', 'private', 'gcp-key.json');
  return new Storage({ keyFilename: keyFilePath });
}

export const storage = createStorage();
