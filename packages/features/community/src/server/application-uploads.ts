import 'server-only';

import { randomUUID } from 'crypto';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import type { FormKind } from '../form-fields';

export const APPLICATION_UPLOADS_BUCKET = 'application-uploads';

/** Hard ceiling regardless of per-field config (defence in depth). */
export const MAX_UPLOAD_SIZE_MB = 15;

function sanitizeFilename(name: string): string {
  const trimmed = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-');
  const safe = trimmed.replace(/^[-.]+/, '').slice(0, 80);
  return safe || 'upload';
}

export type SignedUploadRequest = {
  form: FormKind;
  fieldId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  accept?: string[];
  maxSizeMb?: number;
};

export type SignedUploadResult =
  | { ok: true; bucket: string; path: string; token: string }
  | { ok: false; error: string };

function contentTypeAllowed(contentType: string, accept?: string[]): boolean {
  if (!accept || accept.length === 0) return true;
  const ct = contentType.toLowerCase();
  return accept.some((entry) => {
    const a = entry.toLowerCase();
    if (a.endsWith('/*')) return ct.startsWith(a.slice(0, -1));
    return ct === a;
  });
}

/** Validate the declared file and mint a short-lived signed upload URL/token. */
export async function createSignedUploadUrl(
  request: SignedUploadRequest,
): Promise<SignedUploadResult> {
  const cap = Math.min(request.maxSizeMb ?? MAX_UPLOAD_SIZE_MB, MAX_UPLOAD_SIZE_MB);
  if (request.sizeBytes <= 0) return { ok: false, error: 'Empty file.' };
  if (request.sizeBytes > cap * 1024 * 1024) {
    return { ok: false, error: `File is too large (max ${cap} MB).` };
  }
  if (!contentTypeAllowed(request.contentType, request.accept)) {
    return { ok: false, error: 'File type is not allowed.' };
  }

  const path = `${request.form}/${request.fieldId}/${randomUUID()}/${sanitizeFilename(request.filename)}`;

  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin.storage
    .from(APPLICATION_UPLOADS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error('Failed to create signed upload URL:', error);
    return { ok: false, error: 'Could not start the upload. Try again.' };
  }

  return {
    ok: true,
    bucket: APPLICATION_UPLOADS_BUCKET,
    path: data.path,
    token: data.token,
  };
}

/** Short-lived signed download URL for admin review of an uploaded file. */
export async function getSignedUrlForApplicationFile(
  path: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  if (!path) return null;
  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin.storage
    .from(APPLICATION_UPLOADS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    console.error('Failed to sign application file URL:', error);
    return null;
  }
  return data.signedUrl;
}
