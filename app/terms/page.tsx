import Link from 'next/link'

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-primary-600">
              ExpiryCare
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using ExpiryCare ("the Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you disagree with any part of these Terms, you may not access the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ExpiryCare is a service that helps you track expiry dates for warranties, insurance policies, medicines, subscriptions, and other life items. The Service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Adding and managing life items with expiry dates</li>
              <li>Email reminders before items expire</li>
              <li>Organizing items by categories (warranty, insurance, medicine, subscription, etc.)</li>
              <li>Document storage (for Pro and Family plans)</li>
              <li>Family sharing features (for Family plan users)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use the Service, you must create an account by providing accurate and complete information. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring that your account information remains accurate and up-to-date</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 18 years old to create an account. We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Plans and Pricing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We offer the following subscription plans:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Free Plan:</strong> Allows tracking of up to 5 life items with basic features</li>
              <li><strong>Pro Plan:</strong> Unlimited items, medicine tracking, and document uploads</li>
              <li><strong>Family Plan:</strong> All Pro features plus family sharing for up to 5 members</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              All paid plans are billed annually. Prices are subject to change, but we will notify you at least 30 days in advance of any price increases affecting your subscription.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for all charges incurred under your account, including applicable taxes. Payments are processed securely through third-party payment processors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Content and Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain ownership of all content and data you submit to the Service ("User Content"). By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and process your User Content solely for the purpose of providing the Service to you.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Submit any content that is illegal, harmful, threatening, abusive, or violates any third-party rights</li>
              <li>Upload malicious software, viruses, or any code designed to interfere with the Service</li>
              <li>Impersonate any person or entity or falsely represent your affiliation with any person or entity</li>
              <li>Use the Service for any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems or networks</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable, without prior notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service, including its original content, features, and functionality, is owned by ExpiryCare and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You may not copy, modify, distribute, sell, or lease any part of the Service or included software, nor may you reverse engineer or attempt to extract the source code of the Service, unless laws prohibit those restrictions or you have our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Refund and Cancellation Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Free Plan:</strong> You may cancel your free account at any time without any charges.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Paid Plans:</strong> 
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Cancellation will take effect at the end of your current billing period</li>
              <li>Refunds may be provided on a case-by-case basis within 7 days of purchase, at our sole discretion</li>
              <li>No refunds will be provided for partial billing periods or after the 7-day refund window</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Upon cancellation, your account will be downgraded to the Free plan, and you may lose access to features and data exceeding Free plan limits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability and Disclaimers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We strive to provide a reliable Service but cannot guarantee that the Service will be available at all times or free from errors, bugs, or interruptions. We are not liable for any losses or damages resulting from:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Service interruptions or downtime</li>
              <li>Data loss or corruption</li>
              <li>Delayed or failed email reminders</li>
              <li>Inaccurate expiry date tracking due to user input errors</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, EXPIRYCARE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Your use or inability to use the Service</li>
              <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
              <li>Any interruption or cessation of transmission to or from the Service</li>
              <li>Any bugs, viruses, trojan horses, or the like that may be transmitted to or through the Service</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify, defend, and hold harmless ExpiryCare, its officers, directors, employees, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) arising from: (a) your use of and access to the Service; (b) your violation of any term of these Terms; (c) your violation of any third-party right, including without limitation any copyright, property, or privacy right; or (d) any claim that your User Content caused damage to a third party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your right to use the Service will cease immediately. You may request deletion of your account and data by contacting us at <a href="mailto:Welcome@expirycare.com" className="text-primary-600 hover:text-primary-700">Welcome@expirycare.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts located in India.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Before filing a formal legal proceeding, you agree to first contact us at <a href="mailto:Welcome@expirycare.com" className="text-primary-600 hover:text-primary-700">Welcome@expirycare.com</a> to attempt to resolve the dispute informally.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> <a href="mailto:Welcome@expirycare.com" className="text-primary-600 hover:text-primary-700">Welcome@expirycare.com</a>
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> <a href="tel:+916369574440" className="text-primary-600 hover:text-primary-700">+91 6369574440</a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to Home
          </Link>
        </div>
      </main>
    </div>
  )
}

