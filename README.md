# Touchline — deploy guide

No coding tools needed on your end — just a browser.

## 1. Put the code on GitHub

1. Go to github.com and sign in (or create a free account).
2. Click **New repository**. Name it `touchline`. Private is fine. Click **Create repository**.
3. On the new repo page, click **uploading an existing file**.
4. Unzip `touchline-app.zip` on your computer, then drag in everything **except** the `.env` file
   (keep the `src` and `public` folders as folders — most browsers support dragging folders in).
5. Commit the files.

## 2. Deploy on Vercel

1. Go to vercel.com and sign in with your GitHub account.
2. Click **Add New Project**, select the `touchline` repo. Vercel will auto-detect it's a Vite app.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → `https://rdbpfttnipornarkbgif.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → (the long `anon` key from Supabase → Project Settings → API)
4. Click **Deploy**. Wait about a minute — you'll get a live URL like `touchline-yourname.vercel.app`.

## 3. Install it on your phone

1. Open the Vercel URL on your phone.
2. **iPhone:** tap the Share icon → **Add to Home Screen**.
3. **Android:** tap the ⋮ menu → **Install app** (or you'll see an install banner).
4. It now opens full-screen from its own icon, like any other app.

## First login

The very first person to create an account (New Coach tab) automatically becomes the admin.
Everyone after that signs up the same way, and the admin can grant them access to shared
squads from the Admin tab.

## Notes

- Removing a coach in the Admin tab removes their access to shared data, but their login
  itself isn't deleted (that requires a server-side step this app doesn't include yet).
- If you ever change your Supabase database password or regenerate keys, update the
  environment variables in Vercel (Project → Settings → Environment Variables) and redeploy.
