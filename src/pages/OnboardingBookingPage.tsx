import { useParams, useLocation, useSearch } from 'wouter'
import { useEffect } from 'react'
import { loadProposal } from '../data/loader'

// Calendly links by brand
const CALENDLY_LINKS: Record<string, string> = {
  'cameron-gallacher': 'https://calendly.com/belowtheboard/onboarding-cg',
  'below-the-board':   'https://calendly.com/belowtheboard/onboarding',
}

export default function OnboardingBookingPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const search = useSearch()
  const [, navigate] = useLocation()

  const proposal = loadProposal(slug)

  const searchParams = new URLSearchParams(search)
  const pkgId = searchParams.get('pkg') || ''
  const addonId = searchParams.get('addon') || ''
  const email = searchParams.get('email') || ''

  const brand = (proposal?.meta as any)?.brand || 'cameron-gallacher'
  const calendlyUrl = CALENDLY_LINKS[brand] || CALENDLY_LINKS['cameron-gallacher']

  const goToStep5 = () => {
    navigate(`/proposal/${slug}/onboarding-form?pkg=${pkgId}&addon=${addonId}&email=${encodeURIComponent(email)}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Embed Calendly widget script + listen for booking completion
  useEffect(() => {
    // Load the Calendly embed script if not already loaded
    const existing = document.getElementById('calendly-script')
    if (!existing) {
      const script = document.createElement('script')
      script.id = 'calendly-script'
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      document.head.appendChild(script)
    }

    // Listen for the Calendly "event_scheduled" message
    // Calendly fires a postMessage when the booking is confirmed
    const handleCalendlyEvent = (e: MessageEvent) => {
      if (
        e.origin === 'https://calendly.com' &&
        e.data?.event === 'calendly.event_scheduled'
      ) {
        // Small delay so user sees the confirmation screen briefly
        setTimeout(() => {
          goToStep5()
        }, 2500)
      }
    }

    window.addEventListener('message', handleCalendlyEvent)
    return () => window.removeEventListener('message', handleCalendlyEvent)
  }, [slug, pkgId, addonId, email])

  if (!proposal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        <p>Proposal not found.</p>
      </div>
    )
  }

  const steps = [
    { n: 1, label: 'Review' },
    { n: 2, label: 'Agreement' },
    { n: 3, label: 'Billing' },
    { n: 4, label: 'Book Call' },
    { n: 5, label: 'Onboarding' },
  ]

  return (
    <div className="funnel-page">
      {/* Progress Steps */}
      <div className="funnel-page-header">
        <div className="funnel-page-steps">
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`funnel-page-step${n <= 4 ? ' active' : ''}${n === 4 ? ' current' : ''}`}
            >
              <div className="funnel-page-step-dot">{n <= 3 ? '✓' : n}</div>
              <div className="funnel-page-step-label">{label}</div>
              {n < 5 && <div className="funnel-page-step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="funnel-page-body onboarding-booking-body">
        <div className="funnel-page-eyebrow">Step 4 of 5</div>
        <h1 className="funnel-page-title display">Book Your Onboarding Call</h1>
        <p className="funnel-page-subtitle">
          Your agreement is signed and your billing details are saved. The next step is to book your onboarding call so we can get your campaign launched.
        </p>

        {/* Calendly Inline Embed
            primary_color=0d0d0d — dark charcoal so buttons are readable on Calendly's white bg
            text_color=0d0d0d — dark text
            background_color=ffffff — keep Calendly's default white bg (matches their design)
        */}
        <div
          className="calendly-inline-widget"
          data-url={`${calendlyUrl}?hide_gdpr_banner=1&primary_color=0d0d0d&text_color=0d0d0d&background_color=ffffff${email ? `&email=${encodeURIComponent(email)}` : ''}`}
          style={{ minWidth: '320px', height: '700px' }}
        />

        {/* Skip option */}
        <div className="onboarding-booking-skip">
          <p>Can't book right now? You'll receive a link to schedule your call via email.</p>
          <button className="btn-outline" onClick={goToStep5}>
            Skip for Now — Fill Out Onboarding Form <span className="arrow">→</span>
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
