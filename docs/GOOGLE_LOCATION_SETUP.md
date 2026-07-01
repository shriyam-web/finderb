# Google location integration (FinderB)

FinderB uses three layers for user location:

| Layer | API | Where it runs | Accuracy |
|-------|-----|---------------|----------|
| 1. GPS / Wi‑Fi (primary) | Browser `navigator.geolocation` | User’s device | Best (especially mobile) |
| 2. City / area label | **Geocoding API** | Your Next.js server | N/A (text only) |
| 3. Last-resort coords | **Geolocation API** | User’s browser | City / region (~1–50 km) |

---

## Step 1 — Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top bar) → **New project**.
3. Name it e.g. `FinderB Production` → **Create**.
4. Select the new project.

---

## Step 2 — Enable billing

Google Maps Platform requires billing (you still get monthly free credit).

1. Go to **Billing** in the left menu.
2. Link a billing account (or create one).
3. Attach it to this project.

---

## Step 3 — Enable the APIs

1. Go to **APIs & Services** → **Library**.
2. Search and enable:
   - **Geocoding API**
   - **Geolocation API**
   - **Maps Embed API** (business profile map iframes)

---

## Step 4 — Create API keys (recommended: two keys)

### Key A — Server (Geocoding)

Used when converting `{ lat, lng }` → `"Malviya Nagar, Delhi"`.

1. **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
2. Copy the key → this is `GOOGLE_MAPS_API_KEY`.
3. **Edit API key**:
   - **Application restrictions** → **IP addresses**
   - Add your server IPs (for Vercel, see Vercel docs / use unrestricted only in dev).
   - **API restrictions** → **Restrict key** → select **Geocoding API** only.

### Key B — Browser (Geolocation fallback)

Used only when browser GPS fails or is denied.

1. Create another API key.
2. Copy → this is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
3. **Edit API key**:
   - **Application restrictions** → **HTTP referrers**
   - Add:
     - `http://localhost:3000/*`
     - `https://YOUR_DOMAIN.com/*`
     - `https://*.YOUR_DOMAIN.com/*`
   - **API restrictions** → **Geolocation API** and **Maps Embed API**

> For local dev you can use one key with loose restrictions; use two restricted keys in production.

---

## Step 5 — Add keys to FinderB

1. Copy `.env.example` to `.env.local` in the project root.
2. Paste your keys:

```env
GOOGLE_MAPS_API_KEY=AIza...server...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...browser...
```

3. Restart the dev server: `npm run dev`.

---

## Step 6 — Verify

1. Open the site on your phone (or desktop).
2. Allow location when prompted.
3. Hero location should show an area + city (Geocoding working).
4. Block location in browser settings, reload — you may get a coarse city via Geolocation API fallback (if browser key is set).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| City shows “Near you” forever | Check `GOOGLE_MAPS_API_KEY`, Geocoding API enabled, billing on |
| `REQUEST_DENIED` in console | Key restrictions too tight; referrer/IP mismatch |
| Geolocation fallback never runs | Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; enable Geolocation API |
| Business profile map is blank | Enable **Maps Embed API**; add it to browser key restrictions; restart dev server |
| Wrong city with GPS allowed | Geocoding issue — not Geolocation API; check server key |
| Works on localhost, not production | Add production domain to HTTP referrer restrictions |

---

## Cost notes

- **Geocoding**: charged per request (reverse geocode on each new coordinate).
- **Geolocation API**: charged per request; used only as fallback.
- Browser GPS is free (no Google charge).

Monitor usage: **APIs & Services** → **Dashboard**.
