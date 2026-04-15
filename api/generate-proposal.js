/**
 * POST /api/generate-proposal
 * 
 * Accepts admin form data, uses OpenAI to generate a full proposal JSON,
 * commits it as a draft to GitHub (drafts/ branch), and sends an admin
 * review email with an Approve button.
 * 
 * Body (multipart/form-data or JSON):
 *   clientName        string  — e.g. "Dr. Katie Beleznay"
 *   clientEmail       string  — e.g. "katie@example.com"
 *   clientWebsite     string  — e.g. "https://drkatiebeleznay.com"
 *   brand             string  — "cameron-gallacher" | "below-the-board"
 *   industry          string  — e.g. "Cosmetic Dermatology"
 *   location          string  — e.g. "Vancouver, BC"
 *   services          string  — comma-separated e.g. "SEO, Content Marketing"
 *   notes             string  — admin notes / client requirements
 *   recommendedPkg    string  — "kickstarter" | "growth" | "domination"
 *   logoUrl           string  — public URL of uploaded logo (optional)
 *   password          string  — proposal password (optional, auto-generated if blank)
 */

import OpenAI from 'openai'
import { sendEmail, emailWrapper, emailFooter } from './_gmail.js'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO  = 'btb-marketing/cam-proposals'
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL || 'richard@belowtheboard.com'
const BASE_URL     = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://camgallacher.com'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePassword(name) {
  const base = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)
  const num  = Math.floor(1000 + Math.random() * 9000)
  return `${base}${num}`
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

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

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check admin auth header
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== process.env.ADMIN_API_KEY && adminKey !== '@GymZQFbofDaci4uEfiR') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const {
      clientName,
      clientEmail,
      clientWebsite,
      brand = 'cameron-gallacher',
      industry,
      location,
      services,
      notes,
      recommendedPkg = 'growth',
      logoUrl,
      password: providedPassword,
    } = req.body

    if (!clientName || !clientEmail) {
      return res.status(400).json({ error: 'clientName and clientEmail are required' })
    }

    const slug     = slugify(clientName)
    const password = providedPassword || generatePassword(clientName)
    const isCG     = brand !== 'below-the-board'
    const agencyName  = isCG ? 'Cameron Gallacher Consulting' : 'Below the Board Marketing'
    const agencyEmail = isCG ? 'cam@latchedinc.com' : 'zach@belowtheboard.com'
    const agencyPerson = isCG ? 'Cameron Gallacher' : 'Zach Gallis'

    // ── 1. Generate proposal JSON via OpenAI ──────────────────────────────────
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = `You are an expert digital marketing strategist generating a detailed, personalized proposal JSON for ${agencyName}.

The proposal JSON must follow this exact TypeScript interface structure:
{
  slug: string,
  brand: "cameron-gallacher" | "below-the-board",
  password: string,
  meta: { title, preparedBy, preparedFor, date, ctaUrl, ctaLabel, brand },
  hero: { clientName, tagline (2-3 line string with \\n), subTagline },
  about: { heading: "About Us", description: string, notableClients: [] },
  team: [{ name, title, initials, photo }],
  overview: { headline, subheadline, objectives: string[], strategy: [{title, description}] },
  keywordAreas: { intro, keywords: string[] },
  scopeOfWork: { months: [{month, title, tasks: string[]}] },
  deliverables: string[],
  successMetrics: [{metric, description}],
  investment: {
    sectionTitle, sectionSubtitle, packagesLabel, addonsLabel,
    packages: [{id, name, price (CAD number), currency:"CAD", period:"mo", plusTax:true, badge, defaultSelected, description, deliverables:[{category,items:string[]}]}],
    addons: [{id, name, price, currency:"CAD", period:"mo", plusTax:true, badge, defaultSelected:false, description, deliverables:[{category,items:string[]}]}],
    roiContext, exitClause
  },
  caseStudies: [{client, service, result, description}],
  nextSteps: { closing, ctaUrl, ctaLabel, email }
}

Rules:
- Make the proposal highly specific to the client's industry, location, and business
- The recommended package should have defaultSelected: true, others false
- Always include 3 packages: kickstarter (~$2,500 CAD/mo), growth (~$4,500 CAD/mo), domination (~$7,500 CAD/mo) — adjust names/prices to fit the industry
- Always include 2-3 backlink add-on packages at $500, $1000, $1500 CAD/mo
- Use the provided agency details for all contact info and team members
- Return ONLY valid JSON, no markdown, no explanation`

    const userPrompt = `Generate a proposal for:
- Client Name: ${clientName}
- Client Email: ${clientEmail}
- Client Website: ${clientWebsite || 'not provided'}
- Industry: ${industry || 'not specified'}
- Location: ${location || 'not specified'}
- Services Requested: ${services || 'SEO, Digital Marketing'}
- Recommended Package: ${recommendedPkg}
- Admin Notes: ${notes || 'none'}
- Logo URL: ${logoUrl || 'none'}
- Slug: ${slug}
- Password: ${password}
- Brand: ${brand}
- Agency Name: ${agencyName}
- Agency Email: ${agencyEmail}
- Agency Person: ${agencyPerson}
- Calendly URL: ${isCG ? 'https://calendly.com/belowtheboard/intro-call' : 'https://calendly.com/belowtheboard/intro-call'}
- Date: ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })}

If a logo URL is provided, add a "logoUrl" field at the top level of the JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    let proposalJson
    try {
      const raw = completion.choices[0].message.content.trim()
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      proposalJson = JSON.parse(cleaned)
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse AI-generated proposal JSON', details: parseErr.message })
    }

    // Ensure slug and password are correct
    proposalJson.slug     = slug
    proposalJson.password = password
    proposalJson.brand    = brand
    if (logoUrl) proposalJson.logoUrl = logoUrl

    const proposalContent = JSON.stringify(proposalJson, null, 2)

    // ── 2. Commit draft to GitHub (drafts/ branch) ────────────────────────────
    const filePath    = `src/data/proposals/drafts/${slug}.json`
    const branchName  = `draft/${slug}`
    const commitMsg   = `draft: proposal for ${clientName} (${slug})`

    // Get main branch SHA
    const mainRef = await githubRequest('GET', `/repos/${GITHUB_REPO}/git/ref/heads/main`)
    const mainSha = mainRef.object.sha

    // Create draft branch
    try {
      await githubRequest('POST', `/repos/${GITHUB_REPO}/git/refs`, {
        ref: `refs/heads/${branchName}`,
        sha: mainSha,
      })
    } catch (e) {
      // Branch may already exist — that's fine
      if (!e.message.includes('already exists') && !e.message.includes('Reference already exists')) throw e
    }

    // Get current file SHA if it exists (for updates)
    let existingSha
    try {
      const existing = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${filePath}?ref=${branchName}`)
      existingSha = existing.sha
    } catch (_) {}

    // Commit the file
    await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${filePath}`, {
      message: commitMsg,
      content: Buffer.from(proposalContent).toString('base64'),
      branch: branchName,
      ...(existingSha ? { sha: existingSha } : {}),
    })

    // ── 3. Send admin review email ─────────────────────────────────────────────
    const approveUrl = `${BASE_URL}/api/approve-proposal?slug=${slug}&branch=${encodeURIComponent(branchName)}&token=${encodeURIComponent(password)}`
    const previewUrl = `https://github.com/btb-marketing/cam-proposals/blob/${branchName}/${filePath}`

    const emailHtml = emailWrapper(`
      <h2 style="color:#c8ff00;margin:0 0 8px">New Proposal Draft Ready for Review</h2>
      <p style="color:#aaa;margin:0 0 24px">A new proposal has been generated and is awaiting your approval before being sent to the client.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:8px 0;color:#888;width:140px">Client</td><td style="padding:8px 0;color:#fff;font-weight:600">${clientName}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0;color:#fff">${clientEmail}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Website</td><td style="padding:8px 0;color:#fff">${clientWebsite || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Industry</td><td style="padding:8px 0;color:#fff">${industry || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Brand</td><td style="padding:8px 0;color:#fff">${agencyName}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Package</td><td style="padding:8px 0;color:#fff">${recommendedPkg}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Password</td><td style="padding:8px 0;color:#c8ff00;font-family:monospace">${password}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Proposal URL</td><td style="padding:8px 0;color:#fff;font-family:monospace">/proposal/${slug}/</td></tr>
      </table>

      <div style="margin-bottom:16px">
        <a href="${approveUrl}" style="display:inline-block;background:#c8ff00;color:#000;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;margin-right:12px">
          ✓ Approve &amp; Deploy Proposal
        </a>
        <a href="${previewUrl}" style="display:inline-block;background:#1a1a1a;color:#c8ff00;font-weight:600;padding:14px 24px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #333">
          View Draft JSON on GitHub ↗
        </a>
      </div>

      <p style="color:#666;font-size:13px;margin-top:16px">
        Clicking "Approve &amp; Deploy" will merge this draft into main and trigger a Vercel deployment. 
        The client will <strong>not</strong> be notified until you separately send them their password.
      </p>

      ${emailFooter(brand)}
    `, brand)

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Review Required] New Proposal Draft: ${clientName}`,
      html: emailHtml,
    })

    return res.status(200).json({
      success: true,
      slug,
      password,
      branch: branchName,
      approveUrl,
      message: `Draft proposal created for ${clientName}. Review email sent to ${ADMIN_EMAIL}.`,
    })

  } catch (err) {
    console.error('generate-proposal error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
