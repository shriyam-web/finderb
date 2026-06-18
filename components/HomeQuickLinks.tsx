'use client';

import Link from 'next/link';
import { SITELINK_NAV_LINKS } from '@/lib/siteSeo';

export default function HomeQuickLinks() {
  return (
    <nav
      aria-label="Explore FinderB"
      className="mx-auto -mt-2 mb-2 hidden max-w-7xl px-8 lg:block"
    >
      <ul className="flex flex-wrap items-center gap-y-1 border-b border-slate-100 pb-4 text-[13px] text-slate-600">
        {SITELINK_NAV_LINKS.map((link, index) => (
          <li key={link.path} className="flex items-center">
            {index > 0 ? (
              <span className="mx-2.5 text-slate-300" aria-hidden>
                |
              </span>
            ) : null}
            <Link
              href={link.path}
              className="font-medium text-slate-600 transition-colors hover:text-[#2563eb] hover:underline underline-offset-2"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
