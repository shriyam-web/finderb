export type ContactIntent = 'call' | 'whatsapp' | 'enquire';

export const CONTACT_INTENTS: ContactIntent[] = ['call', 'whatsapp', 'enquire'];

export function isContactIntent(value: string | null | undefined): value is ContactIntent {
  return CONTACT_INTENTS.includes(value as ContactIntent);
}

export const DIRECT_LEAD_MESSAGES: Record<ContactIntent, string> = {
  call: 'Clicked Call on business profile',
  whatsapp: 'Clicked WhatsApp on business profile',
  enquire: 'Opened enquiry form on business profile',
};

export function buildProfileIntentPath(profilePath: string, intent: ContactIntent): string {
  const base = profilePath.split('?')[0];
  const hashIndex = profilePath.indexOf('#');
  const hash = hashIndex >= 0 ? profilePath.slice(hashIndex) : '';
  return `${base}?intent=${intent}${hash}`;
}
