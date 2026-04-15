/**
 * ProposalAuthGuard — wraps any proposal page to enforce password authentication.
 * Redirects to /proposal/ if the user doesn't have a valid auth cookie for this slug.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { isProposalAuthenticated } from '../hooks/useProposalAuth'

interface Props {
  slug: string
  children: React.ReactNode
}

export default function ProposalAuthGuard({ slug, children }: Props) {
  const [, navigate] = useLocation()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!slug || !isProposalAuthenticated(slug)) {
      navigate('/proposal/', { replace: true })
    } else {
      setChecked(true)
    }
  }, [slug, navigate])

  if (!checked) return null

  return <>{children}</>
}
