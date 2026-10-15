'use client';

import { useState } from 'react';
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
    a: 'Competitor score is the average profile-completion percentage of other live listings in your category. Response time is how long you typically take to open a new lead after it arrives. Both sit on Overview and My Listing so you can see whether you are ahead of nearby shops or leaving enquiries waiting.',
  },
];

export default function MerchantSupportFab() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(FAQS[0]?.q ?? null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.5rem] right-4 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-700 lg:bottom-8"
        aria-label="Business support"
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
