# Truecaller one-tap login (FinderB users)

FinderB `/login` and `/signup` support **Truecaller** alongside Google OAuth and email/password.

Truecaller verifies the user’s mobile number in one tap on **Android mobile browsers** when the Truecaller app is installed. There is no OTP.

---

## How it works

1. User taps **Continue with Truecaller** on `/login` or `/signup`.
2. The page opens the Truecaller app via a deep link.
3. After the user approves, Truecaller POSTs an access token to your callback URL.
4. FinderB fetches the verified profile (name, phone, optional email), creates or links a `User` row, sets the `user_id` session cookie, and redirects to the dashboard.

Email/password and Google sign-in continue to work unchanged.

---

## Important limitations

| Topic | Detail |
|-------|--------|
| Platform | **Android mobile web only** (Chrome, etc.). Not iOS or desktop. |
| App required | User must have Truecaller installed and logged in. |
| Pricing | Truecaller’s mobile-web SDK has a free tier for development; production may be metered — check [Truecaller for Developers](https://developer.truecaller.com). |
| HTTPS | Callback URL must be **HTTPS** (works on production and Vercel previews; use ngrok for local HTTPS testing). |

---

## Step 1 — Run the database migration

In **Supabase → SQL Editor**, run:

```
supabase/truecaller_auth.sql
```

This adds `phone`, `truecallerUserId` on `User`, and the `truecaller_auth_requests` table used for callback ↔ browser polling.

---

## Step 2 — Create a Truecaller developer app

1. Go to [developer.truecaller.com](https://developer.truecaller.com/login) and sign in.
2. **Add application** → App type: **Web**.
3. Enter:
   - **App name:** `FinderB`
   - **App domain:** `finderb.com` (or your staging domain)
   - **Callback URL:** `https://finderb.com/api/auth/truecaller/callback`
4. Copy the **App Key** (partner key).

For local testing with HTTPS tunnel:

```
https://<your-ngrok-subdomain>.ngrok.io/api/auth/truecaller/callback
```

---

## Step 3 — Environment variables

Add to `.env.local` and Vercel:

```env
# Enable Truecaller button on /login and /signup
NEXT_PUBLIC_TRUECALLER_ENABLED=true

# App key from Truecaller developer portal (shown in client deep link)
NEXT_PUBLIC_TRUECALLER_PARTNER_KEY=your_app_key_here

# Optional display name in Truecaller sheet (defaults to FinderB)
NEXT_PUBLIC_TRUECALLER_PARTNER_NAME=FinderB

# Used for privacy/terms links in Truecaller UI
NEXT_PUBLIC_SITE_URL=https://finderb.com

# Required — callback handler writes pending/completed auth state
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Step 4 — Test on Android

1. Deploy to HTTPS (or use ngrok pointing at `localhost:3000`).
2. Register the same callback URL in the Truecaller portal.
3. On an Android phone with Truecaller installed, open `/login`.
4. Tap **Continue with Truecaller** → approve in Truecaller → land on `/dashboard`.
5. In Supabase **Table Editor** → `User` → row with `authProvider = truecaller` and `phone` set.

### Test checklist

- [ ] New user via Truecaller → dashboard, `welcome=1` query on redirect
- [ ] Same phone signs in again → existing account linked
- [ ] User rejects Truecaller sheet → friendly error on login page
- [ ] iOS / desktop → message to use Google or email (no crash)
- [ ] Phone already registered as **merchant** → error with link to `/business/login`
- [ ] Email/password and Google login still work

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Truecaller button hidden | Set `NEXT_PUBLIC_TRUECALLER_ENABLED=true` and `NEXT_PUBLIC_TRUECALLER_PARTNER_KEY` |
| Callback never fires | Callback URL must be HTTPS and match the portal exactly |
| “Truecaller verification failed” | Add **`SUPABASE_SERVICE_ROLE_KEY`** on Vercel Production, run `truecaller_auth.sql`, redeploy |
| “Could not read your Truecaller profile” | Token expired — approve in Truecaller again right away |
| “Server misconfigured: SUPABASE_SERVICE_ROLE_KEY” | Supabase → Settings → API → service_role → paste into Vercel env vars |
| “Database not ready” | Run `supabase/truecaller_auth.sql` in Supabase SQL Editor |
| “Could not start verification” | Run `truecaller_auth.sql`; set `SUPABASE_SERVICE_ROLE_KEY` |
| Verification times out | Test on **https://finderb.com** (Truecaller always calls your registered production callback, not localhost) |
| “Truecaller app not detected” | Install Truecaller on Android or use Google/email |
| User row not created | Check Vercel logs for `[truecaller callback]` errors |

---

## Security notes

- Truecaller users receive a random hashed password they never use (`authProvider = truecaller`).
- If Truecaller does not share an email, FinderB stores a synthetic email `{phone}@phone.finderb.local` to satisfy the existing `User.email` unique constraint.
- The callback responds within 3 seconds and processes profile fetch asynchronously-friendly (quick 200 OK to Truecaller).
- Same portal rules apply: a mobile number tied to a merchant account cannot create a separate user account without an existing user row.
