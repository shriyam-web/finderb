# User sign-in with Google & social OAuth (FinderB)

FinderB user accounts (`/login`, `/signup`) support **Google**, **Apple**, and **GitHub** via **Supabase Auth**, while keeping your existing `User` table and `user_id` session cookie.

## How it works

1. Merchant clicks **Continue with Google** (or Apple / GitHub).
2. Supabase handles the OAuth redirect.
3. `/auth/callback` exchanges the code, creates or links a row in `User`, sets the `user_id` cookie, and redirects to the dashboard.
4. Email/password sign-in continues to work for users who registered that way.

---

## Step 1 — Run the database migration

In **Supabase → SQL Editor**, run:

```
supabase/user_oauth.sql
```

This adds `authProvider`, `avatarUrl`, and `supabaseAuthId` to the `User` table.

---

## Step 2 — Configure redirect URLs in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to your production URL, e.g. `https://finderb.com`
4. Add **Redirect URLs** (all environments you use):

| Environment | Redirect URL |
|-------------|----------------|
| Local dev | `http://localhost:3000/auth/callback` |
| Production | `https://finderb.com/auth/callback` |
| Preview (Vercel) | `https://your-preview.vercel.app/auth/callback` |

---

## Step 3 — Enable Google OAuth

### A. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services** → **OAuth consent screen**
   - User type: **External** (or Internal for workspace-only)
   - App name: `FinderB`
   - Support email: your email
   - Authorized domains: `finderb.com` (and `vercel.app` if using previews)
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `FinderB Web`
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://finderb.com`
   - **Authorized redirect URIs** (Supabase callback — not your Next.js URL):
     - `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**.

### B. Supabase Dashboard

1. **Authentication** → **Providers** → **Google**
2. Enable Google.
3. Paste **Client ID** and **Client Secret**.
4. Save.

---

## Step 4 — Enable Apple (optional, recommended for iOS users)

1. [Apple Developer](https://developer.apple.com/) → **Certificates, Identifiers & Profiles**
2. Create a **Services ID** and configure **Sign in with Apple**.
3. Set redirect URL to: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
4. Create a **Key** for Sign in with Apple.
5. In Supabase → **Authentication** → **Providers** → **Apple** → enable and paste:
   - Services ID
   - Secret Key
   - Key ID
   - Team ID

Apple requires a paid Apple Developer account ($99/year).

---

## Step 5 — Enable GitHub (optional)

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Homepage URL: `https://finderb.com`
3. Authorization callback URL: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
4. Copy Client ID and generate Client Secret.
5. Supabase → **Authentication** → **Providers** → **GitHub** → enable and paste credentials.

---

## Step 6 — Environment variables

Add to `.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Comma-separated list of providers to show on login/signup UI
NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=google,apple,github
```

- Remove providers you have not configured (e.g. only `google` until Apple/GitHub are set up).
- `SUPABASE_SERVICE_ROLE_KEY` is optional but recommended for reliable OAuth user creation under RLS.

---

## Step 7 — Test locally

1. `npm run dev`
2. Open `http://localhost:3000/login`
3. Click **Continue with Google**
4. Complete Google sign-in → you should land on `/dashboard`
5. Check Supabase **Table Editor** → `User` → new row with `authProvider = google`

### Test checklist

- [ ] Google sign-up (new email) → dashboard
- [ ] Google sign-in (same email) → dashboard
- [ ] Email/password sign-up still works
- [ ] Email already used as **merchant** → error with link to merchant login
- [ ] Sign out and sign in again with Google

---

## Production checklist

- [ ] `user_oauth.sql` applied on production Supabase
- [ ] Site URL + redirect URLs include production domain
- [ ] Google OAuth client uses **live** domain in authorized origins
- [ ] `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS` set on Vercel
- [ ] OAuth consent screen published (Google) if app is External

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirects to login with `oauth_exchange_failed` | Check `/auth/callback` is in Supabase redirect URLs |
| `redirect_uri_mismatch` from Google | Add `https://<project>.supabase.co/auth/v1/callback` in Google Console |
| OAuth buttons missing | Set `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS` and Supabase URL/anon key |
| “Registered as merchant” error | Email belongs to a business account — use `/business/login` |
| User row not created | Run `user_oauth.sql`; check RLS allows insert or set service role key |

---

## Security notes

- OAuth users get a random hashed password they never see (password login disabled for them unless they set a password later).
- Supabase Auth session is cleared after callback; FinderB uses the existing `user_id` httpOnly cookie.
- Same email cannot create a user account if already registered as merchant/admin (portal separation preserved).
