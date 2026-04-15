import { useParams, useLocation, useSearch } from 'wouter'
import { loadProposal } from '../data/loader'

export default function PackageReviewPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const search = useSearch()
  const [, navigate] = useLocation()

  const proposal = loadProposal(slug)

  // Parse query params
  const searchParams = new URLSearchParams(search)
  const pkgId = searchParams.get('pkg') || ''
  const addonId = searchParams.get('addon') || ''

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

  const handleGoBack = () => {
    navigate(`/proposal/${slug}#section-investment`)
  }

  const handleProceed = () => {
    navigate(`/proposal/${slug}/agreement?pkg=${pkgId}&addon=${addonId}`)
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
            <div key={n} className={`funnel-page-step${n === 1 ? ' active current' : ''}`}>
              <div className="funnel-page-step-dot">{n}</div>
              <div className="funnel-page-step-label">{label}</div>
              {n < 3 && <div className="funnel-page-step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="funnel-page-body">
        <div className="funnel-page-eyebrow">Step 1 of 3</div>
        <h1 className="funnel-page-title display">Review Your Package</h1>
        <p className="funnel-page-subtitle">Confirm the services you've selected before proceeding to the agreement.</p>

        {/* Invoice Preview */}
        <div className="funnel-invoice">
          <div className="funnel-invoice-header">
            <div>
              <div className="funnel-invoice-title display">Invoice Preview</div>
              <div className="funnel-invoice-meta">Prepared for: <strong>{proposal.meta.preparedFor}</strong></div>
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

        {/* Actions */}
        <div className="funnel-page-actions">
          <button className="btn-outline" onClick={handleGoBack}>
            ← Go Back
          </button>
          <button
            className="btn-primary"
            disabled={!selectedPackage}
            onClick={handleProceed}
          >
            Proceed to Agreement <span className="arrow">→</span>
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
