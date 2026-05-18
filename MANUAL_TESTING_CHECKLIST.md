# Manual Testing Checklist After Secret Rotation

## ✅ Automated Tests Passed

All automated tests have passed:
- ✅ All 10 environment variables configured correctly
- ✅ Groq API authentication successful
- ✅ OpenRouter API authentication successful  
- ✅ PayStack API authentication successful

## Manual Testing Required

### 1. Authentication (Google OAuth) - **CRITICAL**

**What to test**: Google Sign-In functionality

**Steps**:
1. Open http://localhost:3000
2. Click "Sign In" or navigate to `/auth/signin`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Verify you're redirected back and logged in
6. Check that your profile information is displayed
7. Try signing out and signing back in

**Expected Result**: 
- ✅ OAuth flow completes without errors
- ✅ User is authenticated and session is created
- ✅ User data is stored in database

**If it fails**: 
- Check Google Cloud Console OAuth redirect URIs include `http://localhost:3000/api/auth/callback/google`
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

---

### 2. Perceptoscope / Pitch Diagnostic (AI Features) - **HIGH PRIORITY**

**What to test**: AI-powered pitch analysis using Groq/OpenRouter

**Steps**:
1. Navigate to `/diagnostic`
2. Fill out the pitch diagnostic form
3. Submit the form
4. Wait for AI analysis to complete
5. Verify results are displayed

**Expected Result**:
- ✅ Form submits successfully
- ✅ AI analysis completes without errors
- ✅ Results are displayed with insights

**If it fails**:
- Check GROQ_KEY or OPEN_ROUTER_KEY is valid
- Check browser console and server logs for errors

---

### 3. Payment Processing (PayStack) - **HIGH PRIORITY**

**What to test**: Course enrollment and payment flow

**Steps**:
1. Navigate to `/learn` or services page
2. Select a paid course or service
3. Click "Enroll" or "Purchase"
4. Complete payment form with test card:
   - Card: `4084084084084081`
   - CVV: `408`
   - Expiry: Any future date
   - PIN: `0000`
   - OTP: `123456`
5. Verify payment confirmation
6. Check enrollment status

**Expected Result**:
- ✅ Payment modal opens
- ✅ PayStack test payment completes
- ✅ User is enrolled/granted access
- ✅ Confirmation email sent (if configured)

**If it fails**:
- Verify PAYSTACK_SECRET_KEY starts with `sk_test_`
- Check PayStack dashboard for transaction logs

---

### 4. Database Operations - **CRITICAL**

**What to test**: All database read/write operations

**Steps**:
1. Sign up a new user account
2. Update user profile information
3. Create a new project (if applicable)
4. Save course progress
5. Submit contact form
6. Check admin dashboard

**Expected Result**:
- ✅ All CRUD operations work
- ✅ Data persists correctly
- ✅ No connection errors

**If it fails**:
- Check DATABASE_URL is correct
- Verify Supabase project is active
- Check connection pooling settings

---

### 5. File Uploads (Supabase Storage) - **MEDIUM PRIORITY**

**What to test**: File upload functionality

**Steps**:
1. Navigate to profile or project page
2. Try uploading an image/file
3. Verify file appears
4. Try deleting the file

**Expected Result**:
- ✅ Files upload successfully
- ✅ Files are accessible
- ✅ Delete operations work

**If it fails**:
- Check SUPABASE_SERVICE_ROLE_KEY is correct
- Verify storage bucket permissions in Supabase

---

### 6. Session Management - **MEDIUM PRIORITY**

**What to test**: User sessions with new AUTH_SECRET

**Steps**:
1. Sign in to the application
2. Navigate to different pages
3. Refresh the browser
4. Close and reopen browser
5. Verify session persists

**Expected Result**:
- ✅ Session remains active across page loads
- ✅ Session persists after browser restart (if "Remember me" checked)
- ✅ Logout works correctly

**If it fails**:
- AUTH_SECRET may need to be regenerated
- Clear browser cookies and try again

---

## Testing Priority Order

### Immediate (Test Now):
1. ✅ **Automated API Tests** - PASSED
2. 🔲 **Google OAuth Sign-In** - Test manually
3. 🔲 **Database Operations** - Test manually

### High Priority (Test Before Deploy):
4. 🔲 **AI/Perceptoscope Features** - Test manually
5. 🔲 **PayStack Payments** - Test manually

### Medium Priority (Test When Convenient):
6. 🔲 **File Uploads** - Test manually
7. 🔲 **Session Management** - Test manually

---

## Quick Test Commands

```bash
# Run automated tests
node scripts/test-secrets.mjs

# Start dev server
npm run dev

# Check build works
npm run build

# Run all tests
npm run test
```

---

## What Features Use Which Secrets

| Feature | Secrets Used |
|---------|-------------|
| Google Sign-In | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` |
| Pitch Diagnostic/AI | `GROQ_KEY` or `OPEN_ROUTER_KEY` |
| Payments | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` |
| Database | `DATABASE_URL` |
| File Storage | `SUPABASE_SERVICE_ROLE_KEY` |
| Sessions | `AUTH_SECRET` |
| All Features | `NEXT_PUBLIC_APP_URL` |

---

## Troubleshooting

### Google OAuth Not Working
- Verify redirect URI in Google Cloud Console
- Check client ID and secret are correct
- Clear browser cookies and try again

### AI Features Not Working
- Check API key is valid in provider dashboard
- Verify API has available credits/quota
- Check server logs for detailed errors

### Payment Failures
- Ensure using test mode keys (`sk_test_` prefix)
- Use PayStack test cards
- Check PayStack dashboard for transaction logs

### Database Connection Issues
- Verify DATABASE_URL format is correct
- Check Supabase project is active
- Ensure connection pooling is enabled

---

## ✅ Testing Complete Checklist

- [ ] Automated tests passed
- [ ] Google OAuth sign-in works
- [ ] Database operations work
- [ ] AI/Perceptoscope features work
- [ ] Payment processing works
- [ ] File uploads work
- [ ] Sessions persist correctly
- [ ] No console errors
- [ ] No server errors in logs

**Once all items are checked, you're ready to deploy! 🚀**
