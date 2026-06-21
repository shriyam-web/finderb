# Razorpay payment gateway setup (FinderB merchants)

FinderB uses Razorpay Checkout for **Growth Pro** subscriptions. Merchants pay from the dashboard (**Recharge Now**) or `/business/payment/[id]`.

## 1. Extract API keys from the Razorpay Dashboard

With your Razorpay dashboard open:

1. Sign in at [https://dashboard.razorpay.com](https://dashboard.razorpay.com).
2. In the left sidebar, open **Account & Settings** (gear icon).
3. Click **API Keys** under **Website and app settings**.
4. Choose the mode you need:
   - **Test mode** (toggle at top-right) — use while developing; no real money moves.
   - **Live mode** — use on production after KYC and website details are approved.
5. Click **Generate Key** (first time) or **Regenerate Key** if you lost the secret.
6. Copy both values from the popup:
   - **Key Id** — starts with `rzp_test_` (test) or `rzp_live_` (live). Safe to expose in the browser.
   - **Key Secret** — shown only once. Store it securely; never commit it to git.

### Keys used by FinderB

| Dashboard field | Environment variable | Where it is used |
|-----------------|----------------------|------------------|
| Key Id | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Checkout popup (browser) |
| Key Secret | `RAZORPAY_KEY_SECRET` | Server only — create order + verify payment |

Optional fallback: `RAZORPAY_KEY_ID` (server) if you prefer not to prefix the public key.

## 2. Configure environment variables

Create or edit `.env.local` in the project root:

```env
# Razorpay — use TEST keys while developing
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

Restart the dev server after changing env vars (`npm run dev`).

`.env.local` is gitignored. Never put the Key Secret in `NEXT_PUBLIC_*` variables.

## 3. Activate your Razorpay account (live payments)

Before switching to **Live** keys:

1. Complete **KYC** under **Account & Settings → Business settings**.
2. Add your website under **Account & Settings → Website and app settings → Websites** (e.g. `https://finderb.in`).
3. Submit required documents if prompted.
4. Generate **Live** API keys and replace the test values in production (Vercel/hosting env).

## 4. Test a payment

1. Use **Test mode** keys in `.env.local`.
2. Log in as a merchant → open **Dashboard**.
3. Click **Recharge Now** (or go to **Activate leads** / payment page).
4. In Razorpay test checkout, use:
   - Card: `4111 1111 1111 1111`
   - Expiry: any future date
   - CVV: any 3 digits
   - OTP: `1234` (if asked)

More test cards: [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-details/).

## 5. Production checklist

- [ ] Live API keys set on hosting (not in the repo)
- [ ] **Webhook** configured (see section 6) with `RAZORPAY_WEBHOOK_SECRET` on hosting
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (webhook activation writes to DB)
- [ ] Website URL added in Razorpay dashboard
- [ ] KYC completed
- [ ] Test payment on staging with test keys
- [ ] One live ₹1 test payment before announcing to merchants

## 6. Webhooks (required for production)

If a merchant closes the browser after paying, the checkout callback may never run. Webhooks activate Growth Pro reliably from Razorpay server events.

**Razorpay Dashboard → Account & Settings → Webhooks → Add New Webhook**

| Field | Value |
|-------|--------|
| URL | `https://finderb.com/api/razorpay/webhook` |
| Secret | Generate and copy — set as `RAZORPAY_WEBHOOK_SECRET` in Vercel |
| Events | `payment.captured`, `payment.authorized` |
| Alert email | Your ops email |

Also set in Vercel / `.env.local`:

```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_dashboard
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The webhook verifies Razorpay's signature, confirms payment status with Razorpay API, and idempotently marks the business as paid (same logic as checkout success).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Payment gateway is not configured” | Add both env vars and restart the server |
| Checkout does not open | Check browser console; CSP already allows `checkout.razorpay.com` |
| “Payment verification failed” | Key Secret must match the Key Id mode (test vs live) |
| Order creation 401 | Regenerate keys; copy Key Secret again |
