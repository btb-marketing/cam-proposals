/**
 * Vercel Serverless Function: POST /api/send-package-selected
 * Fires when a client clicks "Proceed to Agreement" on the package review page.
 * Sends an admin notification to richard@belowtheboard.com.
 */
import { sendEmail, ADMIN_EMAIL, emailWrapper, getSenderName } from './_gmail.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { clientName, slug, brand, packageName, packagePrice, addonName } = req.body
    if (!clientName || !slug) {
      return res.status(400).json({ error: 'clientName and slug are required' })
    }

    const agencyName = brand === 'below-the-board' ? 'Below the Board Marketing' : 'Cameron Gallacher Consulting'
    const proposalUrl = `https://camgallacher.com/proposal/${slug}/`

    const content = `
      <h1>Package Selected 📦</h1>
      <p><span class="highlight">${clientName}</span> has selected a package and is proceeding to the agreement.</p>
      <div class="box">
        <h3>Selection Details</h3>
        <table>
          <tr><td class="label">Client</td><td>${clientName}</td></tr>
          <tr><td class="label">Package</td><td>${packageName || 'Not specified'}</td></tr>
          ${packagePrice ? `<tr><td class="label">Price</td><td>${packagePrice}/mo</td></tr>` : ''}
          ${addonName ? `<tr><td class="label">Add-on</td><td>${addonName}</td></tr>` : ''}
          <tr><td class="label">Agency</td><td>${agencyName}</td></tr>
          <tr><td class="label">Time</td><td>${new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver', dateStyle: 'medium', timeStyle: 'short' })} PT</td></tr>
        </table>
      </div>
      <p><a href="${proposalUrl}" class="btn">View Proposal →</a></p>
    `

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[${agencyName}] ${clientName} selected ${packageName || 'a package'} — proceeding to agreement`,
      html: emailWrapper(content, brand),
      from: getSenderName(brand),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('send-package-selected error:', err)
    return res.status(200).json({ success: true, emailError: err.message })
  }
}
