/**
 * GET /api/list-proposals
 * Returns all proposals from this project for the shared admin panel.
 * Protected by the admin password via x-admin-key header or ?key= query param.
 */

const fs = require('fs')
const path = require('path')

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@GymZQFbofDaci4uEfiR'

export default function handler(req, res) {
  // CORS — allow requests from the sister project
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'x-admin-key, Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth check
  const key = req.headers['x-admin-key'] || req.query.key
  if (key !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const proposalsDir = path.join(process.cwd(), 'src', 'data', 'proposals')
    const files = fs.readdirSync(proposalsDir).filter(f => f.endsWith('.json'))

    const proposals = files.map(file => {
      try {
        const raw = fs.readFileSync(path.join(proposalsDir, file), 'utf8')
        const data = JSON.parse(raw)
        return {
          slug: file.replace('.json', ''),
          clientName: data.meta?.preparedFor || file.replace('.json', ''),
          clientEmail: data.nextSteps?.email || '',
          brand: data.brand || 'cameron-gallacher',
          password: data.password || '',
          package: data.investment?.packages?.find(p => p.defaultSelected)?.name || '',
          date: data.meta?.date || '',
        }
      } catch {
        return null
      }
    }).filter(Boolean)

    return res.status(200).json({ proposals, source: 'cam-proposals' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
