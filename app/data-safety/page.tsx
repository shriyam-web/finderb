import type { Metadata } from 'next';
import LegalPageLayout, {
  LegalContactBox,
  LegalList,
  LegalSection,
} from '@/components/legal/LegalPageLayout';
import { LEGAL_COMPANY } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Data safety — FinderB app',
  description:
    'How the FinderB Android app collects, uses, and shares data. Use this page when filling Google Play Data safety.',
  alternates: { canonical: '/data-safety' },
};

export default function DataSafetyPage() {
  return (
    <LegalPageLayout
      title="Data safety — FinderB app"
      description="Plain-language answers for Google Play Data safety, plus what we collect in the FinderB Android app."
    >
      <LegalSection title="Play Console — overview">
        <p>
          Package name: <span className="font-medium text-neutral-900">com.finderb.app</span>. App
          type: local business discovery. Privacy policy:{' '}
          <a className="underline" href="https://finderb.com/privacy">
            https://finderb.com/privacy
          </a>
          . Account deletion:{' '}
          <a className="underline" href="https://finderb.com/account-deletion">
            https://finderb.com/account-deletion
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Data collected (user-facing)">
        <LegalList
          items={[
            'Name and email — account, support, and to show you as the author of reviews',
            'Phone number — Truecaller sign-in and optional enquiry forms',
            'Approximate and precise location — only if you allow it, to show nearby businesses',
            'App activity — searches, saved places, and enquiries you send to merchants',
            'Photos — Google profile photo if you sign in with Google; business photos are merchant-uploaded',
            'Device identifiers — Expo push token so we can send account and announcement notifications',
          ]}
        />
      </LegalSection>

      <LegalSection title="Play Data safety form — suggested answers">
        <p>When Google asks whether data is collected, use:</p>
        <LegalList
          items={[
            'Personal info: Name, Email address, Phone number — collected, required for account, not sold',
            'Location: Approximate location, Precise location — collected, optional (permission), for nearby search, not sold',
            'App activity: App interactions / in-app search history — collected, for discovery and saved places, not sold',
            'App info and performance: Crash logs / diagnostics if the store or Expo reports them — not used for advertising',
            'Device or other IDs: collected for push notifications and fraud prevention, not sold',
            'Photos and videos: User-generated photos only if a merchant uploads listing images (merchant account). Consumer users typically do not upload photos except a Google avatar.',
            'Financial info: Not collected in the consumer app. Merchant payments happen on the website via Razorpay.',
            'Encryption in transit: Yes',
            'Users can request data deletion: Yes — in-app Delete account and https://finderb.com/account-deletion',
            'Account required: Optional to browse; required to save places, review, or reveal some contact details',
          ]}
        />
      </LegalSection>

      <LegalSection title="Why we collect it">
        <LegalList
          items={[
            'App functionality — sign-in, nearby listings, enquiries, favourites, notifications',
            'Account management — create and delete your user profile',
            'Analytics — improve search and listing quality (aggregated usage, not ads resale)',
          ]}
        />
        <p>We do not use this consumer-app data to show third-party ads, and we do not sell personal information.</p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We share data only with processors that run FinderB: hosting (Vercel), database (Supabase),
          email (Resend, when configured), maps (Google), sign-in (Google / Truecaller), and push
          delivery (Expo). Merchant subscription payments are processed by Razorpay on the website,
          not in the consumer app checkout.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalContactBox email={LEGAL_COMPANY.email} />
      </LegalSection>
    </LegalPageLayout>
  );
}
