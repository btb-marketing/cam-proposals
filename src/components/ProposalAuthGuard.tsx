/**
 * ProposalAuthGuard — wraps any proposal page to enforce password authentication.
 *
 * Behaviour:
 *  - If the user has a valid 30-day cookie for this slug → render children immediately.
 *  - If no cookie → show an inline password form specific to this proposal.
 *    The only password that works is the one stored in that proposal's JSON.
 *    On success → set 30-day cookie → render children.
 *  - Does NOT redirect to /proposal/ — the user stays on their direct URL.
 */
import { useEffect, useState, useRef } from 'react'
import { loadProposal } from '../data/loader'
import { isProposalAuthenticated, authenticateProposal } from '../hooks/useProposalAuth'

interface Props {
  slug: string
  children: React.ReactNode
}

export default function ProposalAuthGuard({ slug, children }: Props) {
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check cookie on mount
  useEffect(() => {
    if (slug && isProposalAuthenticated(slug)) {
      setAuthed(true)
    }
    setChecked(true)
  }, [slug])

  // Focus input when inline form appears
  useEffect(() => {
    if (checked && !authed) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [checked, authed])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const proposal = loadProposal(slug)
    if (!proposal?.password) {
      setError('This proposal is not accessible. Please contact us.')
      setLoading(false)
      return
    }

    if (authenticateProposal(slug, password.trim(), proposal.password)) {
      setAuthed(true)
    } else {
      setLoading(false)
      setError('Incorrect password. Please check your email and try again.')
      setPassword('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  // Still checking cookie
  if (!checked) return null

  // Authenticated — render the proposal
  if (authed) return <>{children}</>

  // Not authenticated — show inline password form
  const proposal = loadProposal(slug)
  const clientName = proposal?.meta?.preparedFor || 'your proposal'

  return (
    <div className="password-gate-page">
      <div className="password-gate-card">
        <div className="password-gate-logo">CG.</div>
        <h1 className="password-gate-title">Access Your Proposal</h1>
        <p className="password-gate-subtitle">
          Enter your password to view {clientName}'s personalized strategy.
        </p>

        <form className="password-gate-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="password-gate-field">
            <label htmlFor="guard-password" className="password-gate-label">
              Proposal Password
            </label>
            <input
              ref={inputRef}
              id="guard-password"
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
