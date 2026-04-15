/**
 * _gmail.js — Shared Gmail OAuth2 helper for all Vercel API routes.
 *
 * Uses the Gmail REST API directly (no googleapis package needed in Vercel edge).
 * Credentials come from environment variables set in Vercel:
 *   GMAIL_CLIENT_ID
 *   GMAIL_CLIENT_SECRET
 *   GMAIL_REFRESH_TOKEN
 *   GMAIL_SENDER_EMAIL
 */

/**
 * Get a fresh access token using the stored refresh token.
 */
async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

/**
 * Send an email via the Gmail API.
 *
 * @param {object} opts
 * @param {string|string[]} opts.to       - Recipient email(s)
 * @param {string}          opts.subject  - Email subject
 * @param {string}          opts.html     - HTML body
 * @param {string}          [opts.from]   - Override sender display name
 * @param {string|string[]} [opts.cc]     - CC recipients
 * @param {string|string[]} [opts.bcc]    - BCC recipients
 */
export async function sendEmail({ to, subject, html, from, cc, bcc }) {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL || 'richard@belowtheboard.com'
  const senderName  = from || 'Cameron Gallacher'
  const fromHeader  = `${senderName} <${senderEmail}>`

  const toList  = Array.isArray(to)  ? to.join(', ')  : to
  const ccList  = cc  ? (Array.isArray(cc)  ? cc.join(', ')  : cc)  : null
  const bccList = bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : null

  // Build raw RFC 2822 message
  const lines = [
    `From: ${fromHeader}`,
    `To: ${toList}`,
    ccList  ? `Cc: ${ccList}`  : null,
    bccList ? `Bcc: ${bccList}` : null,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].filter(Boolean).join('\r\n')

  const raw = Buffer.from(lines)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const accessToken = await getAccessToken()

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Gmail send failed: ${JSON.stringify(data)}`)
  }
  return data // { id, threadId, labelIds }
}

/**
 * Brand-aware sender name helper.
 */
export function getSenderName(brand) {
  return brand === 'below-the-board' ? 'Below the Board Marketing' : 'Cameron Gallacher'
}

/**
 * Brand-aware admin notification email.
 * Always goes to richard@belowtheboard.com.
 */
export const ADMIN_EMAIL = 'richard@belowtheboard.com'

/**
 * Shared email footer HTML.
 */
export function emailFooter(brand) {
  const year = new Date().getFullYear()
  if (brand === 'below-the-board') {
    return `
      <div style="border-top:1px solid #222;margin-top:40px;padding-top:24px;font-size:12px;color:#555;text-align:center;">
        <p>© ${year} Below the Board Marketing · All Rights Reserved</p>
        <p>12894891 Canada Inc. dba Below the Board Marketing · 170-422 Richards Street, Vancouver BC</p>
      </div>`
  }
  return `
    <div style="border-top:1px solid #222;margin-top:40px;padding-top:24px;font-size:12px;color:#555;text-align:center;">
      <p>© ${year} Cameron Gallacher · All Rights Reserved</p>
      <p>12894891 Canada Inc. dba Below the Board Marketing · 170-422 Richards Street, Vancouver BC</p>
    </div>`
}

/**
 * Shared email wrapper HTML.
 */
export function emailWrapper(content, brand) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',Arial,sans-serif;color:#fff}
    .container{max-width:600px;margin:0 auto;padding:40px 24px}
    .logo{font-size:28px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:32px}
    .logo span{color:#c6f135}
    h1{font-size:26px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;color:#fff}
    h2{font-size:18px;font-weight:700;margin:0 0 12px;color:#fff}
    p{font-size:15px;line-height:1.7;color:#aaa;margin:0 0 16px}
    .highlight{color:#fff}
    .accent{color:#c6f135}
    .btn{display:inline-block;background:#c6f135;color:#0a0a0a;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:1px;padding:14px 28px;border-radius:4px;text-decoration:none;margin:8px 0}
    .btn-outline{display:inline-block;background:transparent;color:#fff;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:1px;padding:13px 28px;border-radius:4px;text-decoration:none;border:1px solid #333;margin:8px 0}
    .divider{border:none;border-top:1px solid #222;margin:32px 0}
    .box{background:#111;border:1px solid #222;border-radius:8px;padding:20px 24px;margin:16px 0}
    .box h3{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#c6f135;margin:0 0 8px}
    .box p{margin:0;font-size:14px}
    .tag{display:inline-block;background:#1a1a1a;border:1px solid #333;color:#c6f135;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:3px;margin-right:6px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;padding:8px 12px;text-align:left;border-bottom:1px solid #222}
    td{font-size:14px;color:#aaa;padding:10px 12px;border-bottom:1px solid #1a1a1a}
    td.label{color:#fff;font-weight:600;width:40%}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">${brand === 'below-the-board' ? 'BELOW THE BOARD<span>.</span>' : 'CAMERON<span>.</span>'}</div>
    ${content}
    ${emailFooter(brand)}
  </div>
</body>
</html>`
}
