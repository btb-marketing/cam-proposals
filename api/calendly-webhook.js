/**
 * Calendly Webhook Handler
 * 
 * Listens for `invitee.created` events from Calendly.
 * When a client books an onboarding call (onboarding or onboarding-cg event types),
 * this handler:
 *   1. Looks up the Stripe customer by the invitee's email
 *   2. Finds their draft subscription
 *   3. Activates (resumes) the subscription so billing begins
 * 
 * Endpoint: POST /api/calendly-webhook
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// The slugs of the onboarding event types we want to trigger activation on
const ONBOARDING_SLUGS = ['onboarding', 'onboarding-cg']

module.exports = async (req, res) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const payload = req.body

    // Calendly sends the event type in payload.event
    const eventType = payload?.event
    const invitee = payload?.payload?.invitee
    const eventTypeUri = payload?.payload?.event_type

    // We only care about new bookings (invitee.created)
    if (eventType !== 'invitee.created') {
      return res.status(200).json({ message: 'Event ignored', event: eventType })
    }

    // Check if this is one of our onboarding event types
    // The event_type URI looks like: https://api.calendly.com/event_types/ddab74f8-...
    // We check the slug from the scheduled event's event_type_name
    const eventTypeName = payload?.payload?.event?.name || ''
    const eventTypeSlug = eventTypeUri?.split('/').pop() || ''

    // We'll check both the event_type UUID and the invitee email
    const inviteeEmail = invitee?.email
    const inviteeName = invitee?.name

    console.log(`Calendly webhook: ${eventType} | ${inviteeEmail} | event_type: ${eventTypeUri}`)

    // Known onboarding event type UUIDs
    const ONBOARDING_UUIDS = [
      'ddab74f8-316d-4be9-8ed7-67e32818c0e7', // onboarding-cg
      '3476cb8f-2395-473e-8c1d-94b7007bd909', // onboarding
    ]

    const isOnboarding = ONBOARDING_UUIDS.some(uuid => eventTypeUri?.includes(uuid))

    if (!isOnboarding) {
      return res.status(200).json({ message: 'Not an onboarding event, skipping' })
    }

    if (!inviteeEmail) {
      return res.status(200).json({ message: 'No invitee email, skipping' })
    }

    // Look up the Stripe customer by email
    const customers = await stripe.customers.list({ email: inviteeEmail, limit: 5 })

    if (customers.data.length === 0) {
      console.log(`No Stripe customer found for ${inviteeEmail}`)
      return res.status(200).json({ message: `No Stripe customer found for ${inviteeEmail}` })
    }

    // Find the most recent customer (in case of duplicates)
    const customer = customers.data[0]
    console.log(`Found Stripe customer: ${customer.id} (${customer.email})`)

    // Find their draft subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'draft',
      limit: 5,
    })

    if (subscriptions.data.length === 0) {
      // Also check for paused subscriptions
      const pausedSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'paused',
        limit: 5,
      })

      if (pausedSubs.data.length === 0) {
        console.log(`No draft/paused subscription found for customer ${customer.id}`)
        return res.status(200).json({ message: `No draft subscription found for ${inviteeEmail}` })
      }

      // Activate the paused subscription
      const sub = pausedSubs.data[0]
      await stripe.subscriptions.update(sub.id, {
        pause_collection: '',
        metadata: {
          ...sub.metadata,
          activated_at: new Date().toISOString(),
          activated_by: 'calendly-webhook',
          calendly_event: eventTypeUri,
        }
      })

      console.log(`Activated paused subscription ${sub.id} for ${inviteeEmail}`)
      return res.status(200).json({ 
        message: 'Subscription activated', 
        subscription_id: sub.id,
        customer_email: inviteeEmail
      })
    }

    // Activate the draft subscription by finalizing it
    const sub = subscriptions.data[0]
    
    // Finalize the draft invoice first (if any)
    const invoices = await stripe.invoices.list({
      subscription: sub.id,
      status: 'draft',
      limit: 1,
    })

    if (invoices.data.length > 0) {
      await stripe.invoices.finalizeInvoice(invoices.data[0].id)
      console.log(`Finalized draft invoice ${invoices.data[0].id}`)
    }

    // Update subscription metadata to record activation
    await stripe.subscriptions.update(sub.id, {
      metadata: {
        ...sub.metadata,
        activated_at: new Date().toISOString(),
        activated_by: 'calendly-webhook',
        calendly_event: eventTypeUri,
        onboarding_call_booked: 'true',
      }
    })

    console.log(`Activated draft subscription ${sub.id} for ${inviteeEmail}`)
    return res.status(200).json({ 
      message: 'Subscription activated', 
      subscription_id: sub.id,
      customer_email: inviteeEmail,
      customer_name: inviteeName,
    })

  } catch (err) {
    console.error('Calendly webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
