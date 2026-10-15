import Link from 'next/link';
import {
  ChevronRight,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import { buildLoginHref } from '@/lib/authRedirect';
import { getPaymentModeIcon } from '@/lib/paymentModeIcon';
import { normalizeExternalHref } from '@/lib/validateProfileUrl';

type SocialLink = {
  label: string;
  href: string | undefined;
};

const SOCIAL_BRAND: Record<string, { Icon: IconType; colorClass: string }> = {
  Instagram: { Icon: FaInstagram, colorClass: 'text-[#E4405F]' },
  Facebook: { Icon: FaFacebook, colorClass: 'text-[#1877F2]' },
  YouTube: { Icon: FaYoutube, colorClass: 'text-[#FF0000]' },
};

type BusinessProfileContactAsideProps = {
  contactRevealed: boolean;
  profileRedirectPath: string;
  phoneLink: string | null | undefined;
  phone: string;
  email?: string;
  website?: string;
  address?: string;
  paymentModes: string[];
  socialLinks: SocialLink[];
  onCall: () => void;
  onEnquire: () => void;
  onEmail?: () => void;
  phoneVerified?: boolean;
  emailVerified?: boolean;
};

function getMaskedPhoneNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Hidden until you sign in';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return 'Hidden until you sign in';
  return `${digits.slice(0, 2)}${'•'.repeat(Math.max(2, digits.length - 4))}${digits.slice(-2)}`;
}

function getMaskedEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes('@')) return 'Hidden until you sign in';
  const [localPart, domainPart] = trimmed.split('@');
  if (!localPart || !domainPart) return 'Hidden until you sign in';
  return `${localPart.slice(0, 2)}${'•'.repeat(Math.max(2, localPart.length - 2))}@${domainPart}`;
}

function ContactRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-[#153551]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-stone-400">{label}</span>
        <span className="block truncate text-sm font-semibold text-[#153551]">{value}</span>
      </span>
      {onClick ? <ChevronRight size={16} className="shrink-0 text-stone-300" /> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center gap-3 px-3 py-3">{content}</div>;
}

export default function BusinessProfileContactAside({
  contactRevealed,
  profileRedirectPath,
  phoneLink,
  phone,
  email,
  website,
  address,
  paymentModes,
  socialLinks,
  onCall,
  onEmail,
  phoneVerified = true,
  emailVerified = true,
}: BusinessProfileContactAsideProps) {
  const loginHref = buildLoginHref(profileRedirectPath);
  const websiteHref = website ? normalizeExternalHref(website) : null;
  const hasContact = Boolean(phoneLink || email || website || address);

  return (
    <section id="contact" className="scroll-mt-40 px-4 pt-6">
      <h2 className="text-[20px] font-extrabold tracking-tight text-[#153551]">Contact</h2>

      {!contactRevealed ? (
        <Link
          href={loginHref}
          className="mt-3 flex items-center gap-3 rounded-[14px] border border-amber-200 bg-amber-50 p-3.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-800">
            <Lock size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#153551]">Sign in to reveal contact</span>
            <span className="block text-xs text-stone-500">
              Phone and email stay private until you sign in.
            </span>
          </span>
          <ChevronRight size={16} className="text-[#153551]" />
        </Link>
      ) : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200/90 bg-white">
        {hasContact ? (
          <div className="divide-y divide-stone-100">
            {phoneLink ? (
              <ContactRow
                icon={<Phone size={16} />}
                label="Phone"
                value={contactRevealed && phoneVerified ? phone : getMaskedPhoneNumber(phone)}
                onClick={onCall}
              />
            ) : null}
            {email ? (
              <ContactRow
                icon={<Mail size={16} />}
                label="Email"
                value={contactRevealed && emailVerified ? email : getMaskedEmail(email)}
                onClick={() => {
                  if (onEmail) {
                    onEmail();
                    return;
                  }
                  if (contactRevealed) {
                    window.location.href = `mailto:${email}`;
                    return;
                  }
                  window.location.href = loginHref;
                }}
              />
            ) : null}
            {websiteHref ? (
              <ContactRow
                icon={<Globe size={16} />}
                label="Website"
                value={websiteHref.replace(/^https?:\/\//, '')}
                onClick={() => {
                  window.open(websiteHref, '_blank', 'noopener,noreferrer');
                }}
              />
            ) : null}
            {address ? (
              <ContactRow icon={<MapPin size={16} />} label="Address" value={address} />
            ) : null}
          </div>
        ) : (
          <p className="px-3 py-4 text-sm text-stone-500">Contact details not listed yet.</p>
        )}
      </div>

      {socialLinks.length > 0 || paymentModes.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {socialLinks.length > 0 ? (
            <div className="flex gap-2">
              {socialLinks.map((link) => {
                const brand = SOCIAL_BRAND[link.label];
                const Icon = brand?.Icon;
                const href = normalizeExternalHref(link.href);
                if (!href) return null;
                return (
                  <a
                    key={link.label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-stone-200 bg-stone-50"
                    aria-label={link.label}
                  >
                    {Icon ? <Icon size={18} className={brand.colorClass} /> : link.label}
                  </a>
                );
              })}
            </div>
          ) : null}
          {paymentModes.length > 0 ? (
            <p className="flex items-center gap-2 text-xs font-medium text-stone-500">
              {(() => {
                const Icon = getPaymentModeIcon(paymentModes[0]);
                return <Icon size={14} className="shrink-0" aria-hidden />;
              })()}
              {paymentModes.join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
