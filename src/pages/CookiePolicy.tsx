import LegalPage from './LegalPage'

export default function CookiePolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="April 2025"
      intro="This Cookie Policy explains how Cameron Gallacher uses cookies and similar tracking technologies on camgallacher.com."
      sections={[
        {
          heading: '1. What Are Cookies?',
          body: [
            'Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your experience.',
          ],
        },
        {
          heading: '2. Types of Cookies We Use',
          body: [
            'Essential Cookies: These are necessary for the website to function properly. They enable core functionality such as page navigation and access to secure areas.',
            'Analytics Cookies: We may use analytics tools (such as Google Analytics) that set cookies to help us understand how visitors interact with our site. This data is aggregated and anonymized.',
            'Preference Cookies: These cookies remember your choices (such as language or region) to provide a more personalized experience.',
          ],
        },
        {
          heading: '3. Third-Party Cookies',
          body: [
            'Some pages may include content from third-party services (such as embedded scheduling tools or social media widgets) that may set their own cookies. We do not control these cookies.',
          ],
        },
        {
          heading: '4. Managing Cookies',
          body: [
            'You can control and delete cookies through your browser settings. Most browsers allow you to refuse cookies or delete existing ones. Note that disabling cookies may affect the functionality of this website.',
          ],
        },
        {
          heading: '5. Changes to This Policy',
          body: [
            'We may update this Cookie Policy from time to time. Changes will be posted on this page with a revised "Last Updated" date.',
          ],
        },
        {
          heading: '6. Contact',
          body: [
            'If you have questions about our use of cookies, please contact us at cam@latchedinc.com.',
          ],
        },
      ]}
    />
  )
}
