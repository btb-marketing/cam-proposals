import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
    })

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
    })
  } catch (err) {
    console.error('Stripe SetupIntent error:', err)
    return res.status(500).json({ error: err.message })
  }
}
