import { useParams, useLocation, useSearch } from 'wouter'
import { useState } from 'react'
import { loadProposal } from '../data/loader'

export default function AgreementPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const search = useSearch()
  const [, navigate] = useLocation()

  const proposal = loadProposal(slug)

  const searchParams = new URLSearchParams(search)
  const pkgId = searchParams.get('pkg') || ''
  const addonId = searchParams.get('addon') || ''

  const [agreed, setAgreed] = useState(false)
  const [sigName, setSigName] = useState('')
  const [sigDate, setSigDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '' })
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
  const totalGST = (totalMonthly * 0.05).toFixed(2)
  const totalWithGST = (totalMonthly * 1.05).toFixed(2)

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const canProceed =
    agreed &&
    sigName.trim().length > 2 &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.includes('@')

  const handleBack = () => {
    navigate(`/proposal/${slug}/review?pkg=${pkgId}&addon=${addonId}`)
  }

  const handleSubmit = () => {
    navigate(`/proposal/${slug}/billing?pkg=${pkgId}&addon=${addonId}`)
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
              <div key={n} className={`funnel-page-step${n <= 2 ? ' active' : ''}${n === 2 ? ' current' : ''}`}>
                <div className="funnel-page-step-dot">{n <= 2 ? '✓' : n}</div>
                <div className="funnel-page-step-label">{label}</div>
                {n < 3 && <div className="funnel-page-step-line" />}
              </div>
            ))}
          </div>
        </div>
        <div className="funnel-page-body funnel-success">
          <div className="funnel-success-icon">✓</div>
          <h2 className="funnel-page-title display">Agreement Signed!</h2>
          <p className="funnel-page-subtitle">
            Your agreement has been signed. The next step is to book your onboarding call so we can get your campaign launched.
          </p>
          <div className="funnel-page-actions" style={{ justifyContent: 'center' }}>
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
            <div key={n} className={`funnel-page-step${n <= 2 ? ' active' : ''}${n === 2 ? ' current' : ''}`}>
              <div className="funnel-page-step-dot">{n === 1 ? '✓' : n}</div>
              <div className="funnel-page-step-label">{label}</div>
              {n < 3 && <div className="funnel-page-step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="funnel-page-body">
        <div className="funnel-page-eyebrow">Step 2 of 3</div>
        <h1 className="funnel-page-title display">Marketing Agreement</h1>
        <p className="funnel-page-subtitle">Please review the agreement below, fill in your details, and sign to proceed.</p>

        {/* Agreement Document */}
        <div className="agreement-doc">
          <div className="agreement-doc-header">
            <div className="agreement-doc-logo display">12894891 Canada Inc.</div>
            <div className="agreement-doc-title display">Digital Marketing Agreement</div>
            <div className="agreement-doc-meta">
              <div><strong>Effective Date:</strong> {today}</div>
              <div><strong>Service Provider:</strong> 12894891 Canada Inc. ("The Marketer") — 170-422 Richards Street, Vancouver BC</div>
              <div><strong>Client:</strong> {proposal.meta.preparedFor} ("The Company")</div>
            </div>
          </div>

          <div className="agreement-section">
            <h3>Article 1 — Scope of the Agreement</h3>
            <p>This Agreement sets forth the terms and conditions whereby the Marketer agrees to produce certain Campaigns for the Company. The Marketer will be engaged solely and exclusively by the Company for the limited purpose of providing marketing Campaigns.</p>
            <p>The parties shall be independent contractors. Nothing herein shall constitute a partnership, joint venture, agency, or employment relationship between the parties.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 2 — Description of Services &amp; Warranties</h3>
            <p>The Company engages the Marketer to provide the following digital marketing services:</p>
            <ul>
              {selectedPackage && (
                <li><strong>{selectedPackage.name} SEO Package</strong> — ${selectedPackage.price.toLocaleString()} CAD/mo + GST</li>
              )}
              {selectedAddon && (
                <li><strong>{selectedAddon.name}</strong> — ${selectedAddon.price.toLocaleString()} CAD/mo + GST</li>
              )}
            </ul>
            <p><strong>Total Monthly Investment: ${totalMonthly.toLocaleString()} CAD/mo + GST (${totalWithGST} CAD/mo incl. GST)</strong></p>
            <p>The Marketer represents and warrants that it has the knowledge, skills, and experience necessary for the services described. The Marketer does not guarantee specific results (including but not limited to rankings, traffic, or revenue increases), as such outcomes depend on factors outside of its control.</p>
            <p>During the Term and for two years following termination, the Company shall not solicit, induce, or attempt to hire any employees, contractors, or agents of the Marketer involved in this Agreement.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 3 — Intellectual Property</h3>
            <p>Subject to full payment of all amounts owing, the Marketer assigns to the Company all right, title, and interest to all intellectual property developed under this Agreement. In the event of non-payment, all intellectual property shall remain the sole and exclusive property of the Marketer.</p>
            <p>The Marketer may be engaged in other business activities that do not place it in direct conflict of interest with the primary business of the Company.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 4 — Fees, Schedule &amp; Expenses</h3>
            <p>The Company agrees to pay the Marketer the monthly fees outlined above. All fees are subject to the non-refundable provisions of Article 21. The Marketer reserves the right to terminate or suspend services in the event of non-payment.</p>
            <p>Any outstanding amounts not paid when due are subject to a late payment charge of 1% per day. All failed charge attempts are subject to a $100 NSF fee.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 5 — Additional Work</h3>
            <p>During the course of this Agreement, the Company may pursue additional service offerings. The parties shall either enter into a new contract or an addendum setting out the additional services and any additional fees.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 6 — Taxes</h3>
            <p>The Marketer and the Company shall each be solely responsible for all federal and provincial taxes applicable to them. GST (5%) is applied to all invoices.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 7 — Length of Term</h3>
            <p>This Agreement commences on the Effective Date and continues for an initial <strong>3-month commitment period</strong>, after which it automatically renews on a <strong>month-to-month</strong> basis. Billing begins only once your campaign is launched.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 8 — Non-Exclusivity</h3>
            <p>Nothing contained herein establishes an exclusive relationship between the parties. The Marketer shall be free to continue working for existing clients and taking on new clients, even where such clients are in the same industry as the Company.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 9 — Termination</h3>
            <p>Either party may terminate this Agreement with immediate effect upon written notice if the other party: (i) fails to pay fees when due; (ii) becomes involved in bankruptcy or insolvency proceedings; or (iii) ceases to be actively engaged in business.</p>
            <p>Following the initial 3-month term, either party may terminate without cause by providing at least <strong>30 days' prior written notice</strong>. All fees already paid are non-refundable. If termination occurs partway through a billing cycle, the full fee for that cycle remains payable.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 10 — Confidential or Proprietary Information</h3>
            <p>The Marketer acknowledges that it may receive confidential and/or proprietary information relating to the Company's business. The Marketer agrees to: (a) not disclose such information to third parties without prior written consent; (b) not copy or duplicate such information; (c) not use such information except as expressly authorized; and (d) inform the Company immediately of any unauthorized use or disclosure.</p>
            <p>The Company agrees not to disclose any information regarding the Marketer, including its business name, staff names, and other confidential information.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 11 — Portfolio Use</h3>
            <p>The Marketer shall be permitted to use all work product generated under this Agreement in perpetuity in its professional portfolio, after such work has been made public by the Company. The Company grants the Marketer an irrevocable, non-exclusive, royalty-free license to use such work product.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 12 — Indemnification</h3>
            <p>The Marketer and the Company shall each defend, indemnify, and hold the other harmless from and against all losses, damages, liabilities, and expenses arising out of or resulting from any fraudulent, negligent, or unlawful act or omission, or a breach of any obligation under this Agreement.</p>
            <p>Under no circumstances will the Marketer have any liability for consequential, exemplary, incidental, indirect, or special damages. In no event will the Marketer's total liability exceed the amounts paid by the Company in the lesser of: (i) the Term of this Agreement, or (ii) 12 months.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 13–18 — General Provisions</h3>
            <p><strong>Survival:</strong> Any provision imposing continuing obligations shall survive termination. <strong>Benefit:</strong> This Agreement is binding upon and inures to the benefit of each party and their respective heirs, representatives, successors, and assigns. <strong>Notices:</strong> All notices shall be in writing and delivered by email or certified mail. <strong>Force Majeure:</strong> The Marketer is not liable for failure to perform due to causes beyond its reasonable control, including acts of God, civil authorities, natural disasters, or pandemics. <strong>Entire Agreement:</strong> This Agreement embodies the entire agreement between the parties and may only be amended in writing by both parties.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 19 — Governing Law</h3>
            <p>This Agreement shall be interpreted and enforced in accordance with the laws of the Province of British Columbia and the federal laws of Canada applicable in that province. Each party irrevocably submits to the exclusive jurisdiction of the courts of the Province of British Columbia in the City of Vancouver.</p>
          </div>

          <div className="agreement-section">
            <h3>Article 20 — Refunds and Chargebacks</h3>
            <p><strong>No Refunds.</strong> All fees paid to the Marketer under this Agreement are strictly non-refundable under any circumstances, including early termination, dissatisfaction with services, or non-use of services.</p>
            <p><strong>Billing Cycles.</strong> All fees are due and payable in full for each billing cycle once such cycle has commenced. Fees will not be prorated or refunded if this Agreement is terminated partway through a billing cycle.</p>
            <p><strong>Chargebacks Prohibited.</strong> The Company agrees not to initiate or pursue any chargebacks, reversals, or disputes with its credit card issuer, bank, or payment processor for any payments made under this Agreement. Any attempt to do so shall constitute a material breach of this Agreement and the Company shall remain liable for the full amount of the disputed charge(s), plus all fees, penalties, and costs imposed on the Marketer as a result.</p>
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
                type="text"
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
            <span>I have read and agree to the Digital Marketing Services Agreement above.</span>
          </label>
        </div>

        {/* Actions */}
        <div className="funnel-page-actions">
          <button className="btn-outline" onClick={handleBack}>
            ← Back
          </button>
          <button
            className="btn-primary"
            disabled={!canProceed}
            onClick={handleSubmit}
          >
            Sign &amp; Proceed <span className="arrow">→</span>
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
