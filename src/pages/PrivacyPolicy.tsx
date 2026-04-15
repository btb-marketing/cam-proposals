import LegalPage from './LegalPage'

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="April 2025"
      intro="Cameron Gallacher ('we', 'us', or 'our') is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard information when you access our proposal microsites at camgallacher.com."
      sections={[
        {
          heading: '1. Information We Collect',
          body: [
            'We may collect personal information that you voluntarily provide when interacting with our proposals, including your name, email address, phone number, and business name.',
            'We also collect non-personal information automatically, such as browser type, IP address, pages visited, and time spent on pages, through standard web analytics tools.',
          ],
        },
        {
          heading: '2. How We Use Your Information',
          body: [
            'We use the information you provide to deliver and manage digital marketing services, communicate with you about your proposal or engagement, and send relevant updates or service information.',
            'We do not sell, trade, or rent your personal information to third parties.',
          ],
        },
        {
          heading: '3. Data Retention',
          body: [
            'We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, or as required by applicable law.',
          ],
        },
        {
          heading: '4. Cookies',
          body: [
            'Our site may use cookies and similar tracking technologies to improve your experience. Please refer to our Cookie Policy for more information.',
          ],
        },
        {
          heading: '5. Third-Party Services',
          body: [
            'We may use third-party service providers (such as analytics platforms or scheduling tools) that have their own privacy policies. We encourage you to review their policies independently.',
          ],
        },
        {
          heading: '6. Your Rights',
          body: [
            'You have the right to access, correct, or request deletion of your personal information. To exercise these rights, please contact us at cam@latchedinc.com.',
          ],
        },
        {
          heading: '7. Security',
          body: [
            'We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, disclosure, or loss.',
          ],
        },
        {
          heading: '8. Changes to This Policy',
          body: [
            'We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised "Last Updated" date.',
          ],
        },
        {
          heading: '9. Contact',
          body: [
            'If you have any questions about this Privacy Policy, please contact us at cam@latchedinc.com.',
          ],
        },
      ]}
    />
  )
}
