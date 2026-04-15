/**
 * useProposalAuth — cookie-based password authentication for proposals.
 * Sets a 30-day cookie on successful authentication.
 */

const COOKIE_DAYS = 30

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function getAuthCookieName(slug: string): string {
  return `proposal_auth_${slug.replace(/-/g, '_')}`
}

export function isProposalAuthenticated(slug: string): boolean {
  return getCookie(getAuthCookieName(slug)) === 'authenticated'
}

export function authenticateProposal(slug: string, inputPassword: string, correctPassword: string): boolean {
  if (inputPassword.trim().toLowerCase() === correctPassword.trim().toLowerCase()) {
    setCookie(getAuthCookieName(slug), 'authenticated', COOKIE_DAYS)
    return true
  }
  return false
}

export function clearProposalAuth(slug: string) {
  document.cookie = `${getAuthCookieName(slug)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

export function getAllAuthenticatedSlugs(): string[] {
  return document.cookie
    .split('; ')
    .filter(c => c.startsWith('proposal_auth_') && c.includes('=authenticated'))
    .map(c => c.split('=')[0].replace('proposal_auth_', '').replace(/_/g, '-'))
}
