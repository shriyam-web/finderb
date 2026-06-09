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

export async function shareBusinessPage(title: string, url: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title, url });
    return 'shared';
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return 'copied';
  }

  return 'unsupported';
}
