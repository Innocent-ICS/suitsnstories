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

  // Create "decks" bucket (private, temporary uploads)
  const decksBucket = buckets?.find((b) => b.name === "decks");
  if (decksBucket) {
    console.log('\n✅ "decks" bucket already exists.');
  } else {
    const { error } = await supabase.storage.createBucket("decks", {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024, // 20MB — generous for pitch decks
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

    if (error) {
      console.error('❌ Could not create "decks" bucket:', error.message);
      process.exit(1);
    }
    console.log('\n✅ Created "decks" bucket (private, 60MB limit).');
  }

  console.log("\n✅ Storage setup complete!");
}

main();
