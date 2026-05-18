# Deployment Guide - Suits & Stories

This guide will walk you through deploying your Next.js application to Vercel with automatic CI/CD.

## Prerequisites

- GitHub account (you already have this ✓)
- Vercel account (free tier available)
- All environment variables ready

## Step 1: Prepare Your Repository

### 1.1 Commit Current Changes

```bash
git add .
git commit -m "chore: prepare for deployment with CI/CD"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for First Deploy)

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com)

2. **Sign Up/Login**: Use your GitHub account to sign in

3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `Innocent-ICS/suitsnstories`
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Add Environment Variables**:
   Click "Environment Variables" and add each variable from your `.env.local`:

   **Copy the values from your local `.env.local` file for:**
   - `AUTH_SECRET` - Your NextAuth secret
   - `DATABASE_URL` - Your Supabase/PostgreSQL connection string
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `SUPABASE_SERVICE_ROLE_KEY` - From Supabase dashboard
   - `PAYSTACK_SECRET_KEY` - From PayStack dashboard
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - From PayStack dashboard
   - `NEXT_PUBLIC_APP_URL` - Set to `https://your-app.vercel.app` (update after first deploy)
   - `GROQ_KEY` - Your Groq API key
   - `OPEN_ROUTER_KEY` - Your OpenRouter API key

   **Important**: 
   - Copy exact values from your `.env.local` file
   - Update `NEXT_PUBLIC_APP_URL` after deployment with your actual Vercel URL

6. **Deploy**: Click "Deploy" and wait for the build to complete (usually 2-3 minutes)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? suitsnstories
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

## Step 3: Post-Deployment Configuration

### 3.1 Update OAuth Redirect URLs

After deployment, update your Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth 2.0 Client
3. Add authorized redirect URIs:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

### 3.2 Update Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your production URL
3. Redeploy to apply changes

### 3.3 Configure Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Step 4: Automatic CI/CD Setup

Your CI/CD is now automatically configured! Here's what happens:

### GitHub Actions (CI)
- **Triggers**: On every push to `main` and on pull requests
- **Actions**:
  - Runs linter (`npm run lint`)
  - Runs tests (`npm run test`)
  - Builds the application
  - Runs security audit

### Vercel (CD)
- **Triggers**: On every push to any branch
- **Actions**:
  - **Main branch**: Deploys to production
  - **Other branches**: Creates preview deployment
  - **Pull requests**: Creates preview deployment with comment

### Workflow

```
Developer pushes code
    ↓
GitHub Actions runs CI checks
    ↓
If checks pass → Vercel deploys automatically
    ↓
Production live at your-app.vercel.app
```

## Step 5: Verify Deployment

1. **Check Build Logs**: In Vercel Dashboard → Deployments → View logs
2. **Test Your Site**: Visit your production URL
3. **Check Functionality**:
   - [ ] Homepage loads
   - [ ] Authentication works
   - [ ] Database connections work
   - [ ] Payment integration works
   - [ ] Contact form works

## Monitoring & Maintenance

### View Deployment Status
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **GitHub Actions**: Your repo → Actions tab

### Rollback a Deployment
1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

### View Logs
- **Build Logs**: Vercel Dashboard → Deployment → Build Logs
- **Runtime Logs**: Vercel Dashboard → Deployment → Functions

## Troubleshooting

### Build Fails
1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`

### Environment Variables Not Working
1. Ensure variables are added in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check Supabase allows connections from Vercel IPs
3. Ensure connection pooling is enabled

## Next Steps

- [ ] Set up custom domain
- [ ] Configure production database
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure error tracking (Sentry)
- [ ] Set up staging environment
- [ ] Configure branch deployments

## Useful Commands

```bash
# View deployment status
vercel ls

# View logs
vercel logs

# Promote deployment to production
vercel promote <deployment-url>

# Remove deployment
vercel rm <deployment-name>
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
