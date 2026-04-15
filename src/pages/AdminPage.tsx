import { useState, useEffect, useRef } from 'react'
import { getAllSlugs, loadProposal } from '../data/loader'
import { isProposalAuthenticated, clearProposalAuth } from '../hooks/useProposalAuth'
import { useBrandMeta } from '../hooks/useBrandMeta'

const ADMIN_PASSWORD = '@GymZQFbofDaci4uEfiR'

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  })
}

// ─── New Proposal Form ────────────────────────────────────────────────────────

interface ProposalFormData {
  clientName: string
  clientEmail: string
  clientWebsite: string
  brand: 'cameron-gallacher' | 'below-the-board'
  industry: string
  location: string
  services: string
  notes: string
  recommendedPkg: 'kickstarter' | 'elevate' | 'amplify'
  password: string
  logoFile: File | null
  logoPreview: string | null
}

function NewProposalForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<ProposalFormData>({
    clientName: '',
    clientEmail: '',
    clientWebsite: '',
    brand: 'cameron-gallacher',
    industry: '',
    location: '',
    services: 'SEO, Content Marketing',
    notes: '',
    recommendedPkg: 'elevate',
    password: '',
    logoFile: null,
    logoPreview: null,
  })
  const [status, setStatus] = useState<'idle' | 'uploading-logo' | 'generating' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ slug: string; password: string; approveUrl: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set(key: keyof ProposalFormData, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    set('logoFile', file)
    const reader = new FileReader()
    reader.onload = ev => set('logoPreview', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('generating')
    setErrorMsg('')

    try {
      let logoUrl: string | undefined

      // Upload logo if provided
      if (form.logoFile) {
        setStatus('uploading-logo')
        const base64: string = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = ev => {
            const result = ev.target?.result as string
            resolve(result.split(',')[1])
          }
          reader.onerror = reject
          reader.readAsDataURL(form.logoFile!)
        })

        const uploadRes = await fetch('/api/upload-logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            filename: `${form.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-logo.${form.logoFile.name.split('.').pop()}`,
            content: base64,
            mimeType: form.logoFile.type,
          }),
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Logo upload failed')
        logoUrl = uploadData.url
        setStatus('generating')
      }

      // Generate proposal
      const genRes = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientWebsite: form.clientWebsite,
          brand: form.brand,
          industry: form.industry,
          location: form.location,
          services: form.services,
          notes: form.notes,
          recommendedPkg: form.recommendedPkg,
          password: form.password || undefined,
          logoUrl,
        }),
      })

      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.error || 'Proposal generation failed')

      setResult({
        slug: genData.slug,
        password: genData.password,
        approveUrl: genData.approveUrl,
      })
      setStatus('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  if (status === 'success' && result) {
    return (
      <div className="new-proposal-form">
        <div className="npf-success">
          <div className="npf-success-icon">✓</div>
          <h3>Proposal Draft Created!</h3>
          <p>A review email has been sent to <strong>richard@belowtheboard.com</strong>. Click Approve in that email to deploy the proposal, or use the button below.</p>
          <div className="npf-result-grid">
            <div className="npf-result-row">
              <span className="npf-result-label">Proposal URL</span>
              <code className="npf-result-value">/proposal/{result.slug}/</code>
            </div>
            <div className="npf-result-row">
              <span className="npf-result-label">Client Password</span>
              <code className="npf-result-value npf-password">{result.password}</code>
            </div>
          </div>
          <div className="npf-result-actions">
            <a href={result.approveUrl} target="_blank" rel="noopener noreferrer" className="npf-approve-btn">
              ✓ Approve &amp; Deploy Now ↗
            </a>
            <button className="npf-close-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  const isLoading = status === 'uploading-logo' || status === 'generating'

  return (
    <div className="new-proposal-form">
      <div className="npf-header">
        <h3>New Proposal</h3>
        <button className="npf-close-x" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="npf-form">
        <div className="npf-section-title">Client Information</div>

        <div className="npf-row">
          <div className="npf-field">
            <label>Client Name *</label>
            <input
              type="text"
              value={form.clientName}
              onChange={e => set('clientName', e.target.value)}
              placeholder="e.g. John Smith"
              required
            />
          </div>
          <div className="npf-field">
            <label>Client Email *</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={e => set('clientEmail', e.target.value)}
              placeholder="e.g. client@company.com"
              required
            />
          </div>
        </div>

        <div className="npf-row">
          <div className="npf-field">
            <label>Client Website</label>
            <input
              type="url"
              value={form.clientWebsite}
              onChange={e => set('clientWebsite', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="npf-field">
            <label>Industry</label>
            <input
              type="text"
              value={form.industry}
              onChange={e => set('industry', e.target.value)}
              placeholder="e.g. Law Firm, Dental, E-Commerce"
            />
          </div>
        </div>

        <div className="npf-row">
          <div className="npf-field">
            <label>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Toronto, ON"
            />
          </div>
          <div className="npf-field">
            <label>Services Requested</label>
            <input
              type="text"
              value={form.services}
              onChange={e => set('services', e.target.value)}
              placeholder="e.g. SEO, Content Marketing, Paid Media"
            />
          </div>
        </div>

        <div className="npf-section-title">Client Logo</div>
        <div
          className="npf-logo-upload"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {form.logoPreview ? (
            <img src={form.logoPreview} alt="Logo preview" className="npf-logo-preview" />
          ) : (
            <div className="npf-logo-placeholder">
              <span className="npf-logo-icon">↑</span>
              <span>Click to upload client logo (PNG, SVG, WebP)</span>
              <span className="npf-logo-hint">Transparent background recommended</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/jpeg"
            onChange={handleLogoChange}
            style={{ display: 'none' }}
          />
        </div>
        {form.logoPreview && (
          <button
            type="button"
            className="npf-remove-logo"
            onClick={() => { set('logoFile', null); set('logoPreview', null) }}
          >
            Remove logo
          </button>
        )}

        <div className="npf-section-title">Proposal Settings</div>

        <div className="npf-row">
          <div className="npf-field">
            <label>Brand</label>
            <select value={form.brand} onChange={e => set('brand', e.target.value as 'cameron-gallacher' | 'below-the-board')}>
              <option value="cameron-gallacher">Cameron Gallacher Consulting</option>
              <option value="below-the-board">Below the Board Marketing</option>
            </select>
          </div>
          <div className="npf-field">
            <label>Recommended Package</label>
            <select
              value={form.recommendedPkg}
              onChange={e => set('recommendedPkg', e.target.value as 'kickstarter' | 'elevate' | 'amplify')}
            >
              <option value="kickstarter">Kickstarter — $3,000/mo</option>
              <option value="elevate">Elevate — $5,000/mo</option>
              <option value="amplify">Amplify — $8,000/mo</option>
            </select>
          </div>
        </div>

        <div className="npf-row">
          <div className="npf-field npf-field-full">
            <label>Custom Password <span className="npf-optional">(leave blank to auto-generate)</span></label>
            <input
              type="text"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="e.g. smith2026"
            />
          </div>
        </div>

        <div className="npf-section-title">Research Notes</div>
        <div className="npf-row">
          <div className="npf-field npf-field-full">
            <label>Notes for AI <span className="npf-optional">(specific pain points, goals, context from discovery call)</span></label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. They mentioned struggling with local SEO, have tried Google Ads before with poor results, main goal is to increase consultation bookings by 30% in 6 months..."
              rows={5}
            />
          </div>
        </div>

        {status === 'error' && (
          <div className="npf-error-msg">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        <div className="npf-actions">
          <button type="button" className="npf-cancel-btn" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="npf-submit-btn" disabled={isLoading || !form.clientName || !form.clientEmail}>
            {status === 'uploading-logo' ? 'Uploading logo...' : status === 'generating' ? 'Generating proposal...' : 'Generate Proposal →'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Sister proposal type ─────────────────────────────────────────────────────

interface SisterProposal {
  slug: string
  clientName: string
  clientEmail: string
  brand: string
  password: string
  package: string
  date: string
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  useBrandMeta({ brand: 'cameron-gallacher', pageTitle: 'Admin Panel' })
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)
  const [showNewProposal, setShowNewProposal] = useState(false)
  const [sisterProposals, setSisterProposals] = useState<SisterProposal[]>([])
  const [sisterLoading, setSisterLoading] = useState(false)
  const [sisterError, setSisterError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    setSisterLoading(true)
    fetch('/api/list-sister-proposals', {
      headers: { 'x-admin-key': ADMIN_PASSWORD },
    })
      .then(r => r.json())
      .then(data => {
        if (data.proposals) setSisterProposals(data.proposals)
        if (data.error) setSisterError(data.error)
      })
      .catch(e => setSisterError(e.message))
      .finally(() => setSisterLoading(false))
  }, [authed])

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', 'true')
      setAuthed(true)
    } else {
      setPwError('Incorrect admin password.')
      setPw('')
    }
  }

  function handleCopy(text: string, key: string) {
    copyToClipboard(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!authed) {
    return (
      <div className="password-gate-page">
        <div className="password-gate-card">
          <div className="password-gate-logo" style={{ letterSpacing: '0.05em', fontSize: '1.2rem' }}>
            ADMIN
          </div>
          <h1 className="password-gate-title">Admin Access</h1>
          <p className="password-gate-subtitle">Enter the admin password to continue.</p>
          <form className="password-gate-form" onSubmit={handleAdminLogin}>
            <div className="password-gate-field">
              <label htmlFor="admin-pw" className="password-gate-label">
                Admin Password
              </label>
              <input
                id="admin-pw"
                type="password"
                className={`password-gate-input${pwError ? ' error' : ''}`}
                placeholder="Admin password"
                value={pw}
                onChange={e => { setPw(e.target.value); setPwError('') }}
                autoFocus
              />
              {pwError && <p className="password-gate-error">{pwError}</p>}
            </div>
            <button type="submit" className="password-gate-btn" disabled={!pw.trim()}>
              Access Admin Panel →
            </button>
          </form>
        </div>
        <div className="password-gate-bg" aria-hidden="true" />
      </div>
    )
  }

  const slugs = getAllSlugs()
  const origin = window.location.origin
  // Sister project origin — BTB proposals live on view.belowtheboard.com
  const sisterOrigin = 'https://view.belowtheboard.com'

  // Render a proposal card for local proposals
  function renderLocalCard(slug: string) {
    const proposal = loadProposal(slug)
    if (!proposal) return null
    const brand = proposal.brand ?? 'cameron-gallacher'
    const password = proposal.password ?? '(no password set)'
    const isAuth = isProposalAuthenticated(slug)
    const proposalUrl = `${origin}/proposal/${slug}`
    const gateUrl = `${origin}/proposal/`

    return (
      <div key={slug} className={`admin-proposal-card ${brand === 'below-the-board' ? 'card-btb' : 'card-cg'}`}>
        <div className={`admin-brand-badge ${brand === 'below-the-board' ? 'btb' : 'cg'}`}>
          {brand === 'below-the-board' ? 'Below the Board' : 'Cameron Gallacher'}
        </div>

        <h2 className="admin-proposal-client">{proposal.meta.preparedFor}</h2>
        <p className="admin-proposal-slug">/{slug}</p>
        <p className="admin-proposal-date">Prepared: {proposal.meta.date}</p>

        <div className="admin-password-row">
          <span className="admin-password-label">Password</span>
          <code className="admin-password-value">{password}</code>
          <button
            className="admin-copy-btn"
            onClick={() => handleCopy(password, `pw-${slug}`)}
          >
            {copied === `pw-${slug}` ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="admin-auth-status">
          <span className={`admin-auth-dot ${isAuth ? 'active' : 'inactive'}`} />
          <span>{isAuth ? 'Authenticated in this browser' : 'Not authenticated'}</span>
          {isAuth && (
            <button
              className="admin-revoke-btn"
              onClick={() => { clearProposalAuth(slug); forceUpdate(n => n + 1) }}
            >
              Revoke
            </button>
          )}
        </div>

        <div className="admin-links">
          <a
            href={proposalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-link-btn primary"
          >
            View Proposal ↗
          </a>
          <button
            className="admin-link-btn secondary"
            onClick={() =>
              handleCopy(
                `Your proposal is ready!\n\nAccess it here: ${gateUrl}\nPassword: ${password}`,
                `share-${slug}`
              )
            }
          >
            {copied === `share-${slug}` ? '✓ Copied!' : 'Copy Share Text'}
          </button>
        </div>

        <div className="admin-funnel-links">
          <span className="admin-funnel-label">Test Funnel Steps:</span>
          <div className="admin-funnel-steps">
            {[
              { label: '1 Review', path: `review?pkg=kickstarter&addon=` },
              { label: '2 Agreement', path: `agreement?pkg=kickstarter&addon=` },
              { label: '3 Billing', path: `billing?pkg=kickstarter&addon=` },
              { label: '4 Book Call', path: `onboarding?pkg=kickstarter&addon=&email=test@test.com` },
              { label: '5 Form', path: `onboarding-form?pkg=kickstarter&addon=&email=test@test.com` },
              {
                label: '6 Thank You',
                path: `thank-you?pkg=kickstarter&addon=&name=${encodeURIComponent(proposal.meta.preparedFor)}&email=test@test.com`,
              },
            ].map(step => (
              <a
                key={step.label}
                href={`${origin}/proposal/${slug}/${step.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-funnel-step-link"
              >
                {step.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render a card for sister project proposals (read-only, links to sister domain)
  function renderSisterCard(p: SisterProposal) {
    const proposalUrl = `${sisterOrigin}/proposal/${p.slug}`
    const gateUrl = `${sisterOrigin}/proposal/`

    return (
      <div key={`sister-${p.slug}`} className="admin-proposal-card card-btb card-sister">
        <div className="admin-brand-badge btb">Below the Board</div>
        <div className="admin-sister-tag">BTB Project</div>

        <h2 className="admin-proposal-client">{p.clientName}</h2>
        <p className="admin-proposal-slug">/{p.slug}</p>
        <p className="admin-proposal-date">Prepared: {p.date}</p>

        <div className="admin-password-row">
          <span className="admin-password-label">Password</span>
          <code className="admin-password-value">{p.password || '(not set)'}</code>
          <button
            className="admin-copy-btn"
            onClick={() => handleCopy(p.password, `pw-sister-${p.slug}`)}
          >
            {copied === `pw-sister-${p.slug}` ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="admin-links">
          <a
            href={proposalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-link-btn primary"
          >
            View Proposal ↗
          </a>
          <button
            className="admin-link-btn secondary"
            onClick={() =>
              handleCopy(
                `Your proposal is ready!\n\nAccess it here: ${gateUrl}\nPassword: ${p.password}`,
                `share-sister-${p.slug}`
              )
            }
          >
            {copied === `share-sister-${p.slug}` ? '✓ Copied!' : 'Copy Share Text'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-logo">Proposals Admin</div>
        <div className="admin-header-actions">
          <button
            className="admin-new-proposal-btn"
            onClick={() => setShowNewProposal(true)}
          >
            + New Proposal
          </button>
          <button
            className="admin-logout-btn"
            onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false) }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* New Proposal Modal */}
      {showNewProposal && (
        <div
          className="npf-overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowNewProposal(false) }}
        >
          <NewProposalForm onClose={() => setShowNewProposal(false)} />
        </div>
      )}

      <div className="admin-content">
        <h1 className="admin-title">Proposal Management</h1>
        <p className="admin-subtitle">
          All proposals from both Cameron Gallacher Consulting and Below the Board Marketing.
        </p>

        {/* Legend */}
        <div className="admin-legend">
          <span className="admin-legend-item">
            <span className="admin-legend-dot cg" />
            Cameron Gallacher Consulting
          </span>
          <span className="admin-legend-item">
            <span className="admin-legend-dot btb" />
            Below the Board Marketing
          </span>
        </div>

        <div className="admin-proposals-grid">
          {/* Local proposals */}
          {slugs.map(slug => renderLocalCard(slug))}

          {/* Sister project proposals */}
          {sisterLoading && (
            <div className="admin-sister-loading">Loading BTB proposals...</div>
          )}
          {sisterError && (
            <div className="admin-sister-error">
              Could not load BTB proposals: {sisterError}
            </div>
          )}
          {!sisterLoading && sisterProposals.map(p => renderSisterCard(p))}
        </div>

        <div className="admin-quick-ref">
          <h3 className="admin-section-title">Quick Reference</h3>
          <div className="admin-ref-grid">
            <div className="admin-ref-card">
              <h4>CG Password Gate</h4>
              <code>{origin}/proposal/</code>
              <button
                className="admin-copy-btn"
                onClick={() => handleCopy(`${origin}/proposal/`, 'gate-url-cg')}
              >
                {copied === 'gate-url-cg' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="admin-ref-card">
              <h4>BTB Password Gate</h4>
              <code>{sisterOrigin}/proposal/</code>
              <button
                className="admin-copy-btn"
                onClick={() => handleCopy(`${sisterOrigin}/proposal/`, 'gate-url-btb')}
              >
                {copied === 'gate-url-btb' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="admin-ref-card">
              <h4>Stripe Dashboard</h4>
              <a href="https://dashboard.stripe.com/customers" target="_blank" rel="noopener noreferrer" className="admin-external-link">
                View Customers ↗
              </a>
              <a href="https://dashboard.stripe.com/subscriptions" target="_blank" rel="noopener noreferrer" className="admin-external-link">
                View Subscriptions ↗
              </a>
            </div>
            <div className="admin-ref-card">
              <h4>Calendly</h4>
              <a href="https://calendly.com/event_types/user/me" target="_blank" rel="noopener noreferrer" className="admin-external-link">
                Event Types ↗
              </a>
              <a href="https://calendly.com/scheduled_events" target="_blank" rel="noopener noreferrer" className="admin-external-link">
                Scheduled Events ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
