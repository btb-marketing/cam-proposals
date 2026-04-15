import { useState, useEffect } from 'react'
import { getAllSlugs, loadProposal } from '../data/loader'
import { isProposalAuthenticated, clearProposalAuth } from '../hooks/useProposalAuth'
import { useBrandMeta } from '../hooks/useBrandMeta'

const ADMIN_PASSWORD = 'btb-admin-2026'

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

export default function AdminPage() {
  useBrandMeta({ brand: 'cameron-gallacher', pageTitle: 'Admin Panel' })
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true)
  }, [])

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

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-logo">CG. Admin</div>
        <button
          className="admin-logout-btn"
          onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false) }}
        >
          Log Out
        </button>
      </div>

      <div className="admin-content">
        <h1 className="admin-title">Proposal Management</h1>
        <p className="admin-subtitle">
          Manage all active proposals, passwords, and client access below.
        </p>

        <div className="admin-proposals-grid">
          {slugs.map(slug => {
            const proposal = loadProposal(slug)
            if (!proposal) return null
            const brand = proposal.brand ?? 'cameron-gallacher'
            const password = proposal.password ?? '(no password set)'
            const isAuth = isProposalAuthenticated(slug)
            const proposalUrl = `${origin}/proposal/${slug}`
            const gateUrl = `${origin}/proposal/`

            return (
              <div key={slug} className="admin-proposal-card">
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
          })}
        </div>

        <div className="admin-quick-ref">
          <h3 className="admin-section-title">Quick Reference</h3>
          <div className="admin-ref-grid">
            <div className="admin-ref-card">
              <h4>Password Gate URL</h4>
              <code>{origin}/proposal/</code>
              <button
                className="admin-copy-btn"
                onClick={() => handleCopy(`${origin}/proposal/`, 'gate-url')}
              >
                {copied === 'gate-url' ? '✓ Copied' : 'Copy'}
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
