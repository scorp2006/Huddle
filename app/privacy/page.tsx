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

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">2.1 Information from LinkedIn OAuth</h3>
            <p className="mb-2">When you sign in with LinkedIn, we receive from LinkedIn:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your full name</li>
              <li>Email address</li>
              <li>LinkedIn profile username/URL (if provided by LinkedIn)</li>
            </ul>
            <p className="mt-2 text-sm italic">
              Note: LinkedIn does NOT provide us your profile picture, connections, work history, posts, or any other data.
              We ONLY use LinkedIn to verify your identity and auto-fill your LinkedIn username to speed up onboarding.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">2.2 Information You Provide (Required)</h3>
            <p className="mb-2">During onboarding, you MUST provide:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your LinkedIn username (auto-filled from LinkedIn if available, otherwise you type it)</li>
              <li>A profile photo (uploaded by you - LinkedIn doesn't provide photos)</li>
              <li>A short bio/one-liner describing yourself</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">2.3 Optional Information You Can Provide</h3>
            <p className="mb-2">You may optionally add:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Twitter username/profile link</li>
              <li>Instagram username/profile link</li>
              <li>GitHub username/profile link</li>
              <li>Personal website URL</li>
              <li>Tags or interests (planned for future updates)</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">2.4 Usage Analytics</h3>
            <p className="mb-2">We automatically collect minimal analytics:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Event rooms you join and your approval status</li>
              <li>LinkedIn profile click tracking (we track WHEN someone clicks your LinkedIn link, NOT what they do on LinkedIn)</li>
              <li>Login timestamps for security purposes</li>
            </ul>
            <p className="mt-2 text-sm">
              This data helps event organizers understand engagement and helps you see which attendees
              are interested in connecting with you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">3. How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create and manage your account using LinkedIn authentication</li>
              <li>Display your complete profile (photo, name, bio, LinkedIn link, social links) to other attendees in event rooms you join</li>
              <li>Enable networking by providing clickable links to your LinkedIn and other social profiles</li>
              <li>Show you analytics on who viewed your profile (clicks on your LinkedIn link)</li>
              <li>Send important service updates via email (account changes, security alerts)</li>
              <li>Improve our service and user experience based on usage patterns</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
            <p className="mt-2 text-sm">
              We do NOT send marketing emails, sell your data, or use your information for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">4. Information Sharing</h2>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.1 What Other Users See in Event Rooms</h3>
            <p className="mb-2">When you join an event room, OTHER MEMBERS in that room can see:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your full name (from LinkedIn)</li>
              <li>Your profile photo (uploaded by you)</li>
              <li>Your bio/one-liner (written by you)</li>
              <li>A clickable link to your LinkedIn profile (using your username)</li>
              <li>Any optional social links you added (Twitter, Instagram, GitHub, website)</li>
            </ul>
            <p className="mt-2">
              This visibility is the <strong>core purpose of our platform</strong> - to help event attendees
              discover and connect with each other. All data shown is what YOU chose to provide.
            </p>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.2 We Do NOT Share With Third Parties</h3>
            <p className="mb-2">We do not sell, rent, or share your personal information with third parties except:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Service providers who help us operate the platform (hosting, database, analytics)</li>
              <li>When required by law or to protect our rights</li>
              <li>With your explicit consent</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#F5F5F7] mt-4 mb-2">4.3 What We Do NOT Do With LinkedIn</h3>
            <p className="mb-2">We explicitly DO NOT:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Post on your behalf to LinkedIn</li>
              <li>Access your LinkedIn connections or network</li>
              <li>Send messages through LinkedIn</li>
              <li>Access your work history, education, or endorsements</li>
              <li>Share your LinkedIn data with third parties</li>
              <li>Store your LinkedIn password (we use OAuth 2.0)</li>
            </ul>
            <p className="mt-2">
              We ONLY use LinkedIn to verify your identity during sign-in. After authentication,
              LinkedIn is not involved in any way - we simply display a link to your public LinkedIn
              profile that other users can click to connect with you directly on LinkedIn.
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
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">6. Your Rights and Control</h2>
            <p className="mb-2">You have complete control over your data and the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access all your personal data stored on our platform</li>
              <li>Update your photo, bio, and social links anytime via your Profile page</li>
              <li>Remove optional social links at any time</li>
              <li>Leave any event room (your profile will no longer be visible in that room)</li>
              <li>Delete your account and ALL associated data permanently</li>
              <li>Object to data processing or request data export</li>
              <li>See who clicked your LinkedIn profile link (analytics visible to you)</li>
            </ul>
            <p className="mt-4">
              To exercise these rights or for data-related questions, contact us at: <span className="text-[#FF6B35]">ayyagariabhinav21@gmail.com</span>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">7. Data Retention</h2>
            <p className="mb-2">
              We retain your data as long as your account is active. When you delete your account,
              we permanently delete within 30 days:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your profile photo</li>
              <li>Your bio and all social media links</li>
              <li>Your email address and LinkedIn username</li>
              <li>All event room memberships</li>
              <li>All analytics data (profile click tracking)</li>
            </ul>
            <p className="mt-2 text-sm">
              Exception: We may retain limited data (email, timestamps) for legal compliance, fraud prevention,
              or if required by law. This data is anonymized where possible.
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
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">11. Your Consent</h2>
            <p className="mb-2">
              By signing in with LinkedIn and completing onboarding, you explicitly consent to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>LinkedIn providing us your name and email for authentication</li>
              <li>Your complete profile (photo, name, bio, LinkedIn link, and all social links you add) being visible to other members in event rooms you join</li>
              <li>Event organizers seeing your name, email, and LinkedIn username when reviewing membership requests</li>
              <li>Other users clicking your LinkedIn profile link to connect with you on LinkedIn</li>
              <li>Analytics tracking of when users click your profile links (we track clicks, not what they do after clicking)</li>
            </ul>
            <p className="mt-4">
              <strong>You control what you share:</strong> You choose what photo to upload, what bio to write,
              and which social links to add. You can update or remove this information anytime in your Profile settings.
            </p>
            <p className="mt-2">
              You can withdraw consent at any time by deleting your account, which will permanently remove
              all your data from our platform within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">12. Legal Basis for Processing (GDPR)</h2>
            <p className="mb-2">For users in the EU/EEA, we process your data based on:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Consent:</strong> You explicitly agree when signing in and joining event rooms</li>
              <li><strong>Contract Performance:</strong> Processing necessary to provide our networking service</li>
              <li><strong>Legitimate Interest:</strong> Platform security, fraud prevention, and service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy. We will notify you of significant changes via email
              or a notice on our platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-4">14. Contact Us</h2>
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
