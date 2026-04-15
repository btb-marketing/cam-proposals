/**
 * Vercel Serverless Function: POST /api/send-call-booked
 * Fires when a client books their onboarding call via Calendly.
 * Called from the OnboardingBookingPage after Calendly embed fires its event.
 * Sends:
 *   1. Client confirmation email
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
    const { clientName, clientEmail, slug, brand, callTime, callDate } = req.body
    if (!clientName || !slug) {
      return res.status(400).json({ error: 'clientName and slug are required' })
    }

    const agencyName = brand === 'below-the-board' ? 'Below the Board Marketing' : 'Cameron Gallacher Consulting'
    const contactEmail = brand === 'below-the-board' ? 'zach@belowtheboard.com' : 'cam@latchedinc.com'
    const onboardingFormUrl = `https://camgallacher.com/proposal/${slug}/onboarding-form`
    const firstName = clientName ? clientName.split(' ')[0] : 'there'

    // 1. Client confirmation
    if (clientEmail && clientEmail.includes('@')) {
      const clientContent = `
        <h1>Onboarding Call Confirmed 📅</h1>
        <p>Hi <span class="highlight">${firstName}</span>,</p>
        <p>Your onboarding call with ${agencyName} is confirmed${callDate ? ` for <strong class="highlight">${callDate}${callTime ? ` at ${callTime}` : ''}</strong>` : ''}. We'll send you a calendar invite and Zoom link separately.</p>
        <hr class="divider">
        <div class="box">
          <h3>While You Wait — Complete Your Onboarding Form</h3>
          <p>If you haven't already, fill out your onboarding form before the call. This helps us prepare your custom strategy and makes the call much more productive.</p>
          <br>
          <a href="${onboardingFormUrl}" class="btn">Fill Out Onboarding Form →</a>
        </div>
        <hr class="divider">
        <p>If you have any questions, reach out at <a href="mailto:${contactEmail}" style="color:#c6f135;">${contactEmail}</a>.</p>
        <p>Looking forward to speaking with you,</p>
        <p><strong class="highlight">${brand === 'below-the-board' ? 'Zach Gallis' : 'Cameron Gallacher'}</strong><br>
        <span style="color:#555;font-size:13px;">${agencyName}</span></p>
      `
      await sendEmail({
        to: clientEmail,
        subject: `Your onboarding call is confirmed — ${agencyName}`,
        html: emailWrapper(clientContent, brand),
        from: getSenderName(brand),
      })
    }

    // 2. Admin notification
    const adminContent = `
      <h1>Onboarding Call Booked 📅</h1>
      <p><span class="highlight">${clientName}</span> has booked their onboarding call.</p>
      <div class="box">
        <h3>Details</h3>
        <table>
          <tr><td class="label">Client</td><td>${clientName}</td></tr>
          ${clientEmail ? `<tr><td class="label">Email</td><td>${clientEmail}</td></tr>` : ''}
          ${callDate ? `<tr><td class="label">Call Date</td><td>${callDate}${callTime ? ` at ${callTime}` : ''}</td></tr>` : ''}
          <tr><td class="label">Agency</td><td>${agencyName}</td></tr>
          <tr><td class="label">Time</td><td>${new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver', dateStyle: 'medium', timeStyle: 'short' })} PT</td></tr>
        </table>
      </div>
      <p><a href="${onboardingFormUrl}" class="btn">View Onboarding Form Step →</a></p>
    `

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[${agencyName}] Onboarding call booked by ${clientName}`,
      html: emailWrapper(adminContent, brand),
      from: getSenderName(brand),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('send-call-booked error:', err)
    return res.status(200).json({ success: true, emailError: err.message })
  }
}
