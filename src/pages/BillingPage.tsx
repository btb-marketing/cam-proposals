import { useParams, useLocation, useSearch } from 'wouter'
import { useState, useEffect, useCallback } from 'react'
import { loadProposal } from '../data/loader'
import { useBrandMeta } from '../hooks/useBrandMeta'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Format a number as North American currency: $3,150.00
function fmtCAD(amount: number): string {
  return amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const STRIPE_ELEMENT_STYLE = {
  base: {
    color: '#ffffff',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: '#555555' },
  },
  invalid: { color: '#ff4d4d' },
}

// ─── Inner form that uses Stripe hooks ───────────────────────────────
interface BillingFormProps {
  proposal: any
  slug: string
  pkgId: string
  addonId: string
  selectedPackage: any
  selectedAddon: any
  totalMonthly: number
  totalGST: number
  totalWithGST: number
  onSuccess: () => void
}

function BillingForm({
  proposal,
  slug,
  pkgId,
  addonId,
  selectedPackage,
  selectedAddon,
  totalMonthly,
  totalGST,
  totalWithGST,
  onSuccess,
}: BillingFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [, navigate] = useLocation()

  const [cardName, setCardName] = useState('')
  const [cardholderEmail, setCardholderEmail] = useState('')
  const [sigName, setSigName] = useState('')
  const [authAgreed, setAuthAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false })

  const canSubmit =
    stripe &&
    elements &&
    cardName.trim().length > 2 &&
    cardholderEmail.includes('@') &&
    cardComplete.number &&
    cardComplete.expiry &&
    cardComplete.cvc &&
    authAgreed &&
    sigName.trim().length > 1 &&
    !loading

  const handleBack = () => {
    navigate(`/proposal/${slug}/agreement?pkg=${pkgId}&addon=${addonId}`)
  }

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Create a PaymentMethod from the card element
      const cardNumberEl = elements.getElement(CardNumberElement)
      if (!cardNumberEl) throw new Error('Card element not found')

      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberEl,
        billing_details: {
          name: cardName,
          email: cardholderEmail,
        },
      })

      if (pmError) throw new Error(pmError.message)
      if (!paymentMethod) throw new Error('Failed to create payment method')

      // 2. Call serverless function to create customer + subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          customerName: cardName,
          customerEmail: cardholderEmail,
          pkgId,
          addonId,
          proposalSlug: slug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // 3. If payment requires confirmation (3D Secure etc.)
      if (data.clientSecret && data.status === 'incomplete') {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret)
        if (confirmError) throw new Error(confirmError.message)
      }

      // 4. Send follow-up email with onboarding form link
      try {
        await fetch('/api/send-onboarding-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: cardholderEmail,
            clientName: cardName,
            slug,
            pkgId,
            addonId,
            agencyName: 'Cameron Gallacher',
            brand: 'cameron-gallacher',
          }),
        })
      } catch (emailErr) {
        // Email sending is non-critical — don't block success
        console.warn('Failed to send follow-up email:', emailErr)
      }

      // 5. Navigate to onboarding booking page
      navigate(`/proposal/${slug}/onboarding?pkg=${pkgId}&addon=${addonId}&email=${encodeURIComponent(cardholderEmail)}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="funnel-page-body">
        <div className="funnel-page-eyebrow">Step 3 of 5</div>
      <h1 className="funnel-page-title display">Billing Details</h1>
      <p className="funnel-page-subtitle">Enter your payment information to complete your enrollment.</p>

      {/* Order Summary */}
      <div className="billing-summary">
        <div className="billing-summary-title display">Order Summary</div>
        <div className="billing-summary-rows">
          {selectedPackage && (
            <div className="billing-summary-row">
              <span>{selectedPackage.name} SEO Package</span>
              <span>${fmtCAD(selectedPackage.price)} CAD/mo</span>
            </div>
          )}
          {selectedAddon && (
            <div className="billing-summary-row">
              <span>{selectedAddon.name}</span>
              <span>${fmtCAD(selectedAddon.price)} CAD/mo</span>
            </div>
          )}
          <div className="billing-summary-row billing-summary-gst">
            <span>GST (5%)</span>
            <span>${fmtCAD(totalGST)} CAD/mo</span>
          </div>
          <div className="billing-summary-row billing-summary-total">
            <span>Total Monthly</span>
            <span>${fmtCAD(totalWithGST)} CAD/mo</span>
          </div>
        </div>

      </div>

      {/* Statement Descriptor Warning */}
      <div className="billing-statement-warning">
        <div className="billing-statement-warning-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="billing-statement-warning-body">
          <div className="billing-statement-warning-title">Credit Card &amp; Bank Statement Notice</div>
          <p>When your monthly subscription is charged, it may appear on your credit card or bank statement under one of the following names:</p>
          <div className="billing-statement-descriptors">
            <span className="billing-descriptor-pill">BELOW THE BOARD MKTING</span>
            <span className="billing-descriptor-pill">BTB MKTING</span>
            <span className="billing-descriptor-pill">12894891 Canada Inc.</span>
            <span className="billing-descriptor-pill">Cameron Gallacher</span>
          </div>
          <p className="billing-statement-warning-note">If you have any questions about a charge, please contact <a href="mailto:cam@latchedinc.com">cam@latchedinc.com</a> before initiating a dispute.</p>
        </div>
      </div>

      {/* Payment Form */}
      <div className="funnel-form-section">
        <div className="funnel-form-title">Payment Information</div>
        <div className="billing-card-icons">
          <img src="/visa.jpg" alt="Visa" className="billing-card-img" />
          <img src="/mastercard.png" alt="Mastercard" className="billing-card-img" />
          <img src="/amex.jpg" alt="American Express" className="billing-card-img" />
        </div>
        <div className="funnel-form-grid" style={{ marginTop: '20px' }}>
          <div className="funnel-field funnel-field--full">
            <label>Cardholder Name *</label>
            <input
              type="text"
              placeholder="Name as it appears on card"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>
          <div className="funnel-field funnel-field--full">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={cardholderEmail}
              onChange={(e) => setCardholderEmail(e.target.value)}
            />
          </div>
          <div className="funnel-field funnel-field--full">
            <label>Card Number *</label>
            <div className="stripe-element-wrap">
              <CardNumberElement
                options={{ style: STRIPE_ELEMENT_STYLE, showIcon: true }}
                onChange={(e) => setCardComplete((c) => ({ ...c, number: e.complete }))}
              />
            </div>
          </div>
          <div className="funnel-field">
            <label>Expiry Date *</label>
            <div className="stripe-element-wrap">
              <CardExpiryElement
                options={{ style: STRIPE_ELEMENT_STYLE }}
                onChange={(e) => setCardComplete((c) => ({ ...c, expiry: e.complete }))}
              />
            </div>
          </div>
          <div className="funnel-field">
            <label>CVV *</label>
            <div className="stripe-element-wrap">
              <CardCvcElement
                options={{ style: STRIPE_ELEMENT_STYLE }}
                onChange={(e) => setCardComplete((c) => ({ ...c, cvc: e.complete }))}
              />
            </div>
          </div>
        </div>
        <p className="billing-secure-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Your payment information is encrypted and processed securely by Stripe. We never store your card details.
        </p>
      </div>

      {/* Credit Card Authorization */}
      <div className="cc-auth-section">
        <div className="funnel-form-title">Credit Card Authorization</div>
        <div className="cc-auth-doc">
          <div className="cc-auth-doc-title display">Credit Card Authorization Form</div>
          <p className="cc-auth-body">
            I, <strong>{sigName || cardName || '___________________________'}</strong>, authorize{' '}
            <strong>Cameron Gallacher and his company 12894891 Canada Inc. dba Below the Board Marketing</strong> to charge my credit card on file for agreed upon recurring subscription purchases and/or advertising spend. I understand that my information will be securely saved through Stripe for future transactions on my account.
          </p>          <div className="cc-auth-fields">
            <div className="cc-auth-field-row">
              <span className="cc-auth-field-label">Cardholder Name:</span>
              <div className="cc-auth-field-input-wrap">
                <input
                  type="text"
                  className="cc-auth-field-input"
                  placeholder="Your full name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
       </div>
            <div className="cc-auth-field-row">
              <span className="cc-auth-field-label">Customer Signature:</span>
              <div className="cc-auth-field-input-wrap">
                <input
                  type="text"
                  className="cc-auth-field-input cc-auth-sig-input"
                  placeholder="Type your full name as signature"
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                />
              </div>
            </div>
            <div className="cc-auth-field-row">
              <span className="cc-auth-field-label">Date Signed:</span>
              <span className="cc-auth-field-value">
                {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <label className="funnel-agree-check cc-auth-check">
          <input
            type="checkbox"
            checked={authAgreed}
            onChange={(e) => setAuthAgreed(e.target.checked)}
          />
          <span>
            I authorize Cameron Gallacher and his company 12894891 Canada Inc. dba Below the Board Marketing to charge my credit card for the agreed upon recurring monthly subscription of <strong>${fmtCAD(totalWithGST)} CAD/mo</strong> (incl. GST). I understand charges may appear as <strong>BELOW THE BOARD MKTING</strong>, <strong>BTB MKTING</strong>, <strong>12894891 Canada Inc.</strong>, or <strong>Cameron Gallacher</strong> on my statement.
          </span>
        </label>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="billing-error-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div className="funnel-page-actions">
        <button className="btn-outline" onClick={handleBack} disabled={loading}>
          ← Back
        </button>
        <button
          className="btn-primary"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {loading ? 'Processing...' : <>Complete Enrollment <span className="arrow">→</span></>}
        </button>
      </div>
    </div>
  )
}

// ─── Main BillingPage wrapper ─────────────────────────────────────────
export default function BillingPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const search = useSearch()

  const proposal = loadProposal(slug)
  useBrandMeta({
    brand: proposal?.brand ?? 'cameron-gallacher',
    pageTitle: 'Billing & Payment',
  })

  const searchParams = new URLSearchParams(search)
  const pkgId = searchParams.get('pkg') || ''
  const addonId = searchParams.get('addon') || ''

  const [submitted, setSubmitted] = useState(false)

  if (!proposal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        <p>Proposal not found.</p>
      </div>
    )
  }

  const packages = (proposal.investment as any).packages || []
  const addons   = (proposal.investment as any).addons   || []

  const selectedPackage = packages.find((p: any) => p.id === pkgId) || null
  const selectedAddon   = addons.find((a: any) => a.id === addonId) || null

  const totalMonthly = (selectedPackage?.price || 0) + (selectedAddon?.price || 0)
  const totalGST = totalMonthly * 0.05
  const totalWithGST = totalMonthly * 1.05

  const steps = [
    { n: 1, label: 'Review' },
    { n: 2, label: 'Agreement' },
    { n: 3, label: 'Billing' },
    { n: 4, label: 'Book Call' },
    { n: 5, label: 'Onboarding' },
  ]

  // Success state is now handled by navigation to onboarding page
  // The submitted state is kept for fallback only
  if (submitted) {
    return (
      <div className="funnel-page">
        <div className="funnel-page-body funnel-success">
          <div className="funnel-success-icon">✓</div>
          <h2 className="funnel-page-title display">Billing Complete!</h2>
          <p className="funnel-page-subtitle">Redirecting to your onboarding booking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="funnel-page">
      {/* Progress Steps */}
      <div className="funnel-page-header">
        <div className="funnel-page-steps">
          {steps.map(({ n, label }) => (
            <div key={n} className={`funnel-page-step${n <= 3 ? ' active' : ''}${n === 3 ? ' current' : ''}`}>
              <div className="funnel-page-step-dot">{n <= 2 ? '✓' : n}</div>
              <div className="funnel-page-step-label">{label}</div>
              {n < 5 && <div className="funnel-page-step-line" />}
            </div>
          ))}
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <BillingForm
          proposal={proposal}
          slug={slug}
          pkgId={pkgId}
          addonId={addonId}
          selectedPackage={selectedPackage}
          selectedAddon={selectedAddon}
          totalMonthly={totalMonthly}
          totalGST={totalGST}
          totalWithGST={totalWithGST}
          onSuccess={() => setSubmitted(true)}
        />
      </Elements>

      {/* Footer */}
      <div className="funnel-page-footer">
        <span className="funnel-page-footer-logo display">CG.</span>
        <span className="funnel-page-footer-text">© {new Date().getFullYear()} Cameron Gallacher · All Rights Reserved</span>
      </div>
    </div>
  )
}
