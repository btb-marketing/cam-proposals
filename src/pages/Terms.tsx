import LegalPage from './LegalPage'

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated="April 2025"
      intro="These Terms and Conditions govern your use of camgallacher.com and any proposal microsites operated by Cameron Gallacher. By accessing this site, you agree to these terms."
      sections={[
        {
          heading: '1. Use of This Site',
          body: [
            'This website is intended for prospective and current clients of Cameron Gallacher\'s digital marketing consulting services. All content is provided for informational purposes.',
            'You agree not to use this site for any unlawful purpose or in any way that could damage, disable, or impair the site.',
          ],
        },
        {
          heading: '2. Intellectual Property',
          body: [
            'All content on this site, including text, graphics, logos, and proposal materials, is the property of Cameron Gallacher and is protected by applicable intellectual property laws.',
            'You may not reproduce, distribute, or create derivative works from any content on this site without prior written permission.',
          ],
        },
        {
          heading: '3. Proposal Content',
          body: [
            'Proposals presented through this platform are confidential and intended solely for the named recipient. Sharing or distributing proposal content without consent is prohibited.',
            'Pricing, scope, and deliverables outlined in proposals are subject to a formal signed agreement and may be adjusted based on final project requirements.',
          ],
        },
        {
          heading: '4. Electronic Agreements',
          body: [
            'By electronically signing a proposal or agreement through this platform, you acknowledge that your electronic signature is legally binding and equivalent to a handwritten signature under applicable Canadian electronic commerce legislation.',
          ],
        },
        {
          heading: '5. Payment & Billing',
          body: [
            'Payment details submitted through this platform are used solely for the purpose of billing for agreed services. Billing commences only upon campaign launch as outlined in your agreement.',
            'All prices are in Canadian Dollars (CAD) and are subject to applicable taxes including GST.',
          ],
        },
        {
          heading: '6. Limitation of Liability',
          body: [
            'Cameron Gallacher shall not be liable for any indirect, incidental, or consequential damages arising from your use of this site or reliance on any content herein.',
          ],
        },
        {
          heading: '7. Governing Law',
          body: [
            'These Terms are governed by the laws of the Province of British Columbia, Canada. Any disputes shall be subject to the exclusive jurisdiction of the courts of British Columbia.',
          ],
        },
        {
          heading: '8. Changes to These Terms',
          body: [
            'We reserve the right to update these Terms at any time. Continued use of this site after changes are posted constitutes acceptance of the revised Terms.',
          ],
        },
        {
          heading: '9. Contact',
          body: [
            'For any questions regarding these Terms, please contact cam@latchedinc.com.',
          ],
        },
      ]}
    />
  )
}
