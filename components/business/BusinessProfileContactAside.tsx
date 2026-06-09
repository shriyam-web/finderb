import { ExternalLink } from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';

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
  phoneLink: string | null | undefined;
  phone: string;
  email?: string;
  website?: string;
  paymentModes: string[];
  socialLinks: SocialLink[];
  onEnquire: () => void;
};

function ContactRow({
  label,
  href,
  children,
  external = false,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5">
        <a
          href={href}
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
  phoneLink,
  phone,
  email,
  website,
  paymentModes,
  socialLinks,
  onEnquire,
}: BusinessProfileContactAsideProps) {
  const hasContact = phoneLink || email || website;

  return (
    <aside className="border border-stone-200 bg-[#fffdf8] p-5 lg:sticky lg:top-32 lg:self-start">
      <h3 className="text-sm font-semibold text-[#153551]">Contact</h3>

      {hasContact ? (
        <dl className="mt-4 space-y-3.5">
          {phoneLink && (
            <ContactRow label="Phone" href={phoneLink}>
              {phone}
            </ContactRow>
          )}
          {email && (
            <ContactRow label="Email" href={`mailto:${email}`}>
              {email}
            </ContactRow>
          )}
          {website && (
            <ContactRow label="Website" href={website} external>
              <span className="inline-flex items-center gap-1">
                Visit website <ExternalLink size={11} />
              </span>
            </ContactRow>
          )}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-stone-500">No contact details listed.</p>
      )}

      {paymentModes.length > 0 && (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="text-xs text-stone-500">Payment accepted</p>
          <p className="mt-1 text-sm text-stone-700">{paymentModes.join(', ')}</p>
        </div>
      )}

      {socialLinks.length > 0 && (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="text-xs text-stone-500">Social</p>
          <ul className="mt-2.5 space-y-2">
            {socialLinks.map((link) => {
              const brand = SOCIAL_BRAND[link.label];
              const Icon = brand?.Icon;
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
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
        className="mt-5 w-full border border-[#215481] bg-[#215481] py-2.5 text-sm font-semibold text-white hover:bg-[#1a4367]"
      >
        Send enquiry
      </button>
    </aside>
  );
}
