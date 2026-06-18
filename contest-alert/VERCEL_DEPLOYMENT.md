# Deploying Contest Alert to Vercel

Follow these steps to deploy the Contest Alert platform to Vercel.

## 1. Prepare Supabase for Production

Before deploying the frontend, ensure your Supabase project is production-ready:
- **Clean the Database**: Run `supabase/wipe_database.sql` in your Supabase SQL Editor.
- **Set Up Auth Providers**: If using Google/Microsoft logins, ensure you have configured your OAuth credentials in the Supabase Dashboard -> Authentication -> Providers. Add your production Vercel domain to the allowed callback URLs (e.g., `https://contestalert.vercel.app/auth/callback`).
- **Empty Storage**: Manually delete test files from the `event-covers` and `payment-qrs` buckets in the Storage UI.

## 2. Push Code to GitHub

Ensure all your latest changes are pushed to your GitHub repository:
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## 3. Import Project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select your Contest Alert repository.
3. Keep the default settings (Framework Preset: Next.js).

## 4. Configure Environment Variables

In the Vercel deployment settings, expand the **Environment Variables** section and add all keys from your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend (Emails)
RESEND_API_KEY=your_resend_api_key

# Security & Cron
CRON_SECRET=a_secure_random_string_you_generate
```
*Tip: You can generate a `CRON_SECRET` using `openssl rand -base64 32` or any password generator.*

## 5. Deploy!

Click **Deploy**. Vercel will build the Next.js app and assign it a domain (e.g., `https://your-repo-name.vercel.app`).

## 6. Configure Vercel Cron Jobs (Optional but Recommended)

To automate the background tasks (archiving old events, deleting old images, and sending backup alerts), Vercel needs to be configured to hit your `/api/cron` endpoint.

Vercel reads `vercel.json` automatically, which is already configured in the root directory. However, to authorize Vercel Cron jobs:
1. Go to your project settings in Vercel.
2. Ensure `CRON_SECRET` is set in your Environment Variables. Vercel automatically passes `CRON_SECRET` as a Bearer token when executing cron jobs.

That's it! Your platform is live.
