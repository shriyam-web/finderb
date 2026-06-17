export const LEGAL_COMPANY = {
  name: 'MAAGAA Connect Private Limited',
  brand: 'FinderB',
  website: 'https://finderb.com',
  email: 'support@finderb.com',
  privacyEmail: 'privacy@finderb.com',
  legalEmail: 'legal@finderb.com',
  refundsEmail: 'refunds@finderb.com',
  phone: '1800-000-0000',
  phoneDisplay: '+91 1800-000-0000',
  address: {
    line1: 'MAAGAA Connect Private Limited',
    line2: 'Bangalore, Karnataka',
    country: 'India',
    pincode: '560001',
  },
  businessHours: {
    weekdays: 'Monday – Friday: 9:00 AM – 6:00 PM IST',
    saturday: 'Saturday: 10:00 AM – 4:00 PM IST',
    sunday: 'Sunday: Closed',
  },
  grievanceOfficer: {
    name: 'Customer Support Team',
    email: 'support@finderb.com',
    responseTime: 'within 7 working days',
  },
} as const;

export const LEGAL_LAST_UPDATED = 'June 17, 2025';

export const LEGAL_FOOTER_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Cancellation & Refund', href: '/cancellation-refund' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Shipping & Delivery', href: '/shipping-delivery' },
] as const;
