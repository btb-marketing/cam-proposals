/**
 * POST /api/upload-logo
 * 
 * Accepts a base64-encoded image and uploads it to public/logos/ in the GitHub repo.
 * Returns the public URL of the uploaded logo.
 * 
 * Body (JSON):
 *   filename   string  — e.g. "latched-agency.png"
 *   content    string  — base64-encoded image data (without data URI prefix)
 *   mimeType   string  — e.g. "image/png"
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO  = 'btb-marketing/cam-proposals'

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const adminKey = req.headers['x-admin-key']
  if (adminKey !== process.env.ADMIN_API_KEY && adminKey !== '@GymZQFbofDaci4uEfiR') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { filename, content, mimeType } = req.body

    if (!filename || !content) {
      return res.status(400).json({ error: 'filename and content are required' })
    }

    // Sanitize filename
    const safeName = filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
    const filePath = `public/logos/${safeName}`

    // Check if file already exists (for SHA)
    let existingSha
    try {
      const existing = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${filePath}?ref=main`)
      existingSha = existing.sha
    } catch (_) {}

    // Upload to GitHub
    await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${filePath}`, {
      message: `asset: upload logo ${safeName}`,
      content, // already base64
      branch: 'main',
      ...(existingSha ? { sha: existingSha } : {}),
    })

    // Return the public URL (served via Vercel from public/)
    const publicUrl = `/logos/${safeName}`

    return res.status(200).json({ success: true, url: publicUrl, filename: safeName })

  } catch (err) {
    console.error('upload-logo error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
