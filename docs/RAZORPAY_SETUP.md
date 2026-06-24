# Razorpay payment gateway setup (FinderB merchants)

FinderB uses **Razorpay** for Growth Pro billing:

| Billing | Flow |
|---------|------|
| **Monthly** | Razorpay **Subscriptions** + e-mandate (UPI Autopay / card mandate). Auto-debits each month until the merchant cancels. |
| **Annual** | Razorpay **one-time Checkout** order. Prepaid for 12 months — no recurring mandate. |

## 1. Extract API keys from the Razorpay Dashboard

1. Sign in at [https://dashboard.razorpay.com](https://dashboard.razorpay.com).
2. **Account & Settings** → **API Keys** → generate **Test** or **Live** keys.
3. Copy **Key Id** → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
4. Copy **Key Secret** → `RAZORPAY_KEY_SECRET` (server only, never commit)

## 2. Create the monthly subscription plan (mandate billing)

Monthly auto-debit requires a Razorpay **Plan**:

1. Dashboard → **Subscriptions** → **Plans** → **Create Plan**
2. Name: `Growth Pro Monthly`
3. Amount: **₹499** (49900 paise)
4. Billing frequency: **Every 1 month**
5. Copy the **Plan Id** (`plan_…`) → `RAZORPAY_PLAN_ID_PRO_MONTHLY`

Annual billing does **not** need a plan ID — it uses standard one-time orders.

## 3. Configure environment variables

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_PLAN_ID_PRO_MONTHLY=plan_xxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Restart the dev server after changing env vars.

## 4. Webhooks (required for production)

**Dashboard → Account & Settings → Webhooks → Add New Webhook**

| Field | Value |
|-------|--------|
| URL | `https://finderb.com/api/razorpay/webhook` |
| Secret | Set as `RAZORPAY_WEBHOOK_SECRET` |
| Events | See list below |

**Required webhook events:**

- `payment.captured`, `payment.authorized` — annual one-time payments
- `subscription.authenticated`, `subscription.activated` — monthly mandate setup
- `subscription.charged` — monthly auto-debit renewals
- `subscription.cancelled` — merchant cancelled auto-debit
- `subscription.halted` — failed renewal (notify merchant to update payment method)

Webhooks verify HMAC signatures, confirm payment status with Razorpay API, and idempotently update the database (same logic as checkout success).

## 5. Database migrations

Run in Supabase SQL editor (in order):

1. `supabase/merchant_subscriptions.sql`
2. `supabase/razorpay_subscriptions.sql`

## 6. Test a monthly mandate (test mode)

1. Use test keys and a test monthly plan ID.
2. Merchant dashboard → **Subscription** → choose **Monthly** → checkout.
3. Razorpay opens **mandate authorization** (not a plain one-time pay).
4. After success, dashboard shows **Auto-debit active** and plan expiry.
5. Test cancellation: **Cancel auto-debit** in Subscription tab.

[Test cards and UPI Autopay test flow](https://razorpay.com/docs/payments/payments/test-card-details/)

## 7. Test annual (one-time)

1. Choose **Annual** on checkout.
2. Complete standard Razorpay payment (no mandate).
3. Plan active for 12 months; merchant renews manually before expiry.

## 8. Production checklist

- [ ] Live API keys on hosting
- [ ] Live monthly plan created; `RAZORPAY_PLAN_ID_PRO_MONTHLY` set
- [ ] Webhook URL + all subscription events enabled
- [ ] `RAZORPAY_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] SQL migrations applied
- [ ] Test monthly mandate + cancel flow on staging
- [ ] Test annual one-time payment
- [ ] Admin panel `/admin/payments` shows transaction records

## Merchant-facing behaviour

- **Monthly**: Must complete mandate setup; ₹499 auto-debits each billing cycle.
- **Cancel auto-debit**: Subscription tab → **Cancel auto-debit**. Plan remains active until current period ends (Razorpay `cancel_at_cycle_end`).
- **Annual**: Single upfront payment; no auto-debit.
- **Expiry alerts**: Dashboard popup when plan is within 7 days of expiry.
- **Payment history**: Subscription tab lists mandate setup, auto-debits, and one-time payments.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Monthly auto-debit is not configured” | Set `RAZORPAY_PLAN_ID_PRO_MONTHLY` |
| Mandate checkout does not open | Ensure Subscriptions product enabled on Razorpay account |
| Renewal not recorded | Add `subscription.charged` to webhook events |
| Cancel did not sync | Add `subscription.cancelled` to webhook events |
| “Payment verification failed” | Key Secret must match Key Id mode (test vs live) |
