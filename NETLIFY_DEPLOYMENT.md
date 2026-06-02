# Netlify Deployment Guide

## ✅ Pre-Deployment Checklist

Your project has been prepared for Netlify deployment with the following configurations:

### Installed & Verified
- ✅ All npm dependencies installed
- ✅ Build process working without errors
- ✅ TypeScript compilation successful
- ✅ No critical issues found

### Configuration Files Added
- ✅ `netlify.toml` - Build commands and deployment settings
- ✅ `.env.example` - Template for environment variables
- ✅ `.gitignore` - Prevents committing sensitive files
- ✅ `next.config.js` - Optimized for production

---

## 📋 Deployment Steps

### Step 1: Prepare Your Environment
1. Copy `.env.example` to `.env.local` if not already done
2. Ensure your Supabase credentials are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Upload to Netlify

#### Option A: Git-Based Deployment (Recommended)
1. Push your project to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Connect your repository
5. Netlify will auto-detect the Next.js setup
6. Set environment variables in Netlify Dashboard:
   - Go to Site Settings → Build & Deploy → Environment
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Deploy!

#### Option B: Manual Upload (ZIP)
1. Run `npm run build` locally to ensure it works
2. Zip the entire project folder
3. Go to [Netlify](https://app.netlify.com)
4. Drag and drop the ZIP file
5. Configure environment variables after deployment

### Step 3: Set Environment Variables
In Netlify Dashboard → Site Settings → Environment:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://your-supabase-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

### Step 4: Verify Deployment
1. Check deployment logs in Netlify Dashboard
2. Visit your deployed site
3. Test key features:
   - Landing page loads
   - Navigation works
   - Forms submit correctly
   - Payment flow initializes

---

## 🔧 Technical Details

### Build Configuration
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18+ (recommended)

### Security Headers
The `netlify.toml` includes:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Performance
- Static pages prerendered for fast loads
- Dynamic pages rendered on-demand
- Caching optimized for assets and static content

---

## ⚠️ Important Notes

1. **Environment Variables are PUBLIC**: `NEXT_PUBLIC_*` variables are exposed to the browser - they're meant for Supabase public keys only. Never put secrets here.

2. **Supabase Authentication**: Ensure your Supabase project allows anonymous access if needed, or configure proper auth rules.

3. **Browser Session Storage**: The app uses `sessionStorage` for temporary state. This works on Netlify.

4. **M-Pesa Integration**: If M-Pesa functions are enabled, ensure webhook URLs are properly configured in Supabase.

---

## 🚀 Next Steps

1. Add your actual Supabase credentials to Netlify environment variables
2. Test the deployed site thoroughly
3. Configure custom domain (if desired)
4. Set up branch previews for continuous integration
5. Monitor deployment logs for any runtime errors

---

## 📞 Troubleshooting

### Build Fails
- Check Node version (should be 18+)
- Verify all environment variables are set
- Check Netlify build logs for specific errors

### Site Won't Load
- Check browser console for errors
- Verify Supabase credentials are correct
- Check network tab for failed requests

### Features Not Working
- Check Supabase project is accessible
- Verify CORS settings
- Check Supabase auth configuration

---

## 📚 Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Netlify Next.js Plugin](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

---

**Your project is ready to deploy! 🎉**
