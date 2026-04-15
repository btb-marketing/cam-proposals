import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Package prices in cents (CAD, before GST)
const PACKAGE_PRICES = {
  kickstarter: 300000,  // $3,000.00 CAD
  elevate:     500000,  // $5,000.00 CAD
  amplify:     800000,  // $8,000.00 CAD
}

const ADDON_PRICES = {
  'backlink-pack-1': 50000,  // $500.00 CAD
  'backlink-pack-2': 100000, // $1,000.00 CAD
  'backlink-pack-3': 150000, // $1,500.00 CAD
}

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

    // Step 1: Create Stripe Customer with the payment method attached
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

    // Step 2: Perform a $1.00 CAD authorization charge to verify the card
    // We use capture_method: 'manual' so we can authorize without capturing
    let authPaymentIntent
    try {
      authPaymentIntent = await stripe.paymentIntents.create({
        amount: 100, // $1.00 CAD in cents
        currency: 'cad',
        customer: customer.id,
        payment_method: paymentMethodId,
        confirm: true,
        capture_method: 'manual', // Authorize only, do not capture
        description: 'Card authorization — $1.00 CAD hold (will not be charged)',
        statement_descriptor: 'BTB MKTING AUTH',
        metadata: {
          type: 'card_authorization',
          proposal: proposalSlug || '',
          package: pkgId,
        },
        return_url: `https://camgallacher.com/proposal/${proposalSlug}/onboarding?pkg=${pkgId}&addon=${addonId || ''}`,
      })
    } catch (authErr) {
      // If the $1 auth fails, the card is invalid — return error to user
      return res.status(402).json({
        error: authErr.message || 'Card authorization failed. Please check your card details.',
        code: authErr.code || 'card_declined',
      })
    }

    // Step 3: Create a Price for the subscription (month-to-month, never ends)
    const price = await stripe.prices.create({
      unit_amount: totalCents,
      currency: 'cad',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      product_data: {
        name: `SEO Services — ${pkgId.charAt(0).toUpperCase() + pkgId.slice(1)} Package${addonId ? ` + ${addonId}` : ''}`,
      },
    })

    // Step 4: Create the subscription in DRAFT status
    // It will only be activated (and billing will begin) after the onboarding call
    // Use collection_method: 'send_invoice' with payment_behavior: 'allow_incomplete' for draft
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      default_payment_method: paymentMethodId,
      // Set to pause — subscription is created but billing does NOT start automatically
      // We will manually activate it after the onboarding call via Stripe dashboard
      trial_end: 'now', // Creates subscription immediately but with no trial period
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      // Pause collection so no invoice is generated until we manually resume
      pause_collection: {
        behavior: 'void', // Void invoices while paused (no charges)
      },
      metadata: {
        proposal: proposalSlug || '',
        package: pkgId,
        addon: addonId || '',
        status: 'pending_onboarding',
        auth_payment_intent: authPaymentIntent.id,
      },
    })

    return res.status(200).json({
      success: true,
      customerId: customer.id,
      subscriptionId: subscription.id,
      authPaymentIntentId: authPaymentIntent.id,
      authStatus: authPaymentIntent.status, // 'requires_capture' means auth succeeded
      message: 'Customer created, card authorized, and subscription prepared. Billing will begin after onboarding.',
    })
  } catch (err) {
    console.error('Stripe error:', err)
    return res.status(500).json({
      error: err.message || 'An error occurred processing your payment.',
    })
  }
}
