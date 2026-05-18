import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side Supabase client using the service role key.
 * This bypasses RLS and is used for admin operations like file uploads.
 * NEVER expose this client to the browser.
 */
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!supabaseAdmin) {
  console.warn("[SUPABASE] SUPABASE_SERVICE_ROLE_KEY is not set. Storage uploads will be disabled.");
}

/**
 * Upload a public file to an explicitly public Supabase Storage bucket.
 * Do not use for confidential decks or deliverables.
 */
export async function uploadPublicFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error("[STORAGE] Supabase not configured — cannot upload");
    return null;
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("[STORAGE] Upload failed:", error);
    return null;
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a private file and return its storage path.
 * Call createSignedFileUrl when a short-lived read URL is needed.
 */
export async function uploadPrivateFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error("[STORAGE] Supabase not configured — cannot upload");
    return null;
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "private, max-age=0",
      upsert: true,
    });

  if (error) {
    console.error("[STORAGE] Private upload failed:", error);
    return null;
  }

  return path;
}

export async function createSignedFileUrl(bucket: string, path: string, expiresInSeconds = 60 * 10) {
  if (!supabaseAdmin) {
    console.error("[STORAGE] Supabase not configured — cannot sign URL");
    return null;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    console.error("[STORAGE] Signed URL failed:", error);
    return null;
  }

  return data.signedUrl;
}

export const uploadFile = uploadPublicFile;

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error("[STORAGE] Supabase not configured — cannot delete");
    return false;
  }

  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) {
    console.error("[STORAGE] Delete failed:", error);
    return false;
  }
  return true;
}
