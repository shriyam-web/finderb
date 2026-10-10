import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';
import DeleteAccountPanel from '@/components/account/DeleteAccountPanel';
import { getSession } from '@/app/actions/user';
import { LEGAL_COMPANY } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Delete your FinderB account',
  description:
    'Request or complete deletion of your FinderB user account and associated personal data. Required for Google Play account deletion.',
  alternates: { canonical: '/account-deletion' },
};

export const dynamic = 'force-dynamic';

export default async function AccountDeletionPage() {
  const session = await getSession();
  const user = session?.success ? session.user : null;

  return (
    <LegalPageLayout
      title="Delete your FinderB account"
      description="Google Play and our privacy policy require a way to delete your user account and the personal data tied to it."
    >
      <LegalSection title="What is deleted">
        <p>
          Deleting your user account removes your FinderB profile (name, email, phone if stored,
          saved places, search history, and app sign-in). It applies to both {LEGAL_COMPANY.website}{' '}
          and the FinderB Android app.
        </p>
      </LegalSection>

      <LegalSection title="How to delete">
        <DeleteAccountPanel signedIn={Boolean(user)} email={user?.email} />
      </LegalSection>

      <LegalSection title="In the FinderB app">
        <p>
          Open Account → Delete account, type DELETE, and confirm. You can also use this page from
          any browser.
        </p>
      </LegalSection>

      <LegalSection title="Business accounts">
        <p>
          Sign in to the FinderB app with your business account and use Account → Delete account,
          or email {LEGAL_COMPANY.email} from your registered email. Your listing is removed, sign-in
          stops working, any active plan is cancelled, and your contact, address, photos, and KYC
          documents are erased. Payment and invoice records are kept as required by Indian tax law.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
