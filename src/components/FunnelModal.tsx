import { useState } from 'react'

interface FunnelModalProps {
  selectedPackage: { id: string; name: string; price: number; currency: string; period: string; plusTax: boolean } | null
  selectedAddon: { id: string; name: string; price: number; currency: string; period: string; plusTax: boolean } | null
  totalMonthly: number
  clientName: string
  preparedBy: string
  onClose: () => void
}

export default function FunnelModal({
  selectedPackage,
  selectedAddon,
  totalMonthly,
  clientName,
  preparedBy,
  onClose,
}: FunnelModalProps) {
  const [step, setStep] = useState(1)
  const [agreed, setAgreed] = useState(false)
  const [sigName, setSigName] = useState('')
  const [sigDate, setSigDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '' })
  const [billingForm, setBillingForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' })
  const [submitted, setSubmitted] = useState(false)

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  const totalGST = (totalMonthly * 0.05).toFixed(2)
  const totalWithGST = (totalMonthly * 1.05).toFixed(2)

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const canProceedStep1 = !!selectedPackage

  const canProceedStep2 =
    agreed &&
    sigName.trim().length > 2 &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.includes('@')

  return (
    <div className="funnel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="funnel-modal">
        {/* Header */}
        <div className="funnel-header">
          <div className="funnel-steps">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`funnel-step-dot${step >= n ? ' active' : ''}${step === n ? ' current' : ''}`}>
                <span>{n}</span>
                <div className="funnel-step-label">
                  {n === 1 ? 'Review' : n === 2 ? 'Agreement' : 'Billing'}
                </div>
              </div>
            ))}
          </div>
          <button className="funnel-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── STEP 1: Package Review + Invoice Preview ── */}
        {step === 1 && (
          <div className="funnel-body">
            <div className="funnel-eyebrow">Step 1 of 3</div>
            <h2 className="funnel-title display">Review Your Package</h2>
            <p className="funnel-subtitle">Confirm the services you've selected before proceeding to the agreement.</p>

            <div className="funnel-invoice">
              <div className="funnel-invoice-header">
                <div>
                  <div className="funnel-invoice-title display">Invoice Preview</div>
                  <div className="funnel-invoice-meta">Prepared for: <strong>{clientName}</strong></div>
                  <div className="funnel-invoice-meta">Date: <strong>{today}</strong></div>
                </div>
                <div className="funnel-invoice-logo display">CG.</div>
              </div>

              <table className="funnel-invoice-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Type</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPackage && (
                    <tr>
                      <td>{selectedPackage.name} SEO Package</td>
                      <td>Monthly Retainer</td>
                      <td>${selectedPackage.price.toLocaleString()} {selectedPackage.currency}/mo</td>
                    </tr>
                  )}
                  {selectedAddon && (
                    <tr>
                      <td>{selectedAddon.name}</td>
                      <td>Monthly Add-On</td>
                      <td>${selectedAddon.price.toLocaleString()} {selectedAddon.currency}/mo</td>
                    </tr>
                  )}
                  <tr className="funnel-invoice-subtotal">
                    <td colSpan={2}>Subtotal</td>
                    <td>${totalMonthly.toLocaleString()} CAD/mo</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>GST (5%)</td>
                    <td>${totalGST} CAD/mo</td>
                  </tr>
                  <tr className="funnel-invoice-total">
                    <td colSpan={2}>Total Monthly</td>
                    <td>${totalWithGST} CAD/mo</td>
                  </tr>
                </tbody>
              </table>

              <div className="funnel-invoice-note">
                <strong>Commitment:</strong> Initial 3-month term, then month-to-month. Billing begins only once your campaign is launched.
              </div>
            </div>

            <div className="funnel-actions">
              <button className="btn-outline" onClick={onClose}>Go Back</button>
              <button
                className="btn-primary"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Proceed to Agreement <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Marketing Agreement + Signature ── */}
        {step === 2 && (
          <div className="funnel-body">
            <div className="funnel-eyebrow">Step 2 of 3</div>
            <h2 className="funnel-title display">Marketing Agreement</h2>
            <p className="funnel-subtitle">Please review the agreement below, fill in your details, and sign to proceed.</p>

            <div className="funnel-agreement">
              <div className="funnel-agreement-title display">Digital Marketing Services Agreement</div>
              <p className="funnel-agreement-date">Effective Date: {today}</p>

              <div className="funnel-agreement-parties">
                <div><strong>Service Provider:</strong> Cameron Gallacher ("Consultant")</div>
                <div><strong>Client:</strong> {clientName}</div>
              </div>

              <div className="funnel-agreement-section">
                <h4>1. Services</h4>
                <p>The Consultant agrees to provide the following digital marketing services as outlined in the proposal:</p>
                <ul>
                  {selectedPackage && <li><strong>{selectedPackage.name} SEO Package</strong> — ${selectedPackage.price.toLocaleString()} CAD/mo + GST</li>}
                  {selectedAddon && <li><strong>{selectedAddon.name}</strong> — ${selectedAddon.price.toLocaleString()} CAD/mo + GST</li>}
                </ul>
                <p>Total Monthly Investment: <strong>${totalMonthly.toLocaleString()} CAD/mo + GST (${totalWithGST} CAD/mo incl. GST)</strong></p>
              </div>

              <div className="funnel-agreement-section">
                <h4>2. Term & Commitment</h4>
                <p>This agreement begins with an initial <strong>3-month commitment</strong> period. Following the initial term, the agreement converts to a <strong>month-to-month</strong> arrangement, cancellable with 30 days written notice.</p>
              </div>

              <div className="funnel-agreement-section">
                <h4>3. Billing</h4>
                <p>The Client will be billed monthly. The first billing cycle begins on the campaign launch date. GST (5%) is applied to all invoices. All amounts are in Canadian Dollars (CAD).</p>
              </div>

              <div className="funnel-agreement-section">
                <h4>4. Deliverables & Reporting</h4>
                <p>The Consultant will deliver all services as described in the proposal scope of work. Monthly performance reports will be provided via Looker Studio. Strategy calls are included as per the selected package.</p>
              </div>

              <div className="funnel-agreement-section">
                <h4>5. Intellectual Property</h4>
                <p>All content, copy, and creative assets produced under this agreement become the property of the Client upon full payment. The Consultant retains the right to reference the engagement in a portfolio or case study context.</p>
              </div>

              <div className="funnel-agreement-section">
                <h4>6. Confidentiality</h4>
                <p>Both parties agree to keep all shared business information, strategies, and data confidential and will not disclose such information to third parties without prior written consent.</p>
              </div>

              <div className="funnel-agreement-section">
                <h4>7. Limitation of Liability</h4>
                <p>The Consultant's total liability shall not exceed the total fees paid in the preceding 30-day period. The Consultant does not guarantee specific search engine rankings or traffic outcomes, as these are influenced by external factors beyond the Consultant's control.</p>
              </div>

              <div className="funnel-agreement-section">
                <h4>8. Governing Law</h4>
                <p>This agreement is governed by the laws of the Province of British Columbia, Canada.</p>
              </div>
            </div>

            {/* Client Info Form */}
            <div className="funnel-form-section">
              <div className="funnel-form-title">Your Information</div>
              <div className="funnel-form-grid">
                <div className="funnel-field">
                  <label>First Name *</label>
                  <input name="firstName" value={form.firstName} onChange={handleFormChange} placeholder="Katie" />
                </div>
                <div className="funnel-field">
                  <label>Last Name *</label>
                  <input name="lastName" value={form.lastName} onChange={handleFormChange} placeholder="Beleznay" />
                </div>
                <div className="funnel-field funnel-field--full">
                  <label>Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="katie@example.com" />
                </div>
                <div className="funnel-field">
                  <label>Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleFormChange} placeholder="+1 (604) 000-0000" />
                </div>
                <div className="funnel-field">
                  <label>Business / Practice Name</label>
                  <input name="company" value={form.company} onChange={handleFormChange} placeholder="Dr. Katie Beleznay Dermatology" />
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="funnel-signature-section">
              <div className="funnel-form-title">Electronic Signature</div>
              <p className="funnel-sig-note">By typing your full name below and checking the box, you agree to the terms of this agreement and confirm you have the authority to enter into this contract.</p>
              <div className="funnel-form-grid">
                <div className="funnel-field funnel-field--full">
                  <label>Full Legal Name *</label>
                  <input
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    placeholder="Type your full name to sign"
                    className="funnel-sig-input"
                  />
                </div>
                <div className="funnel-field">
                  <label>Date</label>
                  <input type="date" value={sigDate} onChange={(e) => setSigDate(e.target.value)} />
                </div>
              </div>
              {sigName.trim().length > 2 && (
                <div className="funnel-sig-preview">
                  <span className="funnel-sig-text">{sigName}</span>
                  <span className="funnel-sig-date">{sigDate}</span>
                </div>
              )}
              <label className="funnel-agree-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>I have read and agree to the Marketing Services Agreement above.</span>
              </label>
            </div>

            <div className="funnel-actions">
              <button className="btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn-primary"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
              >
                Proceed to Billing <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Billing + Onboarding ── */}
        {step === 3 && !submitted && (
          <div className="funnel-body">
            <div className="funnel-eyebrow">Step 3 of 3</div>
            <h2 className="funnel-title display">Billing & Onboarding</h2>
            <p className="funnel-subtitle">Add your payment details below. <strong>You will not be charged until your campaign is launched.</strong></p>

            <div className="funnel-billing-note">
              <span className="funnel-billing-icon">🔒</span>
              <span>Your payment information is encrypted and secure. Billing begins only after your onboarding call and campaign launch.</span>
            </div>

            <div className="funnel-form-section">
              <div className="funnel-form-title">Payment Details</div>
              <div className="funnel-form-grid">
                <div className="funnel-field funnel-field--full">
                  <label>Name on Card *</label>
                  <input name="cardName" value={billingForm.cardName} onChange={handleBillingChange} placeholder="Katie Beleznay" />
                </div>
                <div className="funnel-field funnel-field--full">
                  <label>Card Number *</label>
                  <input
                    name="cardNumber"
                    value={billingForm.cardNumber}
                    onChange={handleBillingChange}
                    placeholder="•••• •••• •••• ••••"
                    maxLength={19}
                  />
                </div>
                <div className="funnel-field">
                  <label>Expiry Date *</label>
                  <input name="expiry" value={billingForm.expiry} onChange={handleBillingChange} placeholder="MM / YY" maxLength={7} />
                </div>
                <div className="funnel-field">
                  <label>CVV *</label>
                  <input name="cvv" value={billingForm.cvv} onChange={handleBillingChange} placeholder="•••" maxLength={4} type="password" />
                </div>
              </div>
            </div>

            <div className="funnel-summary-box">
              <div className="funnel-summary-title">Order Summary</div>
              {selectedPackage && (
                <div className="funnel-summary-row">
                  <span>{selectedPackage.name} SEO Package</span>
                  <span>${selectedPackage.price.toLocaleString()} CAD/mo</span>
                </div>
              )}
              {selectedAddon && (
                <div className="funnel-summary-row">
                  <span>{selectedAddon.name}</span>
                  <span>${selectedAddon.price.toLocaleString()} CAD/mo</span>
                </div>
              )}
              <div className="funnel-summary-row funnel-summary-row--tax">
                <span>GST (5%)</span>
                <span>${totalGST} CAD/mo</span>
              </div>
              <div className="funnel-summary-row funnel-summary-row--total">
                <span>Total Monthly</span>
                <span>${totalWithGST} CAD/mo</span>
              </div>
              <div className="funnel-summary-launch-note">
                First charge on campaign launch date only
              </div>
            </div>

            <div className="funnel-actions">
              <button className="btn-outline" onClick={() => setStep(2)}>← Back</button>
              <button
                className="btn-primary"
                disabled={!billingForm.cardName || !billingForm.cardNumber || !billingForm.expiry || !billingForm.cvv}
                onClick={() => setSubmitted(true)}
              >
                Confirm & Book Onboarding <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {submitted && (
          <div className="funnel-body funnel-success">
            <div className="funnel-success-icon">✓</div>
            <h2 className="funnel-title display">You're In!</h2>
            <p className="funnel-subtitle">Your agreement has been signed and your billing details are saved. The next step is to book your onboarding call so we can get your campaign launched.</p>
            <div className="funnel-actions" style={{ justifyContent: 'center' }}>
              <a
                href="https://calendly.com/cam-belowtheboard/onboarding"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Book Onboarding Call <span className="arrow">→</span>
              </a>
            </div>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              A confirmation email will be sent to <strong>{form.email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
