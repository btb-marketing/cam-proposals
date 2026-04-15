/**
 * GET /api/list-sister-proposals
 * Proxies the sister project's /api/list-proposals endpoint.
 * Used by the admin panel to show proposals from both projects in one view.
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@GymZQFbofDaci4uEfiR'
const SISTER_URL = process.env.SISTER_PROJECT_URL || 'https://view.belowtheboard.com'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'x-admin-key, Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const key = req.headers['x-admin-key'] || req.query.key
  if (key !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const response = await fetch(`${SISTER_URL}/api/list-proposals`, {
      headers: { 'x-admin-key': ADMIN_PASSWORD },
    })
    if (!response.ok) {
      return res.status(200).json({ proposals: [], source: 'sister', error: `Sister project returned ${response.status}` })
    }
    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(200).json({ proposals: [], source: 'sister', error: err.message })
  }
}
