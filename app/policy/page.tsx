'use client';

import { LEGAL_COMPANY } from '@/lib/legalContent';

export default function PolicyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white overflow-hidden">
            <main className="flex-1 pt-24 lg:pt-32 pb-24">
                <section className="px-4 mb-32 relative">
                    <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm">
                            Legal
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tight leading-[0.95]">
                            Infringement Policy
                        </h1>
                        <p className="text-gray-500 text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                            Our policy on intellectual property infringement and how we handle copyright complaints.
                        </p>
                    </div>
                </section>

                <section className="max-w-4xl mx-auto px-4 mb-32">
                    <div className="prose prose-lg max-w-none">
                        <div className="bg-gray-50 rounded-3xl p-8 md:p-12 mb-8">
                            <p className="text-sm text-gray-500 mb-4">Last updated: January 1, 2024</p>
                        </div>

                        <div className="space-y-12">
                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">1. Copyright Infringement</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>FinderB respects the intellectual property rights of others and expects its users to do the same. It is our policy to respond to clear notices of alleged copyright infringement.</p>
                                    <p>If you believe that your work has been copied in a way that constitutes copyright infringement, please provide our designated agent with the following information:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>A physical or electronic signature of the copyright owner or authorized person</li>
                                        <li>Identification of the copyrighted work claimed to have been infringed</li>
                                        <li>Identification of the material that is claimed to be infringing</li>
                                        <li>Your contact information, including address, telephone number, and email</li>
                                        <li>A statement that you have a good faith belief that use of the material is not authorized</li>
                                        <li>A statement that the information is accurate and that you are authorized to act on behalf of the copyright owner</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">2. Counter-Notification</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>If you believe that your content was removed or access to it was disabled by mistake or misidentification, you may file a counter-notification.</p>
                                    <p>Your counter-notification must include:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Your physical or electronic signature</li>
                                        <li>Identification of the material that has been removed or disabled</li>
                                        <li>A statement under penalty of perjury that you have a good faith belief that the material was removed by mistake</li>
                                        <li>Your name, address, and telephone number</li>
                                        <li>A statement that you consent to the jurisdiction of the federal court</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">3. Repeat Infringers</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>FinderB will terminate the accounts of users who are determined to be repeat infringers of copyright or other intellectual property rights.</p>
                                    <p>A repeat infringer is a user who has been notified of infringing activity more than once.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">4. Trademark Infringement</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>FinderB prohibits the use of trademarks, service marks, or trade dress that are likely to cause confusion about the source or sponsorship of goods or services.</p>
                                    <p>If you believe that your trademark has been infringed, please contact us with the relevant details.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">5. Contact Information</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>For copyright infringement claims or counter-notifications, please contact our designated agent:</p>
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <p><strong>Copyright Agent</strong></p>
                                        <p><strong>Email:</strong> copyright@finderb.com</p>
                                        <p><strong>Address:</strong> 123 Business Street, Tech City, Karnataka, India - 560001</p>
                                        <p><strong>Phone:</strong> {LEGAL_COMPANY.phoneDisplay}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">6. Changes to This Policy</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>We reserve the right to modify this Infringement Policy at any time. Changes will be effective immediately upon posting on our website.</p>
                                    <p>Your continued use of FinderB after any such changes constitutes your acceptance of the new policy.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}