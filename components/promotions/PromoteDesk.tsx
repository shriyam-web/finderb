'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { City, State } from 'country-state-city';
import './promote.css';
import { openRazorpayCheckout } from '@/lib/razorpay/client';
import { DECLARATION, DOCUMENT_TYPES, inr } from '@/lib/promotions/model';
import {
  beginPromotionPayment,
  finishPromotionPayment,
  loadPromotionDesk,
  loadPromotionOrder,
  placePromotionOrder,
  requestCustomPromotion,
} from '@/app/actions/promotions';

type PackageCard = {
  id: string;
  name: string;
  durationDays: number;
  coverage: string;
  priceInr: number;
  referenceInr: number;
  discountPercent: number;
  reach: string;
  views: string;
  visits: string;
  popular: boolean;
  estimateNote: string;
};

type OrderCard = {
  id: string;
  packageName: string;
  durationDays: number;
  coverage: string;
  priceInr: number;
  paymentStatus: string;
  campaignStatus: string;
  campaignLabel: string;
  targetPincode: string;
  targetArea: string;
  videoReady: boolean;
  videoUrl: string | null;
  createdAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  rejectionReason: string | null;
  report: { reach: number; views: number; visits: number } | null;
};

type Desk = {
  verification: { status: string; rejectionReason: string | null; submittedAt: string | null };
  packages: PackageCard[];
  orders: OrderCard[];
};

const STEPS = ['Package', 'Verify', 'Area', 'Video', 'Pay'];
const COVERAGE_PRESETS = ['5–8 KM around the shop', '15–20 KM / City', 'District / Regional'];
const DAY_PRESETS = [5, 7, 10, 15, 30];
const INDIAN_STATES = State.getStatesOfCountry('IN');

export default function PromoteDesk({ mode, orderId }: { mode: 'promote' | 'list' | 'detail' | 'verify'; orderId?: string }) {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [order, setOrder] = useState<OrderCard | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [packageId, setPackageId] = useState('growth');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [draftId, setDraftId] = useState('');
  const [step, setStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoName, setVideoName] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [customSent, setCustomSent] = useState('');
  const [customCoverage, setCustomCoverage] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [customStateCode, setCustomStateCode] = useState('');
  const [customCity, setCustomCity] = useState('');
  const customCities = useMemo(
    () => (customStateCode ? City.getCitiesOfState('IN', customStateCode) : []),
    [customStateCode],
  );
  const verifyForm = useRef<HTMLFormElement>(null);
  const uploadRequest = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    void loadPromotionDesk().then((result) => {
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDesk(result);
      setStep(0);
    });
    if (mode === 'detail' && orderId) {
      void loadPromotionOrder(orderId).then((result) => {
        if (result.success) setOrder(result.order as OrderCard);
        else setError(result.error);
      });
    }
  }, [mode, orderId]);

  const refresh = async () => {
    const result = await loadPromotionDesk();
    if (result.success) setDesk(result);
  };

  const submitVerification = async (form: FormData) => {
    setBusy(true);
    setError('');
    const response = await fetch('/api/business/promotions/verification', { method: 'POST', body: form });
    const body = (await response.json()) as { success?: boolean; error?: string };
    setBusy(false);
    if (!body.success) {
      setError(body.error || 'Verification could not be sent.');
      return;
    }
    await refresh();
  };

  const createOrder = async () => {
    setBusy(true);
    setError('');
    const result = await placePromotionOrder(packageId, pincode, area);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDraftId(result.orderId);
    setStep(3);
  };

  const uploadVideo = (file: File) => {
    setBusy(true);
    setError('');
    setUploadProgress(0);
    setVideoName(file.name);
    const form = new FormData();
    form.set('orderId', draftId);
    form.set('video', file);
    const xhr = new XMLHttpRequest();
    uploadRequest.current = xhr;
    xhr.open('POST', '/api/business/promotions/video');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => {
      setBusy(false);
      setError('The video upload was interrupted. Try again.');
    };
    xhr.onabort = () => {
      setBusy(false);
      setError('Upload cancelled.');
    };
    xhr.onload = () => {
      setBusy(false);
      const body = JSON.parse(xhr.responseText || '{}') as { success?: boolean; error?: string };
      if (!body.success) {
        setError(body.error || 'The video could not be uploaded.');
        return;
      }
      setStep(4);
    };
    xhr.send(form);
  };

  const pay = async () => {
    setBusy(true);
    setError('');
    const started = await beginPromotionPayment(draftId);
    if (!started.success) {
      setBusy(false);
      setError(started.error);
      return;
    }
    try {
      const paid = await new Promise<{
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }>((resolve, reject) => {
        void openRazorpayCheckout({
          key: started.keyId,
          amount: started.order.amount,
          currency: started.order.currency,
          order_id: started.order.id,
          name: 'FinderB',
          description: 'Promote your business online',
          prefill: {
            name: started.business.fullName,
            email: started.business.email,
            contact: started.business.mobile,
          },
          modal: { ondismiss: () => reject(new Error('Payment was closed before it finished.')) },
          handler: (response) => resolve(response),
        }, (message) => reject(new Error(message)));
      });
      const done = await finishPromotionPayment({
        orderId: draftId,
        razorpayOrderId: paid.razorpay_order_id,
        paymentId: paid.razorpay_payment_id,
        signature: paid.razorpay_signature,
      });
      setBusy(false);
      if (!done.success) {
        setError(done.error);
        return;
      }
      window.location.href = `/business/promotions/${done.orderId}`;
    } catch (caught) {
      setBusy(false);
      setError(caught instanceof Error ? caught.message : 'Payment was not completed.');
    }
  };

  const selected = desk?.packages.find((item) => item.id === packageId);

  return (
    <main className="promo-page">
      <div className="promo-wrap">
        <p className="promo-kicker">Growth & Marketing</p>
        <h1 className="promo-title">Promote your business online</h1>
        <p className="promo-lead">
          They live around this shop. They still don't know it. A person two kilometres away will not walk in if they have never seen you. You pick the area and the days. FinderB makes the ad, puts it in front of them on Facebook and Instagram, and brings the reach, views, and visits back here.
        </p>
        <div className="promo-row" style={{ marginTop: 16 }}>
          <Link className="promo-btn-ghost" href="/business/promote">Packages</Link>
          <Link className="promo-btn-ghost" href="/business/verification">Verification</Link>
          <Link className="promo-btn-ghost" href="/business/promotions">My promotions</Link>
        </div>
        {error ? <p className="promo-error">{error}</p> : null}

        {mode === 'list' ? (
          <section className="promo-card" style={{ marginTop: 20 }}>
            <h2>My promotions</h2>
            {desk?.orders.length ? (
              <table className="promo-table">
                <thead>
                  <tr><th>Order</th><th>Package</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {desk.orders.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.packageName}</td>
                      <td><span className="promo-status">{item.campaignLabel}</span></td>
                      <td><Link href={`/business/promotions/${item.id}`}>Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="promo-meta">No promotions yet.</p>}
          </section>
        ) : null}

        {mode === 'detail' && order ? (
          <section className="promo-card" style={{ marginTop: 20 }}>
            <p className="promo-status">{order.campaignLabel}</p>
            <h2>{order.packageName}</h2>
            <p className="promo-meta">Order {order.id} · {inr(order.priceInr)} · {order.targetArea} {order.targetPincode}</p>
            <p className="promo-meta">Payment {order.paymentStatus}. Video {order.videoReady ? 'received' : 'missing'}.</p>
            {order.paymentStatus === 'paid' ? <p className="promo-meta">FinderB recorded this payment and emailed the business and the FinderB team.</p> : null}
            {order.rejectionReason ? <p className="promo-error">{order.rejectionReason}</p> : null}
            <div className="promo-steps">
              {['payment_successful', 'under_review', 'video_ready', 'ad_active', 'completed'].map((item) => (
                <span key={item} className={`promo-step ${order.campaignStatus === item ? 'on' : ''}`}>{item.replaceAll('_', ' ')}</span>
              ))}
            </div>
            {order.videoUrl ? <p className="promo-meta"><a href={order.videoUrl}>Open uploaded video</a> · link expires in 10 minutes</p> : null}
            {order.report ? (
              <div className="promo-grid cards" style={{ marginTop: 16 }}>
                <div className="promo-card"><strong>{order.report.reach.toLocaleString('en-IN')}</strong><p className="promo-meta">Actual reach</p></div>
                <div className="promo-card"><strong>{order.report.views.toLocaleString('en-IN')}</strong><p className="promo-meta">Actual video views</p></div>
                <div className="promo-card"><strong>{order.report.visits.toLocaleString('en-IN')}</strong><p className="promo-meta">Actual profile visits</p></div>
              </div>
            ) : <p className="promo-note">Actual results appear here after FinderB closes the campaign. Package estimates are not results.</p>}
          </section>
        ) : null}

        {mode === 'verify' || mode === 'promote' ? (
          <>
            <div className="promo-steps">
              {STEPS.map((label, index) => (
                <span key={label} className={`promo-step ${step === index ? 'on' : ''}`}>{label}</span>
              ))}
            </div>
            {desk && ((mode === 'verify') || (mode === 'promote' && step === 1)) && desk.verification.status !== 'approved' ? (
              <section className="promo-card" style={{ marginTop: 16 }}>
                <h2>Business verification</h2>
                <p className="promo-meta">Status: {desk.verification.status.replaceAll('_', ' ')}</p>
                {desk.verification.rejectionReason ? <p className="promo-error">{desk.verification.rejectionReason}</p> : null}
                {desk.verification.status === 'submitted' || desk.verification.status === 'under_review' ? (
                  <p className="promo-meta">Submitted {desk.verification.submittedAt ? new Date(desk.verification.submittedAt).toLocaleString('en-IN') : ''}. Payment for the package you chose opens after approval.</p>
                ) : (
                  <form ref={verifyForm} action={(form) => void submitVerification(form)}>
                    <p className="promo-note">Use the camera for the shop front. A gallery photo is not accepted for this check.</p>
                    <label className="promo-field">Shop-front photograph
                      <input name="shopPhoto" type="file" accept="image/*" capture="environment" required />
                    </label>
                    <label className="promo-field">Latitude<input name="latitude" required readOnly placeholder="Use this device location" /></label>
                    <label className="promo-field">Longitude<input name="longitude" required readOnly /></label>
                    <input type="hidden" name="accuracy" />
                    <button type="button" className="promo-btn-ghost" onClick={() => {
                      if (!navigator.geolocation) {
                        setError('Location is not available in this browser.');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition((pos) => {
                        const form = verifyForm.current;
                        const lat = form?.elements.namedItem('latitude');
                        const lng = form?.elements.namedItem('longitude');
                        const accuracy = form?.elements.namedItem('accuracy');
                        if (lat instanceof HTMLInputElement) lat.value = String(pos.coords.latitude);
                        if (lng instanceof HTMLInputElement) lng.value = String(pos.coords.longitude);
                        if (accuracy instanceof HTMLInputElement) accuracy.value = String(pos.coords.accuracy || '');
                        setError('');
                      }, () => setError('Location permission is required to photograph the shop.'), { enableHighAccuracy: true, timeout: 12000 });
                    }}>Use this device location</button>
                    <label className="promo-field">Document
                      <select name="documentType" defaultValue="gst">
                        {DOCUMENT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </label>
                    <label className="promo-field">Document files
                      <input name="documents" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple required />
                    </label>
                    <label className="promo-field" style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <input type="checkbox" name="declaration" value="yes" required />
                      <span>{DECLARATION}</span>
                    </label>
                    <button className="promo-btn" disabled={busy} type="submit">{busy ? 'Sending…' : 'Submit verification'}</button>
                  </form>
                )}
              </section>
            ) : null}

            {desk && step === 0 && mode === 'promote' ? (
              <section style={{ marginTop: 16 }}>
                <p className="promo-kicker">Facebook and Instagram ads, run for you</p>
                <h2>Pick how far, and how many days</h2>
                <p className="promo-lead">You choose a package. FinderB makes the ad, runs it in that area, and brings the recorded reach back here.</p>
              </section>
            ) : null}

            {desk && step === 0 && mode === 'promote' ? (
              <section className="promo-grid cards">
                {desk.packages.map((item) => (
                  <article key={item.id} className={`promo-card ${item.popular ? 'popular' : ''}`}>
                    {item.popular ? <span className="promo-badge">Most popular</span> : null}
                    <h2>{item.name}</h2>
                    <p className="promo-pitch">{
                      /mega/i.test(`${item.id} ${item.name}`)
                        ? 'The district, for two weeks. The widest map on this page.'
                        : /growth/i.test(`${item.id} ${item.name}`)
                          ? 'Your city. Ten days in front of people already scrolling.'
                          : 'A short burst for the streets around the shop.'
                    }</p>
                    <p><span className="promo-price">{inr(item.priceInr)}</span><span className="promo-strike">{inr(item.referenceInr)}</span><span className="promo-off">{item.discountPercent}% off</span></p>
                    <ul className="promo-points">
                      <li>{item.durationDays} days of Facebook and Instagram ads</li>
                      <li>{item.coverage}</li>
                      <li>About {item.reach} can see it</li>
                      <li>{item.views}</li>
                      <li>{item.visits} to the shop page</li>
                    </ul>
                    <button className="promo-btn" type="button" onClick={() => {
                      setPackageId(item.id);
                      setStep(desk.verification.status === 'approved' ? 2 : 1);
                    }}>Continue with {item.name}</button>
                  </article>
                ))}
              </section>
            ) : null}

            {desk && mode === 'promote' && step === 0 ? (
              <section className="promo-card">
                <h2>What you get</h2>
                <p className="promo-meta">FinderB runs the Facebook and Instagram ads. You do not open Ads Manager or keep topping up an ads account.</p>
                <p className="promo-meta">You choose how far the ads go, send one shop video, and pay the package price with GST included.</p>
                <p className="promo-note">Package reach is an estimate, not a promise. Ads start only after the shop is verified and payment is confirmed.</p>
                {customSent ? (
                  <p className="promo-meta">Request {customSent}. It will take up to 24 hours. FinderB will come back with a price for your shop.</p>
                ) : (
                  <button className="promo-btn-ghost" type="button" onClick={() => setCustomOpen((open) => !open)}>Ask for a custom plan</button>
                )}
                {customOpen && !customSent ? (
                  <form onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const budgetInr = Number(String(form.get('budget') || '').replace(/,/g, ''));
                    const durationDays = Number(customDays || form.get('days'));
                    const coverage = customCoverage === 'Other' ? String(form.get('coverageOther') || '').trim() : customCoverage;
                    const pincode = String(form.get('pincode') || '').trim();
                    const state = INDIAN_STATES.find((item) => item.isoCode === customStateCode)?.name || '';
                    const city = customCity.trim();
                    const locality = String(form.get('area') || '').trim();
                    const goal = String(form.get('goal') || '').trim();
                    const phone = String(form.get('phone') || '').replace(/\D/g, '').replace(/^91/, '').slice(-10);
                    const note = String(form.get('note') || '');
                    if (!Number.isFinite(budgetInr) || budgetInr < 100 || budgetInr > 5000000) {
                      setError('Enter a budget between ₹100 and ₹50,00,000.');
                      return;
                    }
                    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 90) {
                      setError('Enter 1 to 90 days.');
                      return;
                    }
                    if (coverage.length < 2) {
                      setError('Choose how far the ads should go.');
                      return;
                    }
                    if (!state) {
                      setError('Choose a state.');
                      return;
                    }
                    if (city.length < 2) {
                      setError('Enter the city.');
                      return;
                    }
                    if (locality.length < 2) {
                      setError('Enter the locality.');
                      return;
                    }
                    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
                      setError('Enter a 6-digit pincode.');
                      return;
                    }
                    if (goal.length < 8) {
                      setError('Tell FinderB what the ad should promote.');
                      return;
                    }
                    if (!/^[6-9]\d{9}$/.test(phone)) {
                      setError('Enter a 10-digit mobile number for the ad.');
                      return;
                    }
                    setBusy(true);
                    setError('');
                    void requestCustomPromotion({
                      budgetInr,
                      durationDays,
                      coverage,
                      pincode,
                      area: [locality, city, state].filter(Boolean).join(', '),
                      goal,
                      phone,
                      note,
                    }).then((result) => {
                      setBusy(false);
                      if (!result.success) {
                        setError(result.error);
                        return;
                      }
                      setCustomSent(result.requestId);
                      setCustomOpen(false);
                    });
                  }}>
                    <p className="promo-note">This is not a payment. FinderB reads it and replies within 24 hours.</p>
                    <label className="promo-field">Budget you can spend (₹)<input name="budget" inputMode="numeric" placeholder="5000" min={100} max={5000000} required /></label>
                    <div className="promo-field">
                      How many days
                      <div className="promo-chips">
                        {DAY_PRESETS.map((day) => (
                          <button
                            key={day}
                            className={`promo-chip${customDays === String(day) ? ' on' : ''}`}
                            type="button"
                            onClick={() => setCustomDays(String(day))}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <input
                        name="days"
                        inputMode="numeric"
                        placeholder="7"
                        min={1}
                        max={90}
                        required
                        value={customDays}
                        onChange={(event) => setCustomDays(event.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                      />
                    </div>
                    <div className="promo-field">
                      How far the ads should go
                      <div className="promo-chips">
                        {COVERAGE_PRESETS.map((item) => (
                          <button
                            key={item}
                            className={`promo-chip${customCoverage === item ? ' on' : ''}`}
                            type="button"
                            onClick={() => setCustomCoverage(item)}
                          >
                            {item}
                          </button>
                        ))}
                        <button
                          className={`promo-chip${customCoverage === 'Other' ? ' on' : ''}`}
                          type="button"
                          onClick={() => setCustomCoverage('Other')}
                        >
                          Other
                        </button>
                      </div>
                      {customCoverage === 'Other' ? (
                        <input name="coverageOther" placeholder="20 km around the shop, or two neighbouring cities" required />
                      ) : null}
                    </div>
                    <div className="promo-field-row">
                      <label className="promo-field">State
                        <select
                          name="state"
                          required
                          value={customStateCode}
                          onChange={(event) => {
                            setCustomStateCode(event.target.value);
                            setCustomCity('');
                          }}
                        >
                          <option value="">Choose state</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="promo-field">City
                        <select
                          name="city"
                          required
                          disabled={!customStateCode}
                          value={customCity}
                          onChange={(event) => setCustomCity(event.target.value)}
                        >
                          <option value="">{customStateCode ? 'Choose city' : 'State first'}</option>
                          {customCities.map((city, index) => (
                            <option key={`${city.name}-${index}`} value={city.name}>{city.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="promo-field">Locality<input name="area" placeholder="Andheri West" required minLength={2} /></label>
                    <label className="promo-field">Pincode<input name="pincode" inputMode="numeric" maxLength={6} placeholder="400001" pattern="[1-9][0-9]{5}" required /></label>
                    <label className="promo-field">What should the ad promote<textarea name="goal" required rows={3} minLength={8} placeholder="Monsoon sale on cotton kurtas" /></label>
                    <label className="promo-field">Mobile number on the ad<input name="phone" inputMode="tel" placeholder="98XXXXXXXX" required /></label>
                    <label className="promo-field">Anything else<textarea name="note" rows={2} placeholder="Optional — timings, offer, or anything FinderB should know" /></label>
                    <button className="promo-btn promo-send" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send to FinderB'}</button>
                  </form>
                ) : null}
              </section>
            ) : null}

            {step === 2 && selected ? (
              <section className="promo-card" style={{ marginTop: 16 }}>
                <h2>Confirm {selected.name}</h2>
                <p className="promo-meta">{selected.durationDays} days · {selected.coverage} · {inr(selected.priceInr)}</p>
                <p className="promo-note">GST is included in this launch price. Estimates above are not guaranteed.</p>
                <label className="promo-field">Target pincode<input value={pincode} onChange={(event) => setPincode(event.target.value)} inputMode="numeric" maxLength={6} /></label>
                <label className="promo-field">Locality or area<input value={area} onChange={(event) => setArea(event.target.value)} /></label>
                <button className="promo-btn" type="button" disabled={busy} onClick={() => void createOrder()}>{busy ? 'Saving…' : 'Continue to video'}</button>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="promo-card" style={{ marginTop: 16 }}>
                <h2>Promotional video</h2>
                <p className="promo-meta">MP4 or MOV, vertical 9:16, 15–45 seconds, up to 60 MB. Order {draftId}.</p>
                <label className="promo-field">Video
                  <input type="file" accept="video/mp4,video/quicktime" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const preview = document.getElementById('promo-video-preview') as HTMLVideoElement | null;
                    if (preview) preview.src = URL.createObjectURL(file);
                    uploadVideo(file);
                  }} />
                </label>
                <video id="promo-video-preview" className="promo-video" controls playsInline />
                {videoName ? <p className="promo-meta">{videoName} · {uploadProgress}%</p> : null}
                {busy ? <button className="promo-btn-ghost" type="button" onClick={() => uploadRequest.current?.abort()}>Cancel upload</button> : null}
              </section>
            ) : null}

            {step === 4 && selected ? (
              <section className="promo-card" style={{ marginTop: 16 }}>
                <h2>Pay {inr(selected.priceInr)}</h2>
                <p className="promo-meta">{selected.name} · {area} {pincode} · order {draftId}</p>
                <button className="promo-btn" type="button" disabled={busy} onClick={() => void pay()}>{busy ? 'Opening payment…' : 'Pay with Razorpay'}</button>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
