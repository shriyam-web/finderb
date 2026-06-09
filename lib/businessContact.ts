export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function phoneHref(phone: string) {
  const digits = digitsOnly(phone);
  return digits ? `tel:+${digits.length === 10 ? `91${digits}` : digits}` : undefined;
}

export function whatsAppHref(number: string, businessName: string) {
  const digits = digitsOnly(number);
  if (!digits) return undefined;
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(
    `Hi, I found ${businessName} on FinderB and would like to know more.`
  );
  return `https://wa.me/${withCountry}?text=${text}`;
}

export function directionsHref(options: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  location?: string | null;
}) {
  const query =
    options.latitude != null && options.longitude != null
      ? `${options.latitude},${options.longitude}`
      : (options.address || options.location || '').trim();

  if (!query) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapEmbedSrc(options: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  location?: string | null;
}) {
  const query =
    options.latitude != null && options.longitude != null
      ? `${options.latitude},${options.longitude}`
      : (options.address || options.location || '').trim();

  if (!query) return undefined;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export type ShareBusinessResult = 'shared' | 'copied' | 'cancelled' | 'unsupported';

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy copy.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export async function shareBusinessPage(title: string, url: string): Promise<ShareBusinessResult> {
  const shareTitle = `Check out ${title} on FinderB`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: shareTitle, text: shareTitle, url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (await copyTextToClipboard(url)) {
    return 'copied';
  }

  return 'unsupported';
}
