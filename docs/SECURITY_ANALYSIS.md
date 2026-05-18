# Suits & Stories Security Analysis

Last reviewed: 2026-05-18

This document covers the current application security posture, the main threat surfaces, controls already present in the codebase, and deployment hardening work that should be completed before production launch.

## System Overview

Suits & Stories is a Next.js 16 application with:

- NextAuth authentication with Google and credentials providers.
- Prisma/Postgres persistence, currently configured for Supabase Postgres.
- Paystack checkout and webhook fulfillment.
- Resend transactional email.
- Supabase service-role storage helper for server-side uploads.
- Perceptoscope AI analysis using Groq and/or OpenRouter.
- Project collaboration, comments, deliverables, and invitation links.

Primary sensitive assets:

- User accounts and sessions.
- Project briefs, deliverables, comments, and pitch decks.
- Payment records and Paystack references.
- AI provider keys, Supabase service-role key, auth secret, OAuth secrets.
- Invitation tokens and collaborator permissions.
- Course content used as Perceptoscope knowledge context.

## Threat Model

Likely actors:

- Anonymous internet users probing public routes.
- Authenticated users attempting horizontal privilege escalation.
- Invited collaborators with limited permissions.
- Malicious users uploading adversarial files or prompt-injection decks.
- Bots attempting credential stuffing, spam, or payment webhook spoofing.
- Third-party service compromise or accidental credential exposure.

High-impact failure modes:

- A user accesses another company or founder's project.
- A viewer/commenter gets editor-level capabilities.
- Raw pitch decks or hidden security checks leak to users or model logs.
- Uploaded files trigger active content, resource exhaustion, or prompt injection.
- Paystack webhook spoofing creates false enrollments/bookings.
- Environment secrets are exposed to the browser or committed to Git.
- Invite links grant broader access than intended.

## Current Controls

Authentication and session control:

- Platform routes use server-side `auth()` and redirect unauthenticated users.
- Roles are stored in Prisma and used for admin/program/project access decisions.
- NextAuth uses JWT sessions and `AUTH_SECRET`.
- Auth POSTs and credential signup are rate limited using hashed request identifiers.

Authorization:

- Project access checks compare owner, assigned coach, admin, and collaborator role.
- Commenting is limited to owner, coach, admin, editor, and commenter.
- Editing/deliverable upload is limited to owner, admin, and editor.
- Invite creation is limited to owner, admin, and editor.
- Invite links are hashed server-side; plaintext tokens are only present in the URL.
- Company-scoped invite links validate company profile or email domain at acceptance.
- Broad invite links require a verified email before acceptance.
- Active project invitations and per-user invite creation are capped, and expired/stale invites can be cleaned by a protected cron endpoint.

Payments:

- Paystack webhooks validate `x-paystack-signature` before fulfillment.
- Webhook fulfillment is idempotent through existing payment references.
- Payment verification is rate limited, and fulfillment/failed webhook events are written to structured security audit logs.

Files and AI:

- Uploads are validated by MIME/extension and magic header.
- Raw Perceptoscope files are processed in memory/temp storage and not persisted as deck blobs.
- PDF preprocessing uses Ghostscript where available to create a compressed analysis artifact and low-resolution page images.
- PPTX/DOCX extraction reads OpenXML text and selectively compresses image samples.
- The AI prompt treats deck contents as untrusted evidence and blocks deck-provided instructions.
- Internal checks cover prompt injection, jailbreak language, data exfiltration requests, likely secrets, payment-card-like data, active PDF markers, Office macro/ActiveX/OLE/external-link indicators, external URLs, and large-file processing paths.
- Guardrail/security internals are stored for operator review but are not returned through public diagnosis payloads.
- Perceptoscope uploads are rate limited, scheduled with Next `after()`, and degrade to a structured fallback report when a specialist or orchestrator model pass fails.
- Admins have an internal Perceptoscope security view for guardrail findings and failed agent runs.

Browser and transport:

- `next.config.ts` sets common security headers, including HSTS, `nosniff`, frame protection, referrer policy, and permissions policy.
- `next.config.ts` also sets a Content Security Policy with explicit app, Paystack, model-provider, Google image, and Supabase connection allowances.
- Next.js/Vercel should terminate HTTPS in production.

Input handling:

- Server actions use Zod validation for project creation, comments, invitations, and program flows.
- Prisma parameterization avoids direct SQL injection in normal queries.
- Email template values are escaped for project invite emails.
- Same-origin checks are applied to high-risk mutation actions and upload routes, while server-side permission checks remain the primary authorization boundary.
- Security audit logs store redacted metadata and hashed IP/email-style identifiers.
- Dependency scanning is configured through Dependabot and a GitHub Actions `npm audit --omit=dev --audit-level=high` workflow.

## Security Gaps To Close Before Production

Required before production:

- Configure the protected invite-cleanup cron with `CRON_SECRET` in production.
- Use private storage buckets for future deliverable uploads; avoid public Supabase URLs for confidential decks. The storage helper now supports private uploads/signed URLs and the generic upload API is restricted to public course thumbnails.
- Add malware scanning for persisted files if the product later stores deck uploads or deliverables.
- Confirm production Ghostscript availability or move file preprocessing to a worker/runtime that includes the binary.
- Run Prisma migrations from CI/CD using a DB user intended for migrations, not the application runtime user.

Recommended soon:

- Add organization/company membership verification if company-scoped collaboration becomes high-stakes.
- Add backup/restore drills for Supabase Postgres.
- Add tests for horizontal access control: owner, viewer, commenter, editor, coach, admin, and non-member.

## Perceptoscope Privacy Notes

Design intent:

- Preserve content needed for diagnosis while minimizing unnecessary heavy graphics and avoiding raw file persistence.
- Keep security/guardrail findings internal so adversarial users are not taught which checks fired.
- Never fetch URLs embedded inside decks.
- Treat every extracted string, speaker note, and OCR result as untrusted input.
- Prefer compressed PDF artifacts and low-resolution page renderings over full-resolution assets.

Important limitation:

- Compressing files can reduce visual fidelity. The current design keeps extractable text, slide structure, compressed PDF payloads when within cap, and low-resolution page samples. For investor decks where visuals carry meaning, the compressed PDF or page renderings should remain available to the model. If a provider payload cap forces omission of the PDF, the system should tell the user only that the deck could not be fully analyzed, not which guardrails or checks were involved.

## Deployment Security Checklist

- Set all secrets only in the deployment provider's encrypted environment settings.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GROQ_KEY`, `OPEN_ROUTER_KEY`, `AUTH_SECRET`, Google OAuth secret, or Resend key to the browser.
- Only variables prefixed with `NEXT_PUBLIC_` should be considered public.
- Rotate all production keys after any accidental exposure.
- Set `NEXT_PUBLIC_APP_URL` to the production origin exactly, for example `https://example.com`.
- Configure OAuth redirect URLs for the exact production domain.
- Configure Paystack webhook URL for the exact production domain.
- Verify Paystack signatures before processing webhooks.
- Use Supabase transaction pooler connection strings for serverless runtime where appropriate, and a migration-safe connection for `prisma migrate deploy`.
- Use private Supabase buckets for confidential uploads.
- Add DNS SPF/DKIM/DMARC for production email.
- Enable branch protection, required checks, and least-privilege GitHub access.

## Reference Links

- Next.js security headers: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
- Vercel custom domains: https://vercel.com/docs/domains/set-up-custom-domain
- Supabase Prisma guide: https://supabase.com/docs/guides/database/prisma
- Supabase connection strings: https://supabase.com/docs/reference/postgres/connection-strings
- Paystack webhook signature verification: https://paystack.com/docs/payments/webhooks
- Resend domain verification: https://resend.com/docs/dashboard/domains/introduction
