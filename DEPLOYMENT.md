# Deployment

## Vercel

Import the app folder (the folder containing `package.json`) as a Vite project. Use:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

The included `vercel.json` rewrites client-side routes to the Vite entry point so a shared quotation, change request, or client portal URL continues to work on refresh.

Add these environment variables to Vercel for **Production**, **Preview**, and **Development**:

- `VITE_SUPABASE_URL`: the Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable key; `VITE_SUPABASE_ANON_KEY` is also accepted for older projects

These are public browser configuration values. Never set a Supabase service-role key in a `VITE_` variable or ship it to the browser.

## Supabase database

Apply every migration in `supabase/migrations` to the same Supabase project before enabling connected-workspace features. In particular, the workflow additions dated `20261004` require the existing initial schema and phase migrations first. With the Supabase CLI installed and the correct project linked, run `supabase db push`; otherwise apply the pending migration files in order in the Supabase SQL editor.

The site-finance/client-portal migration creates contractor-bill validation and approval RPCs, stock-checked wastage logging, hashed expiring/revocable portal links, and a dedicated `client-portal-media` bucket. Images uploaded to that dedicated bucket are intentionally public-read; only upload images approved for client distribution. Existing private photos and documents are not copied or made public.

After deployment, verify a production and preview deployment with:

1. Refresh the app root and a shared-link URL containing `?quote=`, `?change=`, or `?portal=`.
2. Sign in and create a draft quotation, change request, contractor bill, and wastage entry in a non-production/test workspace.
3. Verify contractor submission rejects bills over remaining approved BOQ quantity or over the 10% BOQ cost-rate tolerance.
4. Create a client portal link, open it in a private browser, then revoke it and confirm the link no longer loads.
