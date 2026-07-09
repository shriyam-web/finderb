import Link from 'next/link';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import { buildLoginHref, buildSignupHref } from '@/lib/authRedirect';
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
  paymentModes: string[];
  socialLinks: SocialLink[];
  onCall: () => void;
  onEnquire: () => void;
};

function getMaskedPhoneNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Hidden until you sign in';

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return 'Hidden until you sign in';

  const visibleStart = digits.slice(0, 2);
  const visibleEnd = digits.slice(-2);
  const hidden = '•'.repeat(Math.max(2, digits.length - 4));

  return `${visibleStart}${hidden}${visibleEnd}`;
}

function getMaskedEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes('@')) return 'Hidden until you sign in';

  const [localPart, domainPart] = trimmed.split('@');
  if (!localPart || !domainPart) return 'Hidden until you sign in';

  const visibleStart = localPart.slice(0, 2);
  const hidden = '•'.repeat(Math.max(2, localPart.length - 2));

  return `${visibleStart}${hidden}@${domainPart}`;
}

function ContactRow({
  label,
  href,
  children,
  external = false,
  onClick,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
  external?: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5">
        <a
          href={href}
          onClick={onClick}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-sm font-medium text-[#153551] hover:underline"
        >
          {children}
        </a>
      </dd>
    </div>
  );
}

export default function BusinessProfileContactAside({
  contactRevealed,
  profileRedirectPath,
  phoneLink,
  phone,
  email,
  website,
  paymentModes,
  socialLinks,
  onCall,
  onEnquire,
}: BusinessProfileContactAsideProps) {
  const hasContact = phoneLink || email || website;
  const loginHref = buildLoginHref(profileRedirectPath);
  const signupHref = buildSignupHref(profileRedirectPath);

  return (
    <aside className="border border-stone-200 bg-stone-50 p-5 lg:sticky lg:top-32 lg:self-start">
      <h3 className="text-sm font-semibold text-[#153551]">Contact</h3>

      {!contactRevealed && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-100/80 px-3 py-3 text-sm text-stone-700">
          <p>Sign in or Create Account to continue.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={loginHref}
              className="inline-flex rounded-md bg-[#215481] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a4367]"
            >
              Sign in
            </Link>
            <Link
              href={signupHref}
              className="inline-flex rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#215481] hover:bg-stone-50"
            >
              Create account
            </Link>
          </div>
        </div>
      )}

      {hasContact ? (
        <dl className={`space-y-3.5 ${contactRevealed ? 'mt-4' : 'mt-3'}`}>
          {phoneLink && contactRevealed && (
            <ContactRow
              label="Phone"
              href={phoneLink}
              onClick={(event) => {
                event.preventDefault();
                onCall();
              }}
            >
              {phone}
            </ContactRow>
          )}
          {phoneLink && !contactRevealed && (
            <div>
              <dt className="text-xs text-stone-500">Phone</dt>
              <dd className="mt-0.5 text-sm">
                <Link href={loginHref} className="text-stone-400 hover:underline">
                  {getMaskedPhoneNumber(phone)}
                </Link>
              </dd>
            </div>
          )}
          {email && contactRevealed && (
            <ContactRow label="Email" href={`mailto:${email}`}>
              {email}
            </ContactRow>
          )}
          {email && !contactRevealed && (
            <div>
              <dt className="text-xs text-stone-500">Email</dt>
              <dd className="mt-0.5 text-sm">
                <Link href={loginHref} className="text-stone-400 hover:underline">
                  {getMaskedEmail(email)}
                </Link>
              </dd>
            </div>
          )}
          {website && (
            <ContactRow label="Website" href={normalizeExternalHref(website) ?? website} external>
              <span className="break-all">{website}</span>
            </ContactRow>
          )}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-stone-500">No contact details listed.</p>
      )}

      {paymentModes.length > 0 && (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="text-xs text-stone-500">Payment accepted</p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {paymentModes.map((mode) => {
              const Icon = getPaymentModeIcon(mode);
              return (
                <li
                  key={mode}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700"
                >
                  <Icon size={14} className="shrink-0 text-[#215481]" aria-hidden />
                  {mode}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {socialLinks.length > 0 && (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="text-xs text-stone-500">Social</p>
          <ul className="mt-2.5 space-y-2">
            {socialLinks.map((link) => {
              const brand = SOCIAL_BRAND[link.label];
              const Icon = brand?.Icon;
              const href = normalizeExternalHref(link.href);
              if (!href) return null;
              return (
                <li key={link.label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#153551] hover:underline"
                  >
                    {Icon ? (
                      <Icon size={17} className={brand.colorClass} aria-hidden />
                    ) : null}
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onEnquire}
        className="mt-5 w-full border border-[#215481] bg-[#215481] py-2.5 text-sm font-semibold text-white hover:bg-[#1a4367] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!contactRevealed}
      >
        {contactRevealed ? 'Send enquiry' : 'Sign in to send enquiry'}
      </button>
    </aside>
  );
}
