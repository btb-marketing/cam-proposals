/**
 * Vercel Serverless Function: POST /api/send-payment-received
 * Fires after Stripe payment setup is confirmed.
 * Sends:
 *   1. Client confirmation email with onboarding next steps
 *   2. Admin notification to richard@belowtheboard.com
 */
import { sendEmail, ADMIN_EMAIL, emailWrapper, getSenderName } from './_gmail.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { clientName, clientEmail, slug, brand, packageName, packagePrice, calendlyUrl } = req.body
    if (!clientName || !slug) {
      return res.status(400).json({ error: 'clientName and slug are required' })
    }

    const agencyName = brand === 'below-the-board' ? 'Below the Board Marketing' : 'Cameron Gallacher Consulting'
    const contactEmail = brand === 'below-the-board' ? 'zach@belowtheboard.com' : 'cam@latchedinc.com'
    const onboardingUrl = `https://camgallacher.com/proposal/${slug}/onboarding`
    const onboardingFormUrl = `https://camgallacher.com/proposal/${slug}/onboarding-form`
    const firstName = clientName ? clientName.split(' ')[0] : 'there'
    const bookingUrl = calendlyUrl || onboardingUrl

    // 1. Client email
    if (clientEmail && clientEmail.includes('@')) {
      const clientContent = `
        <h1>You're Officially Enrolled! 🎉</h1>
        <p>Hi <span class="highlight">${firstName}</span>,</p>
        <p>Your payment details have been saved and your ${packageName || 'marketing'} package is confirmed. Welcome aboard — we're excited to get your campaign launched.</p>
        <hr class="divider">
        <p><strong class="highlight">Here are your next two steps:</strong></p>
        <div class="box">
          <h3>Step 1 — Book Your Onboarding Call</h3>
          <p>Schedule your onboarding call so we can review your goals, walk through the strategy, and set a campaign launch date.</p>
          <br>
          <a href="${bookingUrl}" class="btn">Book Onboarding Call →</a>
        </div>
        <div class="box">
          <h3>Step 2 — Complete Your Onboarding Form</h3>
          <p>Fill out your onboarding form so our team can prepare everything before your call. This takes about 10–15 minutes.</p>
          <br>
          <a href="${onboardingFormUrl}" class="btn-outline">Fill Out Onboarding Form →</a>
        </div>
        <hr class="divider">
        <p>If you have any questions in the meantime, reach out at <a href="mailto:${contactEmail}" style="color:#c6f135;">${contactEmail}</a>.</p>
        <p>Looking forward to working with you,</p>
        <p><strong class="highlight">${brand === 'below-the-board' ? 'Zach Gallis' : 'Cameron Gallacher'}</strong><br>
        <span style="color:#555;font-size:13px;">${agencyName}</span></p>
      `
      await sendEmail({
        to: clientEmail,
        subject: `Payment received — you're officially enrolled with ${agencyName}`,
        html: emailWrapper(clientContent, brand),
        from: getSenderName(brand),
      })
    }

    // 2. Admin notification
    const adminContent = `
      <h1>Payment Received 💳</h1>
      <p><span class="highlight">${clientName}</span> has completed billing setup.</p>
      <div class="box">
        <h3>Details</h3>
        <table>
          <tr><td class="label">Client</td><td>${clientName}</td></tr>
          ${clientEmail ? `<tr><td class="label">Email</td><td>${clientEmail}</td></tr>` : ''}
          <tr><td class="label">Package</td><td>${packageName || 'Not specified'}</td></tr>
          ${packagePrice ? `<tr><td class="label">Monthly Value</td><td>${packagePrice}/mo</td></tr>` : ''}
          <tr><td class="label">Agency</td><td>${agencyName}</td></tr>
          <tr><td class="label">Time</td><td>${new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver', dateStyle: 'medium', timeStyle: 'short' })} PT</td></tr>
        </table>
      </div>
      <p><a href="${onboardingUrl}" class="btn">View Onboarding Step →</a></p>
    `

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[${agencyName}] Payment received from ${clientName}${packagePrice ? ` — ${packagePrice}/mo` : ''}`,
      html: emailWrapper(adminContent, brand),
      from: getSenderName(brand),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('send-payment-received error:', err)
    return res.status(200).json({ success: true, emailError: err.message })
  }
}
