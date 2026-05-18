# 🚀 Deployment Checklist - Suits & Stories

## Pre-Deployment ✓

- [x] Build passes locally (`npm run build`)
- [x] Tests pass (`npm run test`)
- [x] CI/CD workflow created (`.github/workflows/ci.yml`)
- [x] Environment variables documented (`.env.example`)
- [ ] All changes committed to git
- [ ] Code pushed to GitHub

## Vercel Setup

### Account Setup
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Connect GitHub account to Vercel

### Project Import
- [ ] Import `Innocent-ICS/suitsnstories` repository
- [ ] Verify framework preset is "Next.js"
- [ ] Keep default build settings

### Environment Variables (Copy from .env.local)
- [ ] `AUTH_SECRET`
- [ ] `DATABASE_URL`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `PAYSTACK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (update after first deploy)
- [ ] `GROQ_KEY`
- [ ] `OPEN_ROUTER_KEY`

### First Deployment
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Note your deployment URL (e.g., `suitsnstories.vercel.app`)

## Post-Deployment Configuration

### Update Environment Variables
- [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel with your production URL
- [ ] Trigger redeploy in Vercel Dashboard

### Update OAuth Settings
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
- [ ] Save changes

### Database Configuration
- [ ] Verify Supabase connection works from Vercel
- [ ] Check database connection pooling is enabled
- [ ] Test authentication flow

### Payment Gateway
- [ ] Verify PayStack webhook URL if needed
- [ ] Test payment flow in production
- [ ] Switch to live keys when ready (currently using test keys)

## Testing Production

### Functionality Tests
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] User authentication (sign up/sign in)
- [ ] Course enrollment
- [ ] Contact form submission
- [ ] Payment processing (test mode)
- [ ] Admin dashboard access
- [ ] File uploads work

### Performance Tests
- [ ] Check Lighthouse score
- [ ] Verify images load properly
- [ ] Test mobile responsiveness
- [ ] Check page load times

## Monitoring Setup (Optional but Recommended)

- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up deployment notifications

## Custom Domain (Optional)

- [ ] Purchase domain (if not already owned)
- [ ] Add domain in Vercel Dashboard
- [ ] Configure DNS records
- [ ] Wait for SSL certificate provisioning
- [ ] Update `NEXT_PUBLIC_APP_URL` to custom domain
- [ ] Update OAuth redirect URLs to custom domain

## Documentation

- [ ] Update README with production URL
- [ ] Document deployment process for team
- [ ] Create runbook for common issues

## Security

- [ ] Verify all secrets are in environment variables (not in code)
- [ ] Check `.gitignore` includes `.env.local`
- [ ] Review security headers
- [ ] Enable Vercel's security features

## Ready to Deploy? 🎉

Run these commands:

```bash
# 1. Commit all changes
git add .
git commit -m "chore: prepare for production deployment"

# 2. Push to GitHub
git push origin main

# 3. Go to vercel.com and import your project
# Follow the steps in DEPLOYMENT.md
```

## Quick Deploy Commands

```bash
# After initial setup, deploy with:
git add .
git commit -m "your commit message"
git push origin main

# Vercel will automatically deploy!
```

## Rollback Plan

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Your site will rollback immediately

## Support Resources

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Deployment Guide**: See `DEPLOYMENT.md` for detailed instructions

---

**Current Status**: Ready for deployment ✅
**Build Status**: Passing ✅
**Tests**: Passing ✅
