/**
 * Vercel Serverless Function: /api/send-onboarding-form
 * Receives onboarding form submission and emails it to cam@latchedinc.com
 * and sends a confirmation copy to the client.
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
      additionalEmails,
      teamContacts,
      reportingSchedule,
      domainNames,
      domainRegistrar,
      websitePlatform,
      websiteLogin,
      hostingProvider,
      googleAnalytics,
      googleSearchConsole,
      googleMyBusiness,
      sitePlannedChanges,
      targetCategories,
      targetKeywords,
      targetAudience,
      competitors,
      existingResources,
      prHistory,
      algorithmUpdates,
      successGoals,
      avoidItems,
      focusProducts,
      marketingAssets,
      anythingElse,
      slug,
      pkgId,
      addonId,
      clientName,
      agencyName,
      analyticsEmail,
    } = req.body

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid client email is required' })
    }

    const field = (label, value) => value
      ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #222;color:#888;font-size:13px;width:35%;vertical-align:top;">${label}</td><td style="padding:10px 16px;border-bottom:1px solid #222;color:#fff;font-size:13px;">${value.replace(/\n/g, '<br>')}</td></tr>`
      : ''

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Onboarding Form — ${clientName}</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'DM Sans', Arial, sans-serif; color: #ffffff; }
    .container { max-width: 700px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; }
    .meta { font-size: 13px; color: #888; margin-bottom: 32px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #c6f135; padding: 12px 16px; background: #111; border-top: 1px solid #222; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: #0d0d0d; border: 1px solid #222; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #555; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">CAMERON.</div>
    <h1>New Onboarding Form Submission</h1>
    <div class="meta">
      Client: <strong style="color:#fff">${clientName}</strong> &nbsp;|&nbsp;
      Package: <strong style="color:#fff">${pkgId}</strong>${addonId ? ` + ${addonId}` : ''} &nbsp;|&nbsp;
      Submitted: <strong style="color:#fff">${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
    </div>

    <div class="section-title">Contact Information</div>
    <table>
      ${field('Client Email', clientEmail)}
      ${field('Additional Emails', additionalEmails)}
    </table>

    <div class="section-title">Communication Preferences</div>
    <table>
      ${field('Team Contacts', teamContacts)}
      ${field('Reporting Schedule', reportingSchedule)}
    </table>

    <div class="section-title">Account Access</div>
    <table>
      ${field('Domain Names', domainNames)}
      ${field('Domain Registrar', domainRegistrar)}
      ${field('Website Platform', websitePlatform)}
      ${field('Website Login', websiteLogin)}
      ${field('Hosting Provider', hostingProvider)}
      ${field('Google Analytics', googleAnalytics)}
      ${field('Google Search Console', googleSearchConsole)}
      ${field('Google My Business', googleMyBusiness)}
      ${field('Planned Site Changes', sitePlannedChanges)}
    </table>

    <div class="section-title">SEO Strategy</div>
    <table>
      ${field('Target Categories', targetCategories)}
      ${field('Target Keywords', targetKeywords)}
      ${field('Target Audience', targetAudience)}
      ${field('Competitors', competitors)}
      ${field('Existing Resources', existingResources)}
      ${field('PR History', prHistory)}
      ${field('Algorithm Updates', algorithmUpdates)}
      ${field('Success Goals', successGoals)}
      ${field('Items to Avoid', avoidItems)}
    </table>

    <div class="section-title">Marketing Assets & Additional Info</div>
    <table>
      ${field('Marketing Assets', marketingAssets)}
      ${field('Focus Products', focusProducts)}
      ${field('Anything Else', anythingElse)}
    </table>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Cameron Gallacher · All Rights Reserved</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not set — skipping email send')
      return res.status(200).json({ success: true, message: 'Form received (email skipped — no API key)' })
    }

    // Send to cam@latchedinc.com (internal copy)
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cameron Gallacher <cam@latchedinc.com>',
        to: ['cam@latchedinc.com'],
        subject: `Onboarding Form — ${clientName} (${pkgId})`,
        html: emailHtml,
      }),
    })

    // Send confirmation to client
    const confirmHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Onboarding Form Received</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="font-size:24px;font-weight:900;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">CAMERON.</div>
    <h1 style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Onboarding Form Received!</h1>
    <p style="color:#aaa;font-size:15px;line-height:1.7;">Hi ${clientName?.split(' ')[0] || 'there'},</p>
    <p style="color:#aaa;font-size:15px;line-height:1.7;">We've received your onboarding form. Our team will review your information and reach out within 24 hours to confirm your campaign launch date.</p>
    <p style="color:#aaa;font-size:15px;line-height:1.7;">If you have any questions, reach out at <a href="mailto:cam@latchedinc.com" style="color:#c6f135;">cam@latchedinc.com</a>.</p>
    <p style="color:#aaa;font-size:15px;line-height:1.7;">Looking forward to working with you,<br><strong style="color:#fff;">Cameron Gallacher</strong></p>
    <div style="font-size:12px;color:#555;text-align:center;margin-top:40px;">
      <p>© ${new Date().getFullYear()} Cameron Gallacher · All Rights Reserved</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const toAddresses = [clientEmail]
    if (additionalEmails) {
      additionalEmails.split(',').forEach((e) => {
        const trimmed = e.trim()
        if (trimmed.includes('@')) toAddresses.push(trimmed)
      })
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cameron Gallacher <cam@latchedinc.com>',
        to: toAddresses,
        subject: 'Onboarding Form Received — Cameron Gallacher',
        html: confirmHtml,
      }),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Form submit error:', err)
    return res.status(500).json({ error: err.message || 'Failed to process form submission' })
  }
}
