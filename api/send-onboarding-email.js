/**
 * Vercel Serverless Function: /api/send-onboarding-email
 * Sends a follow-up email to the client after completing Step 3 (Billing)
 * with a link to their onboarding form.
 *
 * Uses Resend (resend.com) for email delivery.
 * Set RESEND_API_KEY in Vercel environment variables.
 */

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
      agencyName,
      brand,
    } = req.body

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid client email is required' })
    }

    const onboardingFormUrl = `https://camgallacher.com/proposal/${slug}/onboarding-form?pkg=${pkgId}&addon=${addonId || ''}&email=${encodeURIComponent(clientEmail)}`

    // Determine Calendly link
    const calendlyUrl = brand === 'below-the-board'
      ? 'https://calendly.com/belowtheboard/onboarding'
      : 'https://calendly.com/belowtheboard/onboarding-cg'

    const firstName = clientName ? clientName.split(' ')[0] : 'there'

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to ${agencyName || 'Cameron Gallacher'}</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'DM Sans', Arial, sans-serif; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; margin-bottom: 32px; }
    .logo span { color: #c6f135; }
    h1 { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px; color: #ffffff; }
    p { font-size: 15px; line-height: 1.7; color: #aaaaaa; margin: 0 0 16px; }
    .highlight { color: #ffffff; }
    .btn { display: inline-block; background: #c6f135; color: #0a0a0a; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 4px; text-decoration: none; margin: 8px 0; }
    .btn-outline { display: inline-block; background: transparent; color: #ffffff; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 13px 28px; border-radius: 4px; text-decoration: none; border: 1px solid #333; margin: 8px 0; }
    .divider { border: none; border-top: 1px solid #222; margin: 32px 0; }
    .footer { font-size: 12px; color: #555; text-align: center; margin-top: 40px; }
    .step-box { background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px 24px; margin: 16px 0; }
    .step-box h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #c6f135; margin: 0 0 8px; }
    .step-box p { margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">CAMERON<span>.</span></div>

    <h1>You're Officially Enrolled!</h1>
    <p>Hi <span class="highlight">${firstName}</span>,</p>
    <p>Your agreement has been signed and your billing details are securely saved. Welcome aboard — we're excited to get your campaign launched.</p>

    <hr class="divider">

    <p><strong class="highlight">Here are your next two steps:</strong></p>

    <div class="step-box">
      <h3>Step 1 — Book Your Onboarding Call</h3>
      <p>Schedule your onboarding call so we can review your goals, walk through the strategy, and set a campaign launch date.</p>
      <br>
      <a href="${calendlyUrl}" class="btn">Book Onboarding Call →</a>
    </div>

    <div class="step-box">
      <h3>Step 2 — Complete Your Onboarding Form</h3>
      <p>Fill out your onboarding form so our team can prepare everything before your call. This takes about 10–15 minutes. You can also complete it after your call if needed.</p>
      <br>
      <a href="${onboardingFormUrl}" class="btn-outline">Fill Out Onboarding Form →</a>
    </div>

    <hr class="divider">

    <p>If you have any questions in the meantime, feel free to reach out at <a href="mailto:cam@latchedinc.com" style="color: #c6f135;">cam@latchedinc.com</a>.</p>

    <p>Looking forward to working with you,</p>
    <p><strong class="highlight">Cameron Gallacher</strong><br>
    <span style="color: #555; font-size: 13px;">CEO, ${agencyName || 'Below the Board Marketing'}</span></p>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Cameron Gallacher · All Rights Reserved</p>
      <p>12894891 Canada Inc. dba Below the Board Marketing · 170-422 Richards Street, Vancouver BC</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Use Resend API to send the email
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      // If no Resend key, log and return success anyway (email sending is optional)
      console.log('RESEND_API_KEY not set — skipping email send')
      return res.status(200).json({ success: true, message: 'Email skipped (no API key configured)' })
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cameron Gallacher <cam@latchedinc.com>',
        to: [clientEmail],
        subject: `Welcome to ${agencyName || 'Cameron Gallacher'} — Your Next Steps`,
        html: emailHtml,
      }),
    })

    const emailData = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Resend error:', emailData)
      // Don't fail the whole request if email fails
      return res.status(200).json({ success: true, emailError: emailData.message })
    }

    return res.status(200).json({ success: true, emailId: emailData.id })
  } catch (err) {
    console.error('Email send error:', err)
    // Don't fail the whole request if email fails
    return res.status(200).json({ success: true, emailError: err.message })
  }
}
