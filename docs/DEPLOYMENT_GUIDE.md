# Suits & Stories Deployment Guide

Last reviewed: 2026-05-18

This guide assumes a Vercel deployment, Supabase Postgres, Paystack payments, Resend email, Google OAuth, and Groq/OpenRouter for Perceptoscope. The same sequence can be adapted to another Node-compatible host, but Vercel is the shortest path for this Next.js app.

## 1. Production Accounts

Create or confirm access to:

- GitHub repository.
- Vercel account.
- Supabase project.
- Paystack live account.
- Resend account.
- Google Cloud OAuth client.
- Groq and/or OpenRouter API keys.
- Domain registrar DNS access.

## 2. Database Setup

Supabase:

1. Create a production Supabase project.
2. Create a dedicated Prisma database user rather than using the default superuser for everything.
3. In Supabase, copy:
   - Session pooler connection string for migrations and persistent operations.
   - Transaction pooler connection string for serverless runtime if you choose to separate runtime and migrations.
4. Set `DATABASE_URL` in Vercel.
5. If you add a separate migration connection later, update `prisma/schema.prisma` to include `directUrl = env("DIRECT_URL")` and set `DIRECT_URL`.

Migration command:

```bash
npx prisma migrate deploy
npx prisma generate
```

Production rule:

- Use `prisma migrate deploy`, not `prisma migrate dev`, against production.
- Run migrations before routing real users to the new deployment.

## 3. Environment Variables

Set these in Vercel Project Settings → Environment Variables for Production:

```bash
AUTH_SECRET=
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
RESEND_API_KEY=
EMAIL_FROM=Suits & Stories <hello@yourdomain.com>
GROQ_KEY=
OPEN_ROUTER_KEY=
PERCEPTOSCOPE_GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
PERCEPTOSCOPE_OPENROUTER_MODEL=nvidia/nemotron-nano-12b-v2-vl:free
```

Notes:

- Only `NEXT_PUBLIC_*` variables are safe for browser exposure.
- `SUPABASE_SERVICE_ROLE_KEY`, payment keys, OAuth secrets, email keys, and model provider keys must remain server-only.
- Generate `AUTH_SECRET` with a cryptographically strong random value.
- Add the same variables to Preview only when preview deployments need full integration access.

## 4. Vercel Project Setup

1. Import the GitHub repository into Vercel.
2. Framework preset: Next.js.
3. Build command:

```bash
npm run build
```

4. Install command:

```bash
npm install
```

5. Add a production deploy hook only if you need external redeploy triggers.
6. Deploy once after environment variables are set.

If Prisma Client generation ever fails during build, add a postinstall script:

```json
"postinstall": "prisma generate"
```

Do this only if Vercel build logs show Prisma Client generation is missing.

## 5. Domain Connection

In Vercel:

1. Open Project → Settings → Domains.
2. Add `yourdomain.com`.
3. Add `www.yourdomain.com`.
4. Choose the primary domain and redirect the alternate domain to it.

At your DNS provider:

- Apex/root domain: add an `A` record pointing to `76.76.21.21`.
- `www` subdomain: add a `CNAME` record pointing to `cname.vercel-dns-0.com`.

Then:

1. Wait for DNS propagation.
2. Confirm Vercel shows the domain as valid.
3. Set `NEXT_PUBLIC_APP_URL=https://yourdomain.com`.
4. Redeploy after changing `NEXT_PUBLIC_APP_URL`.

Vercel says DNS propagation can take time; plan up to 24 hours even though it is often faster.

## 6. Google OAuth

In Google Cloud Console:

1. Create or open the production OAuth client.
2. Add authorized JavaScript origin:

```text
https://yourdomain.com
```

3. Add authorized redirect URI:

```text
https://yourdomain.com/api/auth/callback/google
```

4. Copy client ID/secret into Vercel.
5. Redeploy.

Test:

- Sign in with Google.
- Confirm user record is created in production database.
- Confirm dashboard loads.

## 7. Paystack Live Setup

In Paystack:

1. Switch to live mode.
2. Copy live secret/public keys into Vercel.
3. Configure webhook URL:

```text
https://yourdomain.com/api/payment/webhook
```

4. Confirm webhook signature verification remains enabled in code.
5. Run a low-value live transaction or Paystack-supported test path for your account.

Expected result:

- Checkout initializes.
- Payment verifies.
- Webhook receives `charge.success`.
- Course/program/booking fulfillment happens exactly once.

## 8. Resend Email Domain

Recommended sender:

```text
hello@yourdomain.com
```

Steps:

1. Add the domain or a sending subdomain in Resend.
2. Add SPF and DKIM DNS records from Resend.
3. Add DMARC at the domain or subdomain.
4. Set `RESEND_API_KEY`.
5. Set `EMAIL_FROM`.
6. Send a test project invitation and signup email.

If your root domain already handles business email, use a subdomain such as `mail.yourdomain.com` or `updates.yourdomain.com` for sending reputation isolation.

## 9. Supabase Storage

Current app usage:

- Server-side helper uses the Supabase service-role key.
- Course thumbnail uploads are admin-only.

Before storing confidential decks or deliverables:

1. Use private buckets.
2. Generate short-lived signed URLs for download.
3. Enforce file type and size checks per route.
4. Add malware scanning if files are persisted.
5. Never expose service-role keys to the browser.

## 10. Perceptoscope Runtime

Requirements:

- `GROQ_KEY` or `OPEN_ROUTER_KEY`.
- A runtime that can execute Node.js route handlers.
- For best PDF compression: Ghostscript available in the runtime.

If deploying to Vercel serverless, verify whether Ghostscript is available. If not, the app still falls back to local JS extraction and image sampling, but PDF compression quality will be lower. For high-volume production use, move Perceptoscope jobs to a worker environment where Ghostscript and any OCR helpers are explicitly installed.

Recommended next production architecture:

- Upload request creates a queued job.
- Worker performs preprocessing and model calls.
- UI polls job status.
- Raw files remain ephemeral or go to private encrypted storage with short TTL.

## 11. Production Smoke Test

After deployment:

1. Open `https://yourdomain.com`.
2. Sign up with email.
3. Sign in with Google.
4. Create a project.
5. Create an email invite to a non-company address with `View`.
6. Create a company-only link with `Comment`.
7. Accept invite from the correct account.
8. Confirm viewer cannot comment/edit.
9. Confirm commenter can comment but cannot edit/upload deliverables.
10. Confirm editor can comment/edit/upload deliverables.
11. Run Perceptoscope on:
    - text-light PDF
    - image-heavy PDF
    - PPTX
12. Confirm no guardrail/security internals appear in UI or API payload.
13. Complete a Paystack checkout.
14. Confirm webhook fulfillment.
15. Confirm Resend emails arrive and pass SPF/DKIM.

## 12. Rollback Plan

Before each production migration:

1. Confirm recent Supabase backup.
2. Save the deployment URL of the last known good Vercel production build.
3. Run migrations.
4. Deploy.
5. Smoke test.

If deployment fails:

- Roll back to the previous Vercel deployment.
- If a migration was applied, do not casually revert the database. Apply a forward fix unless the migration was explicitly designed to be reversible and no production writes occurred.

## 13. Monitoring

Add:

- Vercel runtime/build logs.
- Supabase database logs and slow query review.
- Paystack webhook delivery monitoring.
- Resend bounce/complaint monitoring.
- Error tracking such as Sentry.
- Audit logs for project invites, role changes, payments, and analysis failures.

## 14. Official References

- Vercel custom domains: https://vercel.com/docs/domains/set-up-custom-domain
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
- Supabase Prisma guide: https://supabase.com/docs/guides/database/prisma
- Supabase connection strings: https://supabase.com/docs/reference/postgres/connection-strings
- Paystack webhooks: https://paystack.com/docs/payments/webhooks
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- Next.js headers: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
