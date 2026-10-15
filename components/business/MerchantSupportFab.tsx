'use client';

import { useState } from 'react';
import { HiOutlineQuestionMarkCircle, HiOutlineXMark, HiOutlineEnvelope, HiOutlinePhone } from 'react-icons/hi2';

const FAQS = [
  {
    q: 'How do I get more customer leads?',
    a: 'Complete your listing, reply to reviews, verify phone and email, and add at least one photo so customers can find and trust you.',
  },
  {
    q: 'Why is my listing hidden?',
    a: 'A listing stays hidden until it has at least one photo and is approved. Unverified contact details are also hidden from customers.',
  },
  {
    q: 'How do I change my category or business name?',
    a: 'Open Settings and submit a change request. FinderB reviews category, legal name, and display name changes before they go live.',
  },
  {
    q: 'How do reviews work?',
    a: 'Share your FinderB review card or review link. Customers leave ratings after signing in. You can reply and flag abusive reviews from the Reviews tab.',
  },
  {
    q: 'Can I add teammates?',
    a: 'Yes. Owners can invite staff from Settings → Team access with email or mobile. Invites expire after 48 hours.',
  },
];

export default function MerchantSupportFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.5rem] right-4 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-[#153551] text-white shadow-lg shadow-[#153551]/25 hover:bg-[#215481] lg:bottom-8"
        aria-label="Business support"
      >
        <HiOutlineQuestionMarkCircle size={24} />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#215481]">FinderB Business</p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900">Need help?</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
                <HiOutlineXMark size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {FAQS.map((item) => (
                <details key={item.q} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-800">{item.q}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-[#215481]/15 bg-[#215481]/[0.04] p-3">
              <p className="text-sm font-semibold text-[#153551]">Still need help?</p>
              <p className="mt-1 text-xs text-zinc-600">Our team is here on business hours.</p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href="mailto:business@finderb.com"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#215481]"
                >
                  <HiOutlineEnvelope size={16} />
                  business@finderb.com
                </a>
                <a href="tel:+919990222346" className="inline-flex items-center gap-2 text-sm font-semibold text-[#215481]">
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
