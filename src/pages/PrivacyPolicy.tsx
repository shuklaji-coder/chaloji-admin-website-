
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-4xl bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">ChaloJi Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last Updated: July 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to ChaloJi. This Privacy Policy describes how we collect, use, and handle your information when you use our Passenger and Driver applications. By using ChaloJi, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Personal Information:</strong> We collect your name, phone number, and profile photo during registration for account creation, communication, and basic verification.</li>
              <li><strong>Location Data (Crucial for Functionality):</strong> 
                <br/> - <em>For Passengers:</em> We collect your foreground location data to find nearby drivers and calculate ride estimates.
                <br/> - <em>For Drivers:</em> <strong>We collect and use your device location data in the background (even when the app is minimized or not in use)</strong> to assign passenger ride requests efficiently, track live ongoing rides, and ensure passenger safety during the trip. This background location is an absolute necessity for operating on the ChaloJi Driver platform.
              </li>
              <li><strong>Camera and Photos:</strong> We request camera access to allow you to upload profile pictures and (for Drivers) upload necessary vehicle and identity verification documents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>
              We use the collected information for various purposes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>To provide and maintain the ChaloJi service, including matching riders with drivers based on proximity.</li>
              <li>To notify you about changes to our Service (OTP Verification, Ride Alerts).</li>
              <li>To provide customer support and improve user safety.</li>
              <li>To monitor the usage of our Service and detect/prevent technical issues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Security of Data</h2>
            <p>
              The security of your data is important to us. We strive to use commercially acceptable means to protect your Personal Information. However, please remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Deletion</h2>
            <p>
              Users have the absolute right to request the deletion of their accounts and associated personal data at any time. You can initiate a deletion request through the settings menu in the app or by contacting our support team directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please reach out to us at <strong>support@chalojii.in</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
