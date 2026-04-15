import { useParams, useLocation, useSearch } from 'wouter'
import { useState } from 'react'
import { loadProposal } from '../data/loader'

export default function BillingPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const search = useSearch()
  const [, navigate] = useLocation()

  const proposal = loadProposal(slug)

  const searchParams = new URLSearchParams(search)
  const pkgId = searchParams.get('pkg') || ''
  const addonId = searchParams.get('addon') || ''

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
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
  const totalWithGST = (totalMonthly * 1.05).toFixed(2)

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  const canSubmit = cardName.trim().length > 2 && cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3

  const handleBack = () => {
    navigate(`/proposal/${slug}/agreement?pkg=${pkgId}&addon=${addonId}`)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div className="funnel-page">
        <div className="funnel-page-header">
          <div className="funnel-page-steps">
            {[
              { n: 1, label: 'Review' },
              { n: 2, label: 'Agreement' },
              { n: 3, label: 'Billing' },
            ].map(({ n, label }) => (
              <div key={n} className={`funnel-page-step active${n === 3 ? ' current' : ''}`}>
                <div className="funnel-page-step-dot">✓</div>
                <div className="funnel-page-step-label">{label}</div>
                {n < 3 && <div className="funnel-page-step-line" />}
              </div>
            ))}
          </div>
        </div>
        <div className="funnel-page-body funnel-success">
          <div className="funnel-success-icon">✓</div>
          <h2 className="funnel-page-title display">You're All Set!</h2>
          <p className="funnel-page-subtitle">
            Your billing details have been received. Cameron will be in touch within 24 hours to confirm your campaign start date and kick off onboarding.
          </p>
          <div className="funnel-page-actions" style={{ justifyContent: 'center' }}>
            <a
              href="https://calendly.com/cam-latchedinc/onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Book Onboarding Call <span className="arrow">→</span>
            </a>
          </div>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            A confirmation email will be sent to you shortly.
          </p>
        </div>
        <div className="funnel-page-footer">
          <span className="funnel-page-footer-logo display">CG.</span>
          <span className="funnel-page-footer-text">© {new Date().getFullYear()} Cameron Gallacher · All Rights Reserved</span>
        </div>
      </div>
    )
  }

  return (
    <div className="funnel-page">
      {/* Progress Steps */}
      <div className="funnel-page-header">
        <div className="funnel-page-steps">
          {[
            { n: 1, label: 'Review' },
            { n: 2, label: 'Agreement' },
            { n: 3, label: 'Billing' },
          ].map(({ n, label }) => (
            <div key={n} className={`funnel-page-step${n <= 3 ? ' active' : ''}${n === 3 ? ' current' : ''}`}>
              <div className="funnel-page-step-dot">{n <= 2 ? '✓' : n}</div>
              <div className="funnel-page-step-label">{label}</div>
              {n < 3 && <div className="funnel-page-step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="funnel-page-body">
        <div className="funnel-page-eyebrow">Step 3 of 3</div>
        <h1 className="funnel-page-title display">Billing Details</h1>
        <p className="funnel-page-subtitle">Enter your payment information to complete your enrollment. Your first charge begins on your campaign launch date.</p>

        {/* Order Summary */}
        <div className="billing-summary">
          <div className="billing-summary-title display">Order Summary</div>
          <div className="billing-summary-rows">
            {selectedPackage && (
              <div className="billing-summary-row">
                <span>{selectedPackage.name} SEO Package</span>
                <span>${selectedPackage.price.toLocaleString()} CAD/mo</span>
              </div>
            )}
            {selectedAddon && (
              <div className="billing-summary-row">
                <span>{selectedAddon.name}</span>
                <span>${selectedAddon.price.toLocaleString()} CAD/mo</span>
              </div>
            )}
            <div className="billing-summary-row billing-summary-gst">
              <span>GST (5%)</span>
              <span>${(totalMonthly * 0.05).toFixed(2)} CAD/mo</span>
            </div>
            <div className="billing-summary-row billing-summary-total">
              <span>Total Monthly</span>
              <span>${totalWithGST} CAD/mo</span>
            </div>
          </div>
          <div className="billing-summary-note">
            <strong>Billing begins only once your campaign is launched.</strong> No charge today.
          </div>
        </div>

        {/* Payment Form */}
        <div className="funnel-form-section">
          <div className="funnel-form-title">Payment Information</div>
          <div className="billing-card-icons">
            <span className="billing-card-icon">VISA</span>
            <span className="billing-card-icon">MC</span>
            <span className="billing-card-icon">AMEX</span>
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
              <label>Card Number *</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            <div className="funnel-field">
              <label>Expiry Date *</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
              />
            </div>
            <div className="funnel-field">
              <label>CVV *</label>
              <input
                type="text"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </div>
          </div>
          <p className="billing-secure-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Your payment information is encrypted and secure. We use industry-standard SSL encryption.
          </p>
        </div>

        {/* Actions */}
        <div className="funnel-page-actions">
          <button className="btn-outline" onClick={handleBack}>
            ← Back
          </button>
          <button
            className="btn-primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Complete Enrollment <span className="arrow">→</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="funnel-page-footer">
        <span className="funnel-page-footer-logo display">CG.</span>
        <span className="funnel-page-footer-text">© {new Date().getFullYear()} Cameron Gallacher · All Rights Reserved</span>
      </div>
    </div>
  )
}
