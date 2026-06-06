/**
 * Create the "decks" storage bucket in Supabase for temporary file uploads.
 *
 * Run once per environment:
 *   npx tsx scripts/setup-storage.ts
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Checking storage buckets...\n");

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("❌ Could not list buckets:", listError.message);
    process.exit(1);
  }

  console.log("Existing buckets:", buckets?.map((b) => b.name).join(", ") || "(none)");

  await ensurePrivateBucket({
    supabase,
    buckets,
    name: "decks",
    label: "temporary deck uploads",
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/webp",
      "text/plain",
      "text/markdown",
    ],
  });

  await ensurePrivateBucket({
    supabase,
    buckets,
    name: "deliverables",
    label: "project deliverables",
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/msword",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "text/plain",
      "text/markdown",
    ],
  });

  console.log("\n✅ Storage setup complete!");
}

async function ensurePrivateBucket({
  supabase,
  buckets,
  name,
  label,
  allowedMimeTypes,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { storage: ReturnType<typeof createClient>["storage"] } & Record<string, any>;
  buckets: Array<{ name: string }> | null;
  name: string;
  label: string;
  allowedMimeTypes: string[];
}) {
  const bucket = buckets?.find((b) => b.name === name);
  if (bucket) {
    console.log(`\n✅ "${name}" bucket already exists.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(name, {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes,
  });

  if (error) {
    console.error(`❌ Could not create "${name}" bucket:`, error.message);
    process.exit(1);
  }

  console.log(`\n✅ Created "${name}" bucket (private, 20MB limit) for ${label}.`);
}

main();
