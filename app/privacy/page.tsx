export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#F5F5F7] mb-2">Privacy Policy</h1>
        <p className="text-[#636369] mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-[#A0A0A8]">
          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">1. Introduction</h2>
            <p>
              Huddle ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
              use, and share information when you use our event networking platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">2.1 Information from LinkedIn</h3>
            <p className="mb-2">When you sign in with LinkedIn, we collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your name</li>
              <li>Email address</li>
              <li>Profile picture</li>
              <li>LinkedIn profile URL/username</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">2.2 Information You Provide</h3>
            <p className="mb-2">You may optionally provide:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>A one-liner bio</li>
              <li>Links to other social profiles (Twitter, Instagram, GitHub, website)</li>
              <li>Custom profile picture</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">2.3 Usage Information</h3>
            <p className="mb-2">We automatically collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Event rooms you join</li>
              <li>LinkedIn profile view clicks (anonymized analytics)</li>
              <li>Login timestamps</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">3. How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create and manage your account</li>
              <li>Display your profile to other event attendees in rooms you join</li>
              <li>Enable networking connections between event attendees</li>
              <li>Send important service updates (account, security)</li>
              <li>Improve our service and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">4. Information Sharing</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.1 Within Event Rooms</h3>
            <p>
              When you join an event room, your profile (name, photo, bio, LinkedIn URL, and optional social links)
              is visible to other members of that room. This is the core purpose of our platform.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.2 We Do NOT Share With Third Parties</h3>
            <p className="mb-2">We do not sell, rent, or share your personal information with third parties except:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Service providers who help us operate the platform (hosting, database, analytics)</li>
              <li>When required by law or to protect our rights</li>
              <li>With your explicit consent</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.3 LinkedIn</h3>
            <p>
              We do NOT post on your behalf, access your connections, or send messages through LinkedIn.
              We only use LinkedIn for authentication and to display your public profile information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">5. Data Security</h2>
            <p>
              We use industry-standard security measures including encryption, secure authentication,
              and regular security audits. However, no internet transmission is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access your personal data</li>
              <li>Update or correct your information (via Profile page)</li>
              <li>Delete your account and all associated data</li>
              <li>Leave any event room</li>
              <li>Object to data processing</li>
              <li>Export your data</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at: <span className="text-[#FF6B35]">privacy@huddle.app</span> (or your domain email)
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">7. Data Retention</h2>
            <p>
              We retain your data as long as your account is active. When you delete your account,
              we delete your personal information within 30 days, except where we must retain it for legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use tracking
              cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">9. Children's Privacy</h2>
            <p>
              Huddle is not intended for users under 16 years old. We do not knowingly collect information
              from children under 16. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">10. International Users</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy. We will notify you of significant changes via email
              or a notice on our platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">12. Contact Us</h2>
            <p className="mb-2">For privacy questions or concerns, contact us at:</p>
            <p className="text-[#F5F5F7]">
              Email: <span className="text-[#FF6B35]">ayyagariabhinav21@gmail.com</span>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2A2A2E]">
          <a href="/home" className="text-[#FF6B35] hover:text-[#E85A28] transition-colors">
            ← Back to Huddle
          </a>
        </div>
      </div>
    </main>
  );
}
