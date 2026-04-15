/**
 * GET /api/approve-proposal?slug=...&branch=...&token=...
 * 
 * Called when admin clicks "Approve" in the review email.
 * Moves the draft JSON from src/data/proposals/drafts/{slug}.json
 * to src/data/proposals/{slug}.json on main branch, then deletes the draft branch.
 * Vercel auto-deploys on push to main.
 */

import { sendEmail, emailWrapper, emailFooter } from './_gmail.js'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO  = 'btb-marketing/cam-proposals'
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL || 'richard@belowtheboard.com'
const BASE_URL     = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://camgallacher.com'

async function githubRequest(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'cam-proposals-api',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${JSON.stringify(data)}`)
  return data
}

export default async function handler(req, res) {
  const { slug, branch, token } = req.query

  if (!slug || !branch) {
    return res.status(400).send('<h1>Missing parameters</h1>')
  }

  try {
    const draftPath = `src/data/proposals/drafts/${slug}.json`
    const finalPath = `src/data/proposals/${slug}.json`

    // ── 1. Read the draft file from the draft branch ──────────────────────────
    const draftFile = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${draftPath}?ref=${encodeURIComponent(branch)}`)
    const content   = Buffer.from(draftFile.content, 'base64').toString('utf8')
    const proposal  = JSON.parse(content)

    // ── 2. Check if final file already exists on main (for SHA) ───────────────
    let existingSha
    try {
      const existing = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${finalPath}?ref=main`)
      existingSha = existing.sha
    } catch (_) {}

    // ── 3. Commit final file to main ──────────────────────────────────────────
    await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${finalPath}`, {
      message: `feat: approve proposal for ${proposal.meta?.preparedFor || slug}`,
      content: Buffer.from(content).toString('base64'),
      branch: 'main',
      ...(existingSha ? { sha: existingSha } : {}),
    })

    // ── 4. Delete the draft file from the draft branch ────────────────────────
    try {
      await githubRequest('DELETE', `/repos/${GITHUB_REPO}/contents/${draftPath}`, {
        message: `cleanup: remove draft after approval for ${slug}`,
        sha: draftFile.sha,
        branch,
      })
    } catch (_) {}

    // ── 5. Delete the draft branch ────────────────────────────────────────────
    try {
      await githubRequest('DELETE', `/repos/${GITHUB_REPO}/git/refs/heads/${branch}`)
    } catch (_) {}

    // ── 6. Send admin confirmation email ──────────────────────────────────────
    const proposalUrl = `${BASE_URL}/proposal/${slug}/`
    const gateUrl     = `${BASE_URL}/proposal/`
    const password    = proposal.password || token || '(see proposal JSON)'
    const brand       = proposal.brand || 'cameron-gallacher'
    const clientName  = proposal.meta?.preparedFor || slug
    const clientEmail = proposal.nextSteps?.email || ''

    const emailHtml = emailWrapper(`
      <h2 style="color:#c8ff00;margin:0 0 8px">Proposal Approved &amp; Deployed</h2>
      <p style="color:#aaa;margin:0 0 24px">
        The proposal for <strong style="color:#fff">${clientName}</strong> has been approved and is deploying to production now.
        Vercel typically takes 60–90 seconds to complete the build.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:8px 0;color:#888;width:140px">Proposal URL</td><td style="padding:8px 0"><a href="${proposalUrl}" style="color:#c8ff00">${proposalUrl}</a></td></tr>
        <tr><td style="padding:8px 0;color:#888">Password Gate</td><td style="padding:8px 0"><a href="${gateUrl}" style="color:#c8ff00">${gateUrl}</a></td></tr>
        <tr><td style="padding:8px 0;color:#888">Client Password</td><td style="padding:8px 0;color:#c8ff00;font-family:monospace;font-size:16px">${password}</td></tr>
      </table>

      <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#888;margin:0 0 8px;font-size:13px">READY-TO-SEND MESSAGE FOR CLIENT</p>
        <p style="color:#fff;margin:0;font-family:monospace;font-size:14px;white-space:pre-wrap">Hi ${clientName},

Your proposal is ready! You can access it here:

🔗 ${gateUrl}
🔑 Password: ${password}

Looking forward to connecting!

${brand === 'below-the-board' ? 'Zach Gallis' : 'Cameron Gallacher'}</p>
      </div>

      <p style="color:#666;font-size:13px">
        The client has <strong>not</strong> been automatically notified. Copy the message above and send it to them when you're ready.
      </p>

      ${emailFooter(brand)}
    `, brand)

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Approved] Proposal deployed: ${clientName}`,
      html: emailHtml,
    })

    // ── 7. Return success HTML page ────────────────────────────────────────────
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Proposal Approved</title>
  <style>
    body { background: #0a0a0a; color: #fff; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #111; border: 1px solid #222; border-radius: 16px; padding: 48px; max-width: 520px; width: 90%; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #c8ff00; margin: 0 0 12px; font-size: 1.6rem; }
    p { color: #aaa; margin: 0 0 24px; line-height: 1.6; }
    .info { background: #0a0a0a; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a1a; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 13px; }
    .value { color: #fff; font-size: 13px; font-family: monospace; }
    .btn { display: inline-block; background: #c8ff00; color: #000; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Proposal Approved!</h1>
    <p>The proposal for <strong>${clientName}</strong> has been committed to main and Vercel is deploying it now (typically 60–90 seconds).</p>
    <div class="info">
      <div class="info-row"><span class="label">Proposal URL</span><span class="value">/proposal/${slug}/</span></div>
      <div class="info-row"><span class="label">Client Password</span><span class="value">${password}</span></div>
    </div>
    <a href="${proposalUrl}" class="btn">View Proposal ↗</a>
  </div>
</body>
</html>`)

  } catch (err) {
    console.error('approve-proposal error:', err)
    return res.status(500).send(`<!DOCTYPE html>
<html><head><title>Error</title></head>
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;padding:48px;text-align:center">
  <h1 style="color:#ff4d4d">Approval Failed</h1>
  <p style="color:#aaa">${err.message}</p>
</body></html>`)
  }
}
