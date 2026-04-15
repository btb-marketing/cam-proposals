/**
 * Vercel Serverless Function: POST /api/send-onboarding-email
 * Fires after Stripe billing is confirmed.
 * Sends client a confirmation email with onboarding call + form links.
 * Also sends admin notification to richard@belowtheboard.com.
 * Uses Gmail OAuth2 (replaces Resend).
 */
import { sendEmail, ADMIN_EMAIL, emailWrapper, getSenderName } from './_gmail.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const {
      clientEmail,
      clientName,
      slug,
      pkgId,
      addonId,
      agencyName: agencyNameOverride,
      brand,
      packageName,
      packagePrice,
    } = req.body

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid client email is required' })
    }

    const brand_ = brand || 'cameron-gallacher'
    const agencyName = agencyNameOverride || (brand_ === 'below-the-board' ? 'Below the Board Marketing' : 'Cameron Gallacher Consulting')
    const contactEmail = brand_ === 'below-the-board' ? 'zach@belowtheboard.com' : 'cam@latchedinc.com'
    const firstName = clientName ? clientName.split(' ')[0] : 'there'
    const onboardingUrl = `https://camgallacher.com/proposal/${slug}/onboarding`
    const onboardingFormUrl = `https://camgallacher.com/proposal/${slug}/onboarding-form`
    const calendlyUrl = brand_ === 'below-the-board'
      ? 'https://calendly.com/belowtheboard/onboarding'
      : 'https://calendly.com/belowtheboard/onboarding-cg'

    // 1. Client email
    const clientContent = `
      <h1>You're Officially Enrolled! 🎉</h1>
      <p>Hi <span class="highlight">${firstName}</span>,</p>
      <p>Your agreement has been signed and your billing details are securely saved. Welcome aboard — we're excited to get your campaign launched.</p>
      <hr class="divider">
      <p><strong class="highlight">Here are your next two steps:</strong></p>
      <div class="box">
        <h3>Step 1 — Book Your Onboarding Call</h3>
        <p>Schedule your onboarding call so we can review your goals, walk through the strategy, and set a campaign launch date.</p>
        <br>
        <a href="${calendlyUrl}" class="btn">Book Onboarding Call →</a>
      </div>
      <div class="box">
        <h3>Step 2 — Complete Your Onboarding Form</h3>
        <p>Fill out your onboarding form so our team can prepare everything before your call. This takes about 10–15 minutes. You can also complete it after your call if needed.</p>
        <br>
        <a href="${onboardingFormUrl}" class="btn-outline">Fill Out Onboarding Form →</a>
      </div>
      <hr class="divider">
      <p>If you have any questions in the meantime, reach out at <a href="mailto:${contactEmail}" style="color:#c6f135;">${contactEmail}</a>.</p>
      <p>Looking forward to working with you,</p>
      <p><strong class="highlight">${brand_ === 'below-the-board' ? 'Zach Gallis' : 'Cameron Gallacher'}</strong><br>
      <span style="color:#555;font-size:13px;">${agencyName}</span></p>
    `

    await sendEmail({
      to: clientEmail,
      subject: `Welcome to ${agencyName} — Your Next Steps`,
      html: emailWrapper(clientContent, brand_),
      from: getSenderName(brand_),
    })

    // 2. Admin notification
    const adminContent = `
      <h1>New Enrollment 🎉</h1>
      <p><span class="highlight">${clientName || clientEmail}</span> has completed billing and is officially enrolled.</p>
      <div class="box">
        <h3>Details</h3>
        <table>
          <tr><td class="label">Client</td><td>${clientName || '—'}</td></tr>
          <tr><td class="label">Email</td><td>${clientEmail}</td></tr>
          ${packageName ? `<tr><td class="label">Package</td><td>${packageName}</td></tr>` : ''}
          ${packagePrice ? `<tr><td class="label">Monthly Value</td><td>${packagePrice}/mo</td></tr>` : ''}
          <tr><td class="label">Agency</td><td>${agencyName}</td></tr>
          <tr><td class="label">Time</td><td>${new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver', dateStyle: 'medium', timeStyle: 'short' })} PT</td></tr>
        </table>
      </div>
      <p><a href="${onboardingUrl}" class="btn">View Onboarding Step →</a></p>
    `

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[${agencyName}] New enrollment — ${clientName || clientEmail}`,
      html: emailWrapper(adminContent, brand_),
      from: getSenderName(brand_),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('send-onboarding-email error:', err)
    return res.status(200).json({ success: true, emailError: err.message })
  }
}
