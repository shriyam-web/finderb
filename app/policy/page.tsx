import Link from 'next/link';
import { LEGAL_COMPANY, LEGAL_LAST_UPDATED, SHOW_COMPANY_ADDRESS, SHOW_COMPANY_PHONE } from '@/lib/legalContent';

export default function PolicyPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'FinderB infringement policy',
    url: 'https://finderb.com/policy',
    description:
      'How FinderB handles copyright and trademark complaints, counter-notices, and repeat infringement.',
    dateModified: '2026-09-01',
  };

  return (
    <div className="finderb-single-font min-h-[calc(100dvh-6.75rem)] bg-[#fafaf9] lg:min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-20 sm:px-6 lg:pt-32">
        <header className="border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium text-[#215481]">Legal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Infringement policy
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            How {LEGAL_COMPANY.brand} handles claims that a listing, photo, or other material on the site infringes a copyright or trademark.
          </p>
          <p className="mt-3 text-sm text-neutral-500">Last updated: {LEGAL_LAST_UPDATED}</p>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">1. Copyright infringement</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-7 text-neutral-700">
            <p>
              FinderB respects the intellectual property rights of others and expects its users to do the same. We respond to clear notices of alleged copyright infringement.
            </p>
            <p>If you believe your work has been copied in a way that infringes your copyright, send our designated contact the following:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>A physical or electronic signature of the copyright owner, or of a person authorized to act for them</li>
              <li>Identification of the copyrighted work you claim has been infringed</li>
              <li>The address of the material on FinderB that you claim is infringing, so we can find it</li>
              <li>Your name, address, telephone number, and email</li>
              <li>A statement that you have a good-faith belief the use is not authorized by the owner, an agent, or the law</li>
              <li>A statement that the information in the notice is accurate, and that you are authorized to act for the copyright owner</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">2. Counter-notice</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-7 text-neutral-700">
            <p>
              If you believe your content was removed, or access to it was disabled, by mistake or misidentification, you may send a counter-notice.
            </p>
            <p>The counter-notice must include:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Your physical or electronic signature</li>
              <li>Identification of the material that was removed or disabled, and where it appeared</li>
              <li>A statement under penalty of perjury that you have a good-faith belief the material was removed or disabled by mistake or misidentification</li>
              <li>Your name, address, and telephone number</li>
              <li>A statement that you consent to the jurisdiction of the competent court, and that you will accept service of process from the person who sent the original notice</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">3. Repeat infringement</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-7 text-neutral-700">
            <p>
              FinderB will close the account of a user who is found to repeatedly infringe copyright or other intellectual property rights.
            </p>
            <p>A repeat infringer is a user who has been notified of infringing activity more than once.</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">4. Trademark infringement</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-7 text-neutral-700">
            <p>
              FinderB does not allow use of a trademark, service mark, or trade dress that is likely to confuse people about who offers a product or service.
            </p>
            <p>
              If you believe your trademark is being used that way on FinderB, write to us with the mark, the listing or page where it appears, and how we can reach you.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">5. Where to send a notice</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-7 text-neutral-700">
            <p>Send copyright notices and counter-notices to the contact below. Use the subject line “Copyright notice” or “Copyright counter-notice”.</p>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm leading-6 text-neutral-800">
              <p className="font-medium text-neutral-900">{LEGAL_COMPANY.name}</p>
              <p>Copyright notices for {LEGAL_COMPANY.brand}</p>
              <p className="mt-2">
                Email:{' '}
                <a href={`mailto:${LEGAL_COMPANY.email}`} className="font-medium text-[#215481] underline underline-offset-2">
                  {LEGAL_COMPANY.email}
                </a>
              </p>
              {SHOW_COMPANY_ADDRESS ? (
                <p>
                  Address: {LEGAL_COMPANY.address.line2}, {LEGAL_COMPANY.address.country} {LEGAL_COMPANY.address.pincode}
                </p>
              ) : null}
              {SHOW_COMPANY_PHONE ? <p>Phone: {LEGAL_COMPANY.phoneDisplay}</p> : null}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">6. Changes to this policy</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-7 text-neutral-700">
            <p>
              We may update this policy. The new version applies from the time it is posted on this page, and the date above will change.
            </p>
            <p>If you keep using FinderB after a change, that means you accept the updated policy.</p>
          </div>
        </section>

        <section className="mt-12 border-t border-neutral-200 pt-8">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Related pages</h2>
          <ul className="mt-4 space-y-2 text-[15px] leading-7">
            <li>
              <Link href="/privacy" className="font-medium text-[#215481] underline underline-offset-2">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="font-medium text-[#215481] underline underline-offset-2">
                Terms and conditions
              </Link>
            </li>
            <li>
              <Link href="/contact" className="font-medium text-[#215481] underline underline-offset-2">
                Contact FinderB
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
