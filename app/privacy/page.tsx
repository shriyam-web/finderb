'use client';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white overflow-hidden">
            <main className="flex-1 pt-24 lg:pt-32 pb-24">
                <section className="px-4 mb-32 relative">
                    <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm">
                            Legal
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tight leading-[0.95]">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-500 text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                            Your privacy is important to us. Learn how we collect, use, and protect your personal information.
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
                                <h2 className="text-2xl font-black text-primary mb-6">1. Information We Collect</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Personal Information:</strong> Name, email address, phone number, business information</li>
                                        <li><strong>Usage Data:</strong> How you interact with our platform, pages visited, features used</li>
                                        <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                                        <li><strong>Location Data:</strong> General location information for local business matching</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">2. How We Use Your Information</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>We use the information we collect to:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Provide and maintain our services</li>
                                        <li>Process transactions and send related information</li>
                                        <li>Send you technical notices and support messages</li>
                                        <li>Communicate with you about products, services, and promotions</li>
                                        <li>Improve our services and develop new features</li>
                                        <li>Monitor and analyze usage patterns</li>
                                        <li>Detect, prevent, and address technical issues</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">3. Information Sharing</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
                                    <p>We may share your information in the following circumstances:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>With service providers who assist us in operating our platform</li>
                                        <li>When required by law or to protect our rights</li>
                                        <li>In connection with a business transfer or acquisition</li>
                                        <li>With your explicit consent</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">4. Data Security</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                                    <p>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">5. Your Rights</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>You have the right to:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Access the personal information we hold about you</li>
                                        <li>Correct inaccurate or incomplete information</li>
                                        <li>Request deletion of your personal information</li>
                                        <li>Object to or restrict certain processing of your information</li>
                                        <li>Data portability</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">6. Cookies and Tracking</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>We use cookies and similar technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences.</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-primary mb-6">7. Contact Us</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <p><strong>Email:</strong> privacy@boomb.com</p>
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