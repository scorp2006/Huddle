export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#F5F5F7] mb-2">Terms of Service</h1>
        <p className="text-[#636369] mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-[#A0A0A8]">
          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Huddle, you agree to be bound by these Terms of Service and our Privacy Policy.
              If you do not agree, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">2. Description of Service</h2>
            <p>
              Huddle is an event networking platform that enables attendees at hackathons, conferences, and
              professional events to discover and connect with each other through their LinkedIn profiles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">3. Eligibility</h2>
            <p className="mb-2">To use Huddle, you must:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Be at least 16 years old</li>
              <li>Have a valid LinkedIn account</li>
              <li>Provide accurate information</li>
              <li>Comply with these Terms and all applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">4. User Accounts</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.1 Account Creation</h3>
            <p>
              You create an account by signing in with LinkedIn. You are responsible for maintaining
              the confidentiality of your account credentials.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.2 Account Security</h3>
            <p>
              You are responsible for all activities under your account. Notify us immediately of any
              unauthorized use or security breach.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.3 Accurate Information</h3>
            <p>
              You agree to provide accurate and current information, especially your LinkedIn username.
              Impersonation or misrepresentation is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">5. Acceptable Use</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">5.1 You May:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create event rooms for legitimate networking purposes</li>
              <li>Join event rooms and connect with attendees</li>
              <li>Share your professional information</li>
              <li>Use the service for professional networking</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">5.2 You May NOT:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Harass, abuse, or harm other users</li>
              <li>Spam or send unsolicited messages</li>
              <li>Post false, misleading, or inappropriate content</li>
              <li>Scrape or collect user data without permission</li>
              <li>Use the service for illegal purposes</li>
              <li>Attempt to hack, disrupt, or damage the platform</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Use the service for commercial solicitation without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">6. Event Rooms</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">6.1 Creating Rooms</h3>
            <p>
              Authorized users may create event rooms. Room creators are responsible for the appropriate
              use of their rooms and the content shared within them.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">6.2 Joining Rooms</h3>
            <p>
              By joining a room, you consent to sharing your profile information with other room members.
              You can leave a room at any time.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">6.3 Room Expiration</h3>
            <p>
              Event rooms automatically expire after a set period. Expired rooms remain viewable but
              no new members can join.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">7. Content and Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">7.1 Your Content</h3>
            <p>
              You retain ownership of any content you submit (profile information, bio, etc.).
              By submitting content, you grant us a license to display it within the platform.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">7.2 Our Content</h3>
            <p>
              All Huddle branding, design, code, and features are owned by us and protected by
              intellectual property laws. You may not copy, modify, or create derivative works.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">8. Privacy</h2>
            <p>
              Your use of Huddle is subject to our Privacy Policy. By using the service, you consent
              to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">9. Third-Party Services</h2>
            <p>
              We use LinkedIn for authentication. Your use of LinkedIn is subject to LinkedIn's terms
              and policies. When you click on external links (LinkedIn profiles, social media), you
              leave Huddle and are subject to those sites' terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">10. Disclaimers</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">10.1 Service "As Is"</h3>
            <p>
              Huddle is provided "as is" without warranties of any kind. We do not guarantee uninterrupted,
              error-free, or secure service.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">10.2 User Interactions</h3>
            <p>
              We are not responsible for interactions between users or the accuracy of user-provided
              information. Use caution when connecting with others online.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">10.3 Professional Advice</h3>
            <p>
              Huddle is for networking purposes only. We do not provide professional, legal, or
              financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Huddle and its operators shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages, including lost
              profits, data loss, or business interruption arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">12. Termination</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">12.1 By You</h3>
            <p>
              You may delete your account at any time from your Profile page. Upon deletion, your
              data will be removed according to our Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">12.2 By Us</h3>
            <p>
              We may suspend or terminate your account if you violate these Terms, engage in illegal
              activity, or for any reason at our discretion. We will provide notice when possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">13. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of material changes via email
              or platform notice. Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be
              resolved in the courts of India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">15. Contact</h2>
            <p className="mb-2">For questions about these Terms, contact us at:</p>
            <p className="text-[#F5F5F7]">
              Email: <span className="text-[#FF6B35]">ayyagariabhinav21@gmail.com</span>
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-[#2A2A2E]">
            <p className="text-[#636369] text-sm">
              By using Huddle, you acknowledge that you have read, understood, and agree to be bound
              by these Terms of Service and our Privacy Policy.
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
