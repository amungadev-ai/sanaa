/**
 * CDN Client — Uploads and deletes media via cdn.sanaathrumylens.co.ke
 * 
 * Uses API key authentication for secure connection between
 * the Next.js app and the shared-hosting CDN.
 */

const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.sanaathrumylens.co.ke';
const CDN_API_KEY = process.env.CDN_API_KEY || '';

export interface CDNUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  folder: string;
  path: string;
}

export interface CDNDeleteResult {
  message: string;
  path: string;
}

export interface CDNListResult {
  files: Array<{
    url: string;
    path: string;
    filename: string;
    size: number;
    mimeType: string;
    modified: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Upload a file to the CDN
 */
export async function uploadToCDN(
  file: File | Buffer,
  options: {
    filename?: string;
    folder?: 'posts' | 'artists' | 'events' | 'profiles' | 'ads' | 'misc';
    mimeType?: string;
  } = {}
): Promise<CDNUploadResult> {
  const folder = options.folder || 'misc';

  const formData = new FormData();
  
  if (file instanceof File) {
    formData.append('file', file);
  } else {
    // Buffer → Blob → File
    const blob = new Blob([file]);
    const fileObj = new File([blob], options.filename || 'upload', {
      type: options.mimeType || 'image/jpeg',
    });
    formData.append('file', fileObj);
  }
  
  formData.append('folder', folder);

  const response = await fetch(`${CDN_BASE_URL}/api/upload.php`, {
    method: 'POST',
    headers: {
      'X-API-Key': CDN_API_KEY,
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.data as CDNUploadResult;
}

/**
 * Delete a file from the CDN
 */
export async function deleteFromCDN(path: string): Promise<CDNDeleteResult> {
  const response = await fetch(`${CDN_BASE_URL}/api/delete.php`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CDN_API_KEY,
    },
    body: JSON.stringify({ path }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Delete failed');
  }

  return result.data as CDNDeleteResult;
}

/**
 * List files on the CDN
 */
export async function listCDNFiles(options: {
  folder?: string;
  page?: number;
  limit?: number;
} = {}): Promise<CDNListResult> {
  const params = new URLSearchParams();
  if (options.folder) params.set('folder', options.folder);
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));

  const response = await fetch(`${CDN_BASE_URL}/api/list.php?${params}`, {
    method: 'GET',
    headers: {
      'X-API-Key': CDN_API_KEY,
    },
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'List failed');
  }

  return result.data as CDNListResult;
}

/**
 * Extract the relative path from a full CDN URL
 * e.g. "https://cdn.sanaathrumylens.co.ke/uploads/2025/05/posts/img.jpg"
 *   → "2025/05/posts/img.jpg"
 */
export function extractCDNPath(url: string): string | null {
  if (!url) return null;
  const prefix = `${CDN_BASE_URL}/uploads/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}

/**
 * Check if a URL is a CDN URL
 */
export function isCDNUrl(url: string): boolean {
  return url?.startsWith(CDN_BASE_URL) || false;
}
