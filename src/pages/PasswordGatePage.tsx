import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { getAllSlugs, loadProposal } from '../data/loader'
import {
  isProposalAuthenticated,
  authenticateProposal,
  getAllAuthenticatedSlugs,
} from '../hooks/useProposalAuth'

export default function PasswordGatePage() {
  const [, navigate] = useLocation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // On mount: if user already has a valid auth cookie, auto-redirect
  useEffect(() => {
    const authenticated = getAllAuthenticatedSlugs()
    if (authenticated.length >= 1) {
      navigate(`/proposal/${authenticated[0]}`, { replace: true })
      return
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [navigate])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const slugs = getAllSlugs()
    let matched = false

    for (const slug of slugs) {
      const proposal = loadProposal(slug)
      if (!proposal?.password) continue
      if (authenticateProposal(slug, password, proposal.password)) {
        matched = true
        setTimeout(() => navigate(`/proposal/${slug}`, { replace: true }), 300)
        break
      }
    }

    if (!matched) {
      setLoading(false)
      setError('Incorrect password. Please check your email and try again.')
      setPassword('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <div className="password-gate-page">
      <div className="password-gate-card">
        <div className="password-gate-logo">CG.</div>
        <h1 className="password-gate-title">Access Your Proposal</h1>
        <p className="password-gate-subtitle">
          Enter the password from your proposal email to view your personalized strategy.
        </p>

        <form className="password-gate-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="password-gate-field">
            <label htmlFor="proposal-password" className="password-gate-label">
              Proposal Password
            </label>
            <input
              ref={inputRef}
              id="proposal-password"
              type="password"
              className={`password-gate-input${error ? ' error' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
            />
            {error && <p className="password-gate-error">{error}</p>}
          </div>

          <button
            type="submit"
            className="password-gate-btn"
            disabled={loading || !password.trim()}
          >
            {loading ? 'Authenticating...' : 'Access My Proposal →'}
          </button>
        </form>

        <p className="password-gate-help">
          Don't have a password?{' '}
          <a href="mailto:cam@latchedinc.com" className="password-gate-link">
            Contact us
          </a>
        </p>
      </div>

      <div className="password-gate-bg" aria-hidden="true" />
    </div>
  )
}
