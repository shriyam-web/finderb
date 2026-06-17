import type { Metadata } from 'next';
import LegalPageLayout, {
  LegalContactBox,
  LegalList,
  LegalSection,
} from '@/components/legal/LegalPageLayout';
import { LEGAL_COMPANY } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'Terms and conditions governing your use of FinderB, including merchant subscriptions, payments, and platform rules.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      description="Please read these terms carefully before using FinderB or purchasing any paid merchant plans."
    >
      <LegalSection title="1. Agreement to Terms">
        <p>
          By accessing or using {LEGAL_COMPANY.website} (the &quot;Platform&quot;) operated by{' '}
          {LEGAL_COMPANY.name}, you agree to be bound by these Terms and Conditions. If you do not
          agree, please do not use the Platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Services Offered">
        <p>
          FinderB provides a local business discovery platform that allows users to search for
          businesses and services, and allows merchants to create listings, receive enquiries, and
          optionally subscribe to paid plans such as Growth Pro for enhanced visibility and lead
          access.
        </p>
        <p>
          FinderB acts as an intermediary platform. Unless explicitly stated, we are not the provider
          of third-party services listed on the Platform and are not responsible for the quality,
          safety, or delivery of services offered by listed businesses.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility">
        <p>
          You must be at least 18 years old and capable of entering into a binding contract under
          Indian law to register a business or purchase a paid plan. By using the Platform, you
          represent that the information you provide is accurate and complete.
        </p>
      </LegalSection>

      <LegalSection title="4. User Accounts">
        <p>When you create an account, you agree to:</p>
        <LegalList
          items={[
            'Provide accurate, current, and complete registration information',
            'Maintain the security of your login credentials',
            'Notify us promptly of any unauthorized access to your account',
            'Accept responsibility for activities conducted through your account',
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Merchant Listings & Subscriptions">
        <p>
          Merchants may register a business profile and optionally purchase subscription plans. Plan
          features, pricing, and billing cycles are displayed on the pricing and checkout pages at
          the time of purchase. Subscription benefits such as lead access, verified badges, and
          premium placement are activated after successful payment confirmation.
        </p>
        <p>
          You agree not to post false, misleading, infringing, or unlawful content in your listing.
          We reserve the right to review, moderate, suspend, or remove listings that violate these
          terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection title="6. Payments">
        <p>
          All online payments on FinderB are processed through Razorpay, our authorized payment
          gateway partner. By making a payment, you also agree to Razorpay&apos;s terms and
          applicable payment network rules. Prices are shown in Indian Rupees (INR) and include
          applicable taxes unless stated otherwise.
        </p>
        <p>
          Failed, incomplete, or disputed transactions may result in delayed or revoked access to
          paid features until the issue is resolved.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable Use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            'Use the Platform for unlawful, fraudulent, or harmful purposes',
            'Scrape, copy, or redistribute Platform content without permission',
            'Impersonate another person or business',
            'Upload malware, spam, or misleading information',
            'Interfere with the security or operation of the Platform',
            'Circumvent payment or access controls for paid features',
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Intellectual Property">
        <p>
          The {LEGAL_COMPANY.brand} name, logo, software, and platform design are owned by{' '}
          {LEGAL_COMPANY.name} or its licensors. Merchants retain ownership of their own business
          content but grant {LEGAL_COMPANY.brand} a non-exclusive license to display, promote, and
          distribute listing content on the Platform.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do
          not warrant uninterrupted access, error-free operation, or specific business outcomes from
          using paid plans. Listings and reviews reflect user and merchant-provided information.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, {LEGAL_COMPANY.name} shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising from your use of
          the Platform, including loss of profits, data, or business opportunities.
        </p>
      </LegalSection>

      <LegalSection title="11. Termination">
        <p>
          We may suspend or terminate your account or listing if you breach these terms, engage in
          fraudulent activity, or if required by law. Upon termination, your right to use the
          Platform ceases, subject to any surviving payment, refund, or legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing Law">
        <p>
          These Terms are governed by the laws of India. Courts in Bangalore, Karnataka shall have
          exclusive jurisdiction over disputes arising from these Terms, subject to applicable
          consumer protection laws.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact Information">
        <p>For questions about these Terms and Conditions, contact:</p>
        <LegalContactBox email={LEGAL_COMPANY.legalEmail} phone={LEGAL_COMPANY.phoneDisplay} />
      </LegalSection>
    </LegalPageLayout>
  );
}
