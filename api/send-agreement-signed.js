/**
 * Vercel Serverless Function: POST /api/send-agreement-signed
 * Fires when a client submits the agreement form.
 * Sends:
 *   1. Client confirmation email with next steps (billing)
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
    const { clientName, clientEmail, slug, brand, packageName, packagePrice } = req.body
    if (!clientName || !slug) {
      return res.status(400).json({ error: 'clientName and slug are required' })
    }

    const agencyName = brand === 'below-the-board' ? 'Below the Board Marketing' : 'Cameron Gallacher Consulting'
    const contactEmail = brand === 'below-the-board' ? 'zach@belowtheboard.com' : 'cam@latchedinc.com'
    const billingUrl = `https://camgallacher.com/proposal/${slug}/billing`
    const firstName = clientName ? clientName.split(' ')[0] : 'there'

    // 1. Client email
    if (clientEmail && clientEmail.includes('@')) {
      const clientContent = `
        <h1>Agreement Confirmed ✅</h1>
        <p>Hi <span class="highlight">${firstName}</span>,</p>
        <p>Your marketing services agreement has been signed and confirmed. You're one step away from getting started.</p>
        <hr class="divider">
        <div class="box">
          <h3>Next Step — Complete Your Billing</h3>
          <p>Securely enter your payment details to activate your ${packageName || 'marketing'} package. Your card will only be charged after your onboarding call.</p>
          <br>
          <a href="${billingUrl}" class="btn">Complete Billing →</a>
        </div>
        <hr class="divider">
        <p>If you have any questions, reach out at <a href="mailto:${contactEmail}" style="color:#c6f135;">${contactEmail}</a>.</p>
        <p>Looking forward to working with you,</p>
        <p><strong class="highlight">${brand === 'below-the-board' ? 'Zach Gallis' : 'Cameron Gallacher'}</strong><br>
        <span style="color:#555;font-size:13px;">${agencyName}</span></p>
      `
      await sendEmail({
        to: clientEmail,
        subject: `Your agreement is confirmed — complete your billing to get started`,
        html: emailWrapper(clientContent, brand),
        from: getSenderName(brand),
      })
    }

    // 2. Admin notification
    const adminContent = `
      <h1>Agreement Signed 📝</h1>
      <p><span class="highlight">${clientName}</span> has signed the marketing agreement.</p>
      <div class="box">
        <h3>Details</h3>
        <table>
          <tr><td class="label">Client</td><td>${clientName}</td></tr>
          ${clientEmail ? `<tr><td class="label">Email</td><td>${clientEmail}</td></tr>` : ''}
          <tr><td class="label">Package</td><td>${packageName || 'Not specified'}</td></tr>
          ${packagePrice ? `<tr><td class="label">Price</td><td>${packagePrice}/mo</td></tr>` : ''}
          <tr><td class="label">Agency</td><td>${agencyName}</td></tr>
          <tr><td class="label">Time</td><td>${new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver', dateStyle: 'medium', timeStyle: 'short' })} PT</td></tr>
        </table>
      </div>
      <p><a href="${billingUrl}" class="btn">View Billing Step →</a></p>
    `

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[${agencyName}] Agreement signed by ${clientName}${packageName ? ` — ${packageName}` : ''}`,
      html: emailWrapper(adminContent, brand),
      from: getSenderName(brand),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('send-agreement-signed error:', err)
    return res.status(200).json({ success: true, emailError: err.message })
  }
}
