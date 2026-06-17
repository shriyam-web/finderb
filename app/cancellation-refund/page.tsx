import type { Metadata } from 'next';
import LegalPageLayout, {
  LegalContactBox,
  LegalList,
  LegalSection,
} from '@/components/legal/LegalPageLayout';
import { LEGAL_COMPANY } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Cancellation and Refund Policy',
  description:
    'FinderB cancellation and refund policy for merchant subscription plans and online payments processed via Razorpay.',
  alternates: { canonical: '/cancellation-refund' },
};

export default function CancellationRefundPage() {
  return (
    <LegalPageLayout
      title="Cancellation & Refund"
      description="How to cancel a subscription and when refunds apply for payments made on FinderB."
    >
      <LegalSection title="1. Scope">
        <p>
          This Cancellation and Refund Policy applies to subscription payments made on{' '}
          {LEGAL_COMPANY.website} for merchant plans such as Growth Pro, processed through our
          payment partner Razorpay. FinderB primarily offers digital platform services — not physical
          goods.
        </p>
      </LegalSection>

      <LegalSection title="2. Subscription Activation">
        <p>
          Paid features are activated after successful payment confirmation from Razorpay. If
          payment fails or remains pending, subscription benefits will not be activated.
        </p>
      </LegalSection>

      <LegalSection title="3. Cancellation by Merchant">
        <p>Merchants may cancel auto-renewal or stop using a paid plan by:</p>
        <LegalList
          items={[
            `Contacting support at ${LEGAL_COMPANY.email} before the next billing date`,
            'Requesting cancellation through the merchant dashboard, where available',
          ]}
        />
        <p>
          Cancellation stops future charges for the next billing cycle. Access to paid features
          generally continues until the end of the already-paid subscription period unless otherwise
          stated at checkout.
        </p>
      </LegalSection>

      <LegalSection title="4. Refund Eligibility">
        <p>Refunds may be considered in the following situations:</p>
        <LegalList
          items={[
            'Duplicate payment for the same plan and billing period',
            'Payment debited but subscription not activated due to a technical error on our side',
            'Unauthorized transaction reported within the applicable bank or Razorpay dispute window',
            'Service not delivered as described due to a verified platform failure',
          ]}
        />
        <p>
          Refunds are generally not provided for partial use of a subscription period, change of
          mind after activation, or dissatisfaction with leads or business outcomes, as FinderB
          provides digital access to platform features rather than guaranteed commercial results.
        </p>
      </LegalSection>

      <LegalSection title="5. Refund Process">
        <p>To request a refund, email {LEGAL_COMPANY.email} with:</p>
        <LegalList
          items={[
            'Registered business name and account email',
            'Razorpay payment ID or order ID',
            'Date and amount of transaction',
            'Reason for the refund request',
            'Supporting screenshots or bank statements, if applicable',
          ]}
        />
        <p>
          Approved refunds are processed back to the original payment method through Razorpay within
          7–10 business days, depending on your bank or payment provider. FinderB does not control
          the final credit timeline once the refund is initiated.
        </p>
      </LegalSection>

      <LegalSection title="6. Chargebacks & Disputes">
        <p>
          If you dispute a charge with your bank or card issuer, please also notify us at{' '}
          {LEGAL_COMPANY.email} so we can investigate promptly. Unfounded chargebacks for
          services already delivered may result in account suspension.
        </p>
      </LegalSection>

      <LegalSection title="7. Cancellation by FinderB">
        <p>
          We may suspend or cancel a subscription if a merchant violates our Terms and Conditions,
          engages in fraud, or misuses paid features. In such cases, refunds are issued only where
          required by law or at our sole discretion.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact for Refunds">
        <p>For cancellation or refund assistance, contact:</p>
        <LegalContactBox
          email={LEGAL_COMPANY.email}
          note="Please include your Razorpay payment ID for faster resolution."
        />
      </LegalSection>
    </LegalPageLayout>
  );
}
