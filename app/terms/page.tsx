'use client';

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white overflow-hidden">
            <main className="flex-1 pt-24 lg:pt-32 pb-24">
                <section className="px-4 mb-32 relative">
                    <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm">
                            Legal
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tight leading-[0.95]">
                            Terms of Use
                        </h1>
                        <p className="text-gray-500 text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                            Please read these terms carefully before using our platform.
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
                                <h2 className="text-2xl font-black text-primary mb-6">1. Acceptance of Terms</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>By accessing and using FinderB, you accept and agree to be bound by the terms and provision of this agreement.</p>
                                    <p>If you do not agree to abide by the above, please do not use this service.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">2. Use License</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>Permission is granted to temporarily use FinderB for personal and business use.</p>
                                    <p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by FinderB at any time.</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>You must not modify or copy the materials</li>
                                        <li>You must not use the materials for any commercial purpose</li>
                                        <li>You must not attempt to decompile or reverse engineer any software</li>
                                        <li>You must not remove any copyright or other proprietary notations</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">3. User Accounts</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>
                                    <p>You are responsible for safeguarding the password and for all activities that occur under your account.</p>
                                    <p>You must immediately notify us of any unauthorized uses of your account.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">4. Content</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material.</p>
                                    <p>You are responsible for content that you post to the service, including its legality, reliability, and appropriateness.</p>
                                    <p>By posting content to the service, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">5. Prohibited Uses</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>You may not use our service:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                                        <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                                        <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                                        <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                                        <li>To submit false or misleading information</li>
                                        <li>To upload or transmit viruses or any other type of malicious code</li>
                                        <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">6. Termination</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                                    <p>Upon termination, your right to use the service will cease immediately.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">7. Limitation of Liability</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>In no event shall FinderB, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
                                    <p>This includes without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">8. Contact Information</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>If you have any questions about these Terms of Use, please contact us at:</p>
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <p><strong>Email:</strong> legal@finderb.com</p>
                                        <p><strong>Address:</strong> 123 Business Street, Tech City, Karnataka, India - 560001</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}