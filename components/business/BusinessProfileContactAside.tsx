import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa6';
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
  whatsapp?: string;
  website?: string;
  address?: string;
  paymentModes: string[];
  socialLinks: SocialLink[];
  onCall: () => void;
  onEnquire: () => void;
  className?: string;
  onEmail?: () => void;
  onWhatsApp?: () => void;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  whatsappVerified?: boolean;
  onAddress?: () => void;
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

const CONTACT_TONE = {
  phone: { row: 'bg-blue-50', icon: 'bg-blue-100 text-blue-700', hint: 'Tap to call' },
  email: { row: 'bg-red-50', icon: 'bg-red-100 text-red-600', hint: 'Tap to email' },
  whatsapp: { row: 'bg-green-50', icon: 'bg-green-100 text-green-700', hint: 'Tap to chat' },
  address: { row: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-700', hint: 'Tap for directions' },
  website: { row: 'bg-white', icon: 'bg-stone-50 text-[#153551]', hint: 'Tap to open' },
} as const;

function ContactRow({
  icon,
  label,
  value,
  note,
  onClick,
  tone,
  verified,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  onClick?: () => void;
  tone: keyof typeof CONTACT_TONE;
  verified?: boolean;
}) {
  const look = CONTACT_TONE[tone];
  const content = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${look.icon}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-stone-500">{label}</span>
        <span className="flex items-center gap-1.5">
          <span className="block truncate text-sm font-semibold text-[#153551]">{value}</span>
          {verified ? <Check size={14} className="shrink-0 text-green-600" aria-label="Verified" /> : null}
        </span>
        {note ? <span className="mt-0.5 block text-[11px] leading-4 text-[#9a3412]">{note}</span> : null}
        {onClick ? <span className="mt-0.5 block text-[11px] font-medium text-stone-500">• {look.hint}</span> : null}
      </span>
      {onClick ? <ChevronRight size={16} className="shrink-0 text-stone-300" /> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-3 py-3 text-left ${look.row}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`flex items-center gap-3 px-3 py-3 ${look.row}`}>{content}</div>;
}

export default function BusinessProfileContactAside({
  contactRevealed,
  profileRedirectPath,
  phoneLink,
  phone,
  email,
  whatsapp,
  website,
  address,
  paymentModes,
  socialLinks,
  onCall,
  onEmail,
  onWhatsApp,
  className = '',
  phoneVerified = true,
  emailVerified = true,
  whatsappVerified = true,
  onAddress,
}: BusinessProfileContactAsideProps) {
  const loginHref = buildLoginHref(profileRedirectPath);
  const websiteHref = website ? normalizeExternalHref(website) : null;
  const whatsappNumber = whatsapp?.trim() || '';
  const hasContact = Boolean(phoneLink || email || whatsappNumber || website || address);

  return (
    <section id="contact" className={`scroll-mt-40 px-4 pt-6 lg:rounded-[28px] lg:border lg:border-[#e7e5e4] lg:bg-white lg:p-5 lg:shadow-[0_18px_50px_-32px_rgba(28,25,23,0.28)] ${className}`}>
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
              Phone, email, and WhatsApp stay private until you sign in.
            </span>
          </span>
          <ChevronRight size={16} className="text-[#153551]" />
        </Link>
      ) : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-[#e7e5e4] bg-white lg:mt-4">
        {hasContact ? (
          <div className="divide-y divide-stone-100">
            {phoneLink ? (
              <ContactRow
                icon={<Phone size={16} />}
                label="Phone"
                tone="phone"
                value={contactRevealed ? phone : getMaskedPhoneNumber(phone)}
                note={contactRevealed && !phoneVerified ? 'Unverified number' : undefined}
                verified={contactRevealed && phoneVerified}
                onClick={onCall}
              />
            ) : null}
            {email ? (
              <ContactRow
                icon={<Mail size={16} />}
                label="Email"
                tone="email"
                value={contactRevealed ? email : getMaskedEmail(email)}
                note={contactRevealed && !emailVerified ? 'Unverified email' : undefined}
                verified={contactRevealed && emailVerified}
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
            {whatsappNumber ? (
              <ContactRow
                icon={<FaWhatsapp size={16} />}
                label="WhatsApp"
                tone="whatsapp"
                value={contactRevealed ? whatsappNumber : getMaskedPhoneNumber(whatsappNumber)}
                note={contactRevealed && !whatsappVerified ? 'Unverified WhatsApp' : undefined}
                verified={contactRevealed && whatsappVerified}
                onClick={onWhatsApp}
              />
            ) : null}
            {websiteHref ? (
              <ContactRow
                icon={<Globe size={16} />}
                label="Website"
                tone="website"
                value={websiteHref.replace(/^https?:\/\//, '')}
                onClick={() => {
                  window.open(websiteHref, '_blank', 'noopener,noreferrer');
                }}
              />
            ) : null}
            {address ? (
              <ContactRow
                icon={<MapPin size={16} />}
                label="Address"
                tone="address"
                value={address}
                onClick={onAddress}
              />
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
