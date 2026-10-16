'use client';

import { useEffect, useRef, useState } from 'react';
import { HiOutlineChatBubbleLeftRight, HiOutlineXMark, HiOutlineEnvelope, HiOutlinePhone } from 'react-icons/hi2';

const FAQS = [
  {
    q: 'How do I get more customer leads on FinderB?',
    a: 'FinderB ranks live listings that look complete and respond quickly. Add at least one sharp photo (required to appear in search), fill about, hours, map pin, and services, then verify email and mobile. Reply to every lead the same day — shops that answer fast win the second enquiry. Ten genuine reviews, a paid plan, and a complete profile all lift you above nearby competitors in the same category.',
  },
  {
    q: 'Why is my listing hidden from customers?',
    a: 'A listing stays off search, categories, and the public profile until it has at least one photo and FinderB has approved it as Active. Unverified contact details are also withheld from the public page. If you used “Delete my business”, the listing is set to inactive on purpose — add a photo, restore the details, and write to business@finderb.com if you need it switched back on.',
  },
  {
    q: 'How do I change my category or business name?',
    a: 'Category, legal name, and display name are locked after go-live so customers are not misled. Open Settings, submit a change request with the new value, and wait for FinderB to review it. Typical turnaround is one to two working days. The rest of the listing — hours, photos, about, map — you can edit yourself from My Listing.',
  },
  {
    q: 'How do reviews, the QR card, and flagging work?',
    a: 'Share the FinderB review link or printed QR card so signed-in customers can rate you after a visit. Replies show on your public page. You can flag abusive or fake reviews from the Reviews tab; each business gets a limited number of flags per month, so use them for genuine problems. Listings with 10+ real reviews appear more often in local results.',
  },
  {
    q: 'What does a paid plan unlock?',
    a: 'Starter is free: your listing can still show, but lead phone numbers stay hidden. Growth and Pro unlock the caller’s number, lead alerts, and stronger placement. If you do not have an active subscription, the thin red strip under the header takes you to My Subscription. Auto-renew, if you turned it on, charges the saved mandate at the end of the cycle.',
  },
  {
    q: 'Can I add teammates without sharing my password?',
    a: 'Yes. Owners invite staff from Settings → Team access with email or mobile. Each invite lasts 48 hours. You choose which tabs they can view or edit (leads, listing, reviews, jobs, plan). Only the owner can hide the listing or manage billing.',
  },
  {
    q: 'What is Merchant ID and why does it matter?',
    a: 'Your Merchant ID is the unique FinderB id for this business. It is shown on the My Listing tab with a copy button. Quote it in emails or WhatsApp to support so we can find the right listing without asking you to re-explain the shop name or city.',
  },
  {
    q: 'How are competitor score and average response time calculated?',
    a: 'Competitor score is the average profile-completion percentage of other live listings in your category. Response time is how long you typically take to open a new lead after it arrives. Both sit together on Overview. They are not repeated inside profile completion on My Listing.',
  },
  {
    q: 'Why does a lead show Call and WhatsApp for one customer and only Email for another?',
    a: 'Call and WhatsApp appear when the customer’s FinderB account has a verified mobile, or when they typed a phone number on the enquiry. Email is always there if we have an address. On the free plan those buttons stay locked until you upgrade. Job applications are on their own tab, so a hiring enquiry will not sit in the customer list.',
  },
  {
    q: 'What is the Lead ID box for?',
    a: 'Every lead card has a small Lead ID box at the top right. Click it to copy the full id. Paste that id when you write to business@finderb.com so we can open the exact enquiry instead of searching by name.',
  },
  {
    q: 'How do customer leads differ from job applications?',
    a: 'Leads has two tabs. Customers is for people who called, messaged, or sent an enquiry about your shop. Job applications is only for people who applied to a job you posted. Reply to customers first — that is what average response time measures.',
  },
  {
    q: 'How do I post a job and see who applied?',
    a: 'Open Jobs and save an HR email and mobile before the first post. Salary is a minimum and maximum, per month or per year. Applicants can attach a PDF or Word CV. Open a job to see applications, then open one to shortlist. Shortlist emails the candidate and, if they have a FinderB account, sends a notification with your HR contact.',
  },
  {
    q: 'Which files can a candidate upload?',
    a: 'Only PDF, DOC, and DOCX, up to 5 MB. FinderB rejects executables, APKs, and files that contain scripts. You can preview a PDF in the dashboard and download Word files. Do not ask candidates to pay anyone to apply.',
  },
  {
    q: 'Can a customer review my business without showing their name?',
    a: 'Yes. They tick Post anonymously and the review goes up without a reason box. The public name is masked. You still see it in Reviews and can reply or flag it if it is abusive. Flagging is limited each month, so keep flags for real problems.',
  },
  {
    q: 'Why was my business name shortened or rejected?',
    a: 'Legal name and the name customers see are both limited to 50 characters, on registration and on a change request. Very long names break the public profile. If the name is already live, request a change from Settings rather than editing the locked field.',
  },
  {
    q: 'I paid again before my plan ended. When does the new period start?',
    a: 'The new period is added after the current expiry, so days you already paid are kept. A business on Pro is not asked to upgrade. Growth can move to yearly Pro, and that year starts after the current Growth month ends. Payment history shows the latest 10 charges, then Load more.',
  },
  {
    q: 'What happens when my plan expires?',
    a: 'The listing can stay visible, but lead phone numbers and WhatsApp hide again until you renew. Reviews and photos stay. Renew from My Subscription before the date on the card if you want no gap in lead access. Turning off auto-renew stops the next debit; it does not cut the days you have already paid.',
  },
  {
    q: 'How do I update hours, photos, or the map pin?',
    a: 'My Listing is the public page. Photos need at least one image or the listing stays hidden. Hours, about, services, and the map pin save without admin review. Category, legal name, and display name need a change request. Extra sibling categories can be added as “also serves” without waiting for approval.',
  },
  {
    q: 'My WhatsApp number is different from my mobile. How do I verify it?',
    a: 'On registration, tick “I have a different WhatsApp number”. The field becomes editable. Send the WhatsApp OTP to that number and enter it before you continue. If you leave the box unticked, the verified mobile is used as WhatsApp and no second code is required.',
  },
  {
    q: 'A social link would not save. Why?',
    a: 'Instagram, Facebook, and YouTube links are checked when you change them. If the profile does not exist, or the site cannot confirm it, the save is rejected so a dead link never reaches customers. Paste the public profile URL, not a share-sheet link that expires.',
  },
  {
    q: 'How do team invites reach my staff?',
    a: 'From Settings → Team access, invite by email or mobile and choose which tabs they can view or edit. A phone invite opens WhatsApp with the link ready — you tap Send. The link lasts 48 hours. Staff never need your password. Only the owner can hide the listing or change billing.',
  },
];

export default function MerchantSupportFab() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(FAQS[0]?.q ?? null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('finderb-support-fab');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { x?: number; y?: number };
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') setPos({ x: parsed.x, y: parsed.y });
    } catch {
      // ignore a bad saved position
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          if (Math.hypot(dx, dy) > 4) drag.current.moved = true;
          const x = Math.min(window.innerWidth - 56, Math.max(8, drag.current.left + dx));
          const y = Math.min(window.innerHeight - 56, Math.max(8, drag.current.top + dy));
          setPos({ x, y });
        }}
        onPointerUp={() => {
          const moved = drag.current?.moved;
          drag.current = null;
          if (moved) {
            setPos((current) => {
              if (current) window.localStorage.setItem('finderb-support-fab', JSON.stringify(current));
              return current;
            });
            return;
          }
          setOpen(true);
        }}
        className="fixed z-[70] flex h-12 w-12 cursor-grab touch-none items-center justify-center rounded-full bg-zinc-800 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-700 active:cursor-grabbing"
        style={pos ? { left: pos.x, top: pos.y } : { right: 16, bottom: 88 }}
        aria-label="Business support. Drag to move."
      >
        <HiOutlineChatBubbleLeftRight size={22} />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-3 sm:max-w-lg sm:rounded-2xl sm:pt-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-zinc-200 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Help centre</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">How FinderB Business works</h3>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-500">
                  Short answers to the questions owners ask us most — ranking, photos, reviews, plans, and your Merchant
                  ID.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>
            <div className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
              {FAQS.map((item) => {
                const on = expanded === item.q;
                return (
                  <button
                    key={item.q}
                    type="button"
                    onClick={() => setExpanded(on ? null : item.q)}
                    className="block w-full py-3.5 text-left"
                    aria-expanded={on}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-900">{item.q}</span>
                      <span className="mt-0.5 text-zinc-400">{on ? '–' : '+'}</span>
                    </span>
                    {on ? <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.a}</p> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 border-t border-zinc-100 pt-4">
              <p className="text-sm font-semibold text-zinc-900">Talk to FinderB</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Weekdays, 10:00–18:00 IST. Keep your Merchant ID handy so we can open the right listing on the first
                reply.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href="mailto:business@finderb.com"
                  className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 hover:text-zinc-950"
                >
                  <HiOutlineEnvelope size={16} />
                  business@finderb.com
                </a>
                <a
                  href="tel:+919990222346"
                  className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 hover:text-zinc-950"
                >
                  <HiOutlinePhone size={16} />
                  +91 99902 22346
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
