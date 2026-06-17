import type { Metadata } from 'next';
import LegalPageLayout, {
  LegalContactBox,
  LegalList,
  LegalSection,
} from '@/components/legal/LegalPageLayout';
import { LEGAL_COMPANY } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how FinderB collects, uses, stores, and protects your personal information, including payment data processed via Razorpay.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How we handle your data when you use FinderB — as a visitor, user, or registered business."
    >
      <LegalSection title="1. Introduction">
        <p>
          {LEGAL_COMPANY.name} (&quot;{LEGAL_COMPANY.brand}&quot;, &quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;) operates {LEGAL_COMPANY.website}, a local business discovery and merchant
          services platform in India. This Privacy Policy describes how we handle personal information
          when you browse listings, create an account, register a business, or purchase paid plans.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>We may collect the following categories of information:</p>
        <LegalList
          items={[
            'Identity & contact details: name, email address, phone number, business name, and address',
            'Account & profile data: login credentials, business category, photos, descriptions, and verification documents submitted for KYC',
            'Transaction data: plan selected, billing cycle, payment status, order IDs, and invoices for merchant subscriptions',
            'Payment information: payments are processed by Razorpay. We do not store full card, UPI PIN, or net-banking credentials on our servers',
            'Usage data: pages visited, searches, clicks, device type, browser, IP address, and approximate location for local discovery',
            'Communications: messages you send through contact forms, support requests, and lead enquiries',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <p>We use collected information to:</p>
        <LegalList
          items={[
            'Provide, operate, and improve the FinderB platform',
            'Create and manage user and merchant accounts',
            'Process subscription payments and deliver paid features such as lead access and premium visibility',
            'Verify businesses, prevent fraud, and maintain platform safety',
            'Respond to support requests and communicate service updates',
            'Send transactional messages related to payments, renewals, and account activity',
            'Analyze usage to improve search, recommendations, and product experience',
            'Comply with applicable laws, regulations, and lawful requests',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Payment Processing">
        <p>
          Online payments on FinderB are facilitated through Razorpay Software Private Limited, a
          third-party payment gateway. When you make a payment, Razorpay may collect and process
          payment information in accordance with its own privacy policy and RBI guidelines. We
          receive limited payment confirmation details such as transaction ID, amount, status, and
          billing metadata required to activate your plan.
        </p>
      </LegalSection>

      <LegalSection title="5. Information Sharing">
        <p>
          We do not sell your personal information. We may share information only with trusted
          service providers who help us operate the platform, including payment processors,
          hosting providers, analytics tools, and customer support systems — under appropriate
          confidentiality and data protection obligations.
        </p>
        <p>We may also disclose information when required by law or to protect our rights, users, and platform integrity.</p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain personal information for as long as necessary to provide services, comply with
          legal obligations, resolve disputes, and enforce agreements. Payment and invoice records may
          be retained as required under applicable tax and accounting laws in India.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Security">
        <p>
          We implement reasonable technical and organizational safeguards, including encrypted
          connections (HTTPS), access controls, and secure infrastructure. However, no method of
          transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Rights">
        <p>Subject to applicable law, you may request to:</p>
        <LegalList
          items={[
            'Access the personal information we hold about you',
            'Correct inaccurate or incomplete information',
            'Delete your account and associated data, where permitted',
            'Withdraw consent for optional communications',
            'Raise a grievance regarding data handling',
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          We use cookies and similar technologies to keep you signed in, remember preferences, and
          understand how the platform is used. You can manage cookies through your browser settings,
          though some features may not function properly if cookies are disabled.
        </p>
      </LegalSection>

      <LegalSection title="10. Grievance Officer">
        <p>
          In accordance with the Information Technology Act, 2000 and applicable rules, the grievance
          officer for {LEGAL_COMPANY.brand} is:
        </p>
        <LegalContactBox
          email={LEGAL_COMPANY.grievanceOfficer.email}
          note={`We aim to respond to privacy-related grievances ${LEGAL_COMPANY.grievanceOfficer.responseTime}.`}
        />
      </LegalSection>

      <LegalSection title="11. Contact Us">
        <p>For privacy-related questions, contact us at:</p>
        <LegalContactBox email={LEGAL_COMPANY.email} />
      </LegalSection>
    </LegalPageLayout>
  );
}
