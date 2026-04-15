import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Price IDs — map package IDs to Stripe Price IDs (CAD, recurring monthly)
// These are created dynamically if not found, or you can pre-create them in Stripe dashboard
const PACKAGE_PRICES = {
  kickstarter: 300000,  // $3,000.00 CAD in cents
  elevate:     500000,  // $5,000.00 CAD in cents
  amplify:     800000,  // $8,000.00 CAD in cents
}

const ADDON_PRICES = {
  'backlink-pack-1': 50000,  // $500.00 CAD in cents
  'backlink-pack-2': 100000, // $1,000.00 CAD in cents
  'backlink-pack-3': 150000, // $1,500.00 CAD in cents
}

export default async function handler(req, res) {
  // CORS headers
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
    const {
      paymentMethodId,
      customerName,
      customerEmail,
      pkgId,
      addonId,
      proposalSlug,
    } = req.body

    if (!paymentMethodId || !customerName || !customerEmail || !pkgId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Calculate total in cents (with GST)
    const pkgCents = PACKAGE_PRICES[pkgId] || 0
    const addonCents = addonId ? (ADDON_PRICES[addonId] || 0) : 0
    const subtotalCents = pkgCents + addonCents
    const gstCents = Math.round(subtotalCents * 0.05)
    const totalCents = subtotalCents + gstCents

    if (totalCents === 0) {
      return res.status(400).json({ error: 'Invalid package selection' })
    }

    // 1. Create or retrieve Stripe customer
    const customer = await stripe.customers.create({
      name: customerName,
      email: customerEmail,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        proposal: proposalSlug || '',
        package: pkgId,
        addon: addonId || '',
      },
    })

    // 2. Create a Price on-the-fly (or use a pre-created price)
    const price = await stripe.prices.create({
      unit_amount: totalCents,
      currency: 'cad',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      product_data: {
        name: `SEO Services — ${pkgId.charAt(0).toUpperCase() + pkgId.slice(1)} Package${addonId ? ` + ${addonId}` : ''}`,
        statement_descriptor: 'BTB MKTING',
      },
    })

    // 3. Create the subscription — starts immediately, never ends until cancelled
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      default_payment_method: paymentMethodId,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        proposal: proposalSlug || '',
        package: pkgId,
        addon: addonId || '',
      },
    })

    const invoice = subscription.latest_invoice
    const paymentIntent = invoice?.payment_intent

    return res.status(200).json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: paymentIntent?.client_secret || null,
      status: subscription.status,
    })
  } catch (err) {
    console.error('Stripe error:', err)
    return res.status(500).json({
      error: err.message || 'An error occurred processing your payment.',
    })
  }
}
