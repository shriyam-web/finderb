import type { Metadata } from 'next';
import LegalPageLayout, {
  LegalContactBox,
  LegalList,
  LegalSection,
} from '@/components/legal/LegalPageLayout';
import { LEGAL_COMPANY } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Shipping and Delivery Policy',
  description:
    'FinderB shipping and delivery policy for digital merchant subscriptions and platform services.',
  alternates: { canonical: '/shipping-delivery' },
};

export default function ShippingDeliveryPage() {
  return (
    <LegalPageLayout
      title="Shipping and Delivery Policy"
      description="FinderB provides digital platform services. This policy explains how access and delivery of our services work after purchase."
    >
      <LegalSection title="1. Nature of Services">
        <p>
          {LEGAL_COMPANY.brand} is a digital business discovery and merchant services platform. We
          do not sell or ship physical products. Payments made on the Platform are for digital
          services such as business listing enhancements, lead access, verified badges, analytics,
          and other subscription features described at the time of purchase.
        </p>
      </LegalSection>

      <LegalSection title="2. Service Delivery">
        <p>Upon successful payment through Razorpay:</p>
        <LegalList
          items={[
            'Your merchant subscription is activated on your FinderB business account',
            'Paid features such as lead center access, premium visibility, and verified status are enabled electronically',
            'A payment confirmation and plan activation notice is sent to your registered email where applicable',
            'No physical shipment, courier, or postal delivery is involved',
          ]}
        />
        <p>
          Activation is typically immediate but may take up to 24 hours in rare cases involving
          payment verification delays, KYC review, or technical issues.
        </p>
      </LegalSection>

      <LegalSection title="3. Delivery Timeline">
        <LegalList
          items={[
            'Instant activation: Most successful online payments activate paid features within minutes',
            'Delayed activation: If payment status is pending or under review, access is granted once Razorpay confirms success',
            'Manual review: Listings requiring verification may have certain features enabled only after profile or KYC approval',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Geographic Availability">
        <p>
          FinderB services are currently offered to businesses operating in India. Digital service
          delivery is available anywhere you can access your merchant dashboard with an internet
          connection. Local discovery features depend on the city and category coverage available on
          the Platform.
        </p>
      </LegalSection>

      <LegalSection title="5. Access Issues">
        <p>
          If you have completed payment but cannot access your paid plan features within 24 hours,
          please contact us with your registered email and Razorpay payment ID. We will investigate
          and restore access or process a refund if the service could not be delivered.
        </p>
      </LegalSection>

      <LegalSection title="6. Third-Party Services">
        <p>
          Businesses listed on FinderB may offer their own physical services or products. Shipping,
          on-site visits, appointments, and fulfilment for those third-party services are solely the
          responsibility of the respective business and are not covered by this policy.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact Us">
        <p>For questions about service delivery or activation, contact:</p>
        <LegalContactBox email={LEGAL_COMPANY.email} phone={LEGAL_COMPANY.phoneDisplay} />
      </LegalSection>
    </LegalPageLayout>
  );
}
