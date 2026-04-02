'use client';

/**
 * GcsImage
 * ========
 * Drop-in replacement for <img> that transparently resolves GCS gs:// URLs
 * to short-lived signed HTTPS URLs via /api/gcs/download-url.
 *
 * Non-GCS URLs (https://) are passed through unchanged.
 * null/undefined src renders nothing.
 * While the signed URL is being fetched, a shimmer placeholder is shown.
 *
 * Also exports `resolveGcsUrl` for use in download button handlers.
 */

import React, { useState, useEffect } from 'react';

// ─── Module-level URL cache (avoids re-fetching the same GCS object) ───────
const GCS_URL_CACHE = new Map<string, string>();

export async function resolveGcsUrl(url: string): Promise<string> {
  if (!url.startsWith('gs://')) return url;
  if (GCS_URL_CACHE.has(url)) return GCS_URL_CACHE.get(url)!;

  const res = await fetch('/api/gcs/download-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gcsUrl: url }),
  });

  if (!res.ok) throw new Error(`GCS signed-url failed (${res.status})`);
  const { signedUrl } = (await res.json()) as { signedUrl: string };
  GCS_URL_CACHE.set(url, signedUrl);
  return signedUrl;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface GcsImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
}

export function GcsImage({ src, className, ...rest }: GcsImageProps) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!src) {
      setResolved(null);
      setLoading(false);
      setErrored(false);
      return;
    }

    if (!src.startsWith('gs://')) {
      setResolved(src);
      setLoading(false);
      setErrored(false);
      return;
    }

    // GCS URL — resolve asynchronously
    setLoading(true);
    setErrored(false);
    setResolved(null);

    resolveGcsUrl(src)
      .then((url) => {
        setResolved(url);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setErrored(true);
      });
  }, [src]);

  if (!src || errored) return null;

  if (loading || !resolved) {
    // Shimmer that fills the parent container
    return <div className={`w-full h-full animate-pulse bg-gray-200 ${className ?? ''}`} />;
  }

  return (
    <img
      src={resolved}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
