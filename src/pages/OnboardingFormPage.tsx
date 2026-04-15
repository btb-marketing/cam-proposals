import { useParams, useLocation, useSearch } from 'wouter'
import { useState } from 'react'
import { loadProposal } from '../data/loader'
import { useBrandMeta } from '../hooks/useBrandMeta'

// Determine agency name based on brand
function getAgencyName(brand: string): string {
  return brand === 'below-the-board' ? 'Below the Board Marketing' : 'Cameron Gallacher'
}

// Determine analytics email based on brand
function getAnalyticsEmail(brand: string): string {
  return 'cam@belowtheboard.com'
}

interface FormState {
  // Contact info
  clientEmail: string
  additionalEmails: string
  // Communication
  teamContacts: string
  reportingSchedule: string
  // Website access
  domainNames: string
  domainRegistrar: string
  websitePlatform: string
  websiteLogin: string
  hostingProvider: string
  googleAnalytics: string
  googleSearchConsole: string
  googleMyBusiness: string
  sitePlannedChanges: string
  // Strategy
  targetCategories: string
  targetProducts: string
  existingResources: string
  targetKeywords: string
  targetAudience: string
  competitors: string
  prHistory: string
  algorithmUpdates: string
  // Email marketing (if applicable)
  emailSoftware: string
  emailSoftwareAccess: string
  successGoals: string
  avoidItems: string
  couponDiscount: string
  focusProducts: string
  // Marketing assets
  marketingAssets: string
  // Additional
  anythingElse: string
}

const INITIAL_FORM: FormState = {
  clientEmail: '',
  additionalEmails: '',
  teamContacts: '',
  reportingSchedule: '',
  domainNames: '',
  domainRegistrar: '',
  websitePlatform: '',
  websiteLogin: '',
  hostingProvider: '',
  googleAnalytics: '',
  googleSearchConsole: '',
  googleMyBusiness: '',
  sitePlannedChanges: '',
  targetCategories: '',
  targetProducts: '',
  existingResources: '',
  targetKeywords: '',
  targetAudience: '',
  competitors: '',
  prHistory: '',
  algorithmUpdates: '',
  emailSoftware: '',
  emailSoftwareAccess: '',
  successGoals: '',
  avoidItems: '',
  couponDiscount: '',
  focusProducts: '',
  marketingAssets: '',
  anythingElse: '',
}

export default function OnboardingFormPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const search = useSearch()
  const [, navigate] = useLocation()

  const proposal = loadProposal(slug)
  useBrandMeta({
    brand: proposal?.brand ?? 'cameron-gallacher',
    pageTitle: 'Onboarding Form',
  })

  const searchParams = new URLSearchParams(search)
  const pkgId = searchParams.get('pkg') || ''
  const addonId = searchParams.get('addon') || ''
  const emailParam = searchParams.get('email') || ''

  const brand = (proposal?.meta as any)?.brand || 'cameron-gallacher'
  const agencyName = getAgencyName(brand)
  const analyticsEmail = getAnalyticsEmail(brand)

  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM, clientEmail: emailParam })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [currentSection, setCurrentSection] = useState(0)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.clientEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setErrorMsg('')
    try {
      // Send form data to the email API
      const response = await fetch('/api/send-onboarding-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug,
          pkgId,
          addonId,
          clientName: proposal.meta.preparedFor,
          agencyName,
          analyticsEmail,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to submit form')
      // Navigate to thank-you page
      navigate(`/proposal/${slug}/thank-you?pkg=${pkgId}&addon=${addonId}&name=${encodeURIComponent(proposal.meta.preparedFor)}&email=${encodeURIComponent(form.clientEmail)}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'Confirm your email and add any additional contacts who should receive updates.',
    },
    {
      id: 'communication',
      title: 'Communication Preferences',
      description: 'Help us set up your team in our reporting and communication tools.',
    },
    {
      id: 'access',
      title: 'Account Access',
      description: 'Provide access to your website and marketing tools so we can get started.',
    },
    {
      id: 'strategy',
      title: 'SEO Strategy',
      description: 'Help us understand your goals, competitors, and target audience.',
    },
    {
      id: 'assets',
      title: 'Marketing Assets & Additional Info',
      description: 'Share any existing assets and anything else we should know.',
    },
  ]

  if (submitted) {
    return (
      <div className="funnel-page">
        <div className="funnel-page-header">
          <div className="funnel-page-steps">
            {steps.map(({ n, label }) => (
              <div key={n} className="funnel-page-step active">
                <div className="funnel-page-step-dot">✓</div>
                <div className="funnel-page-step-label">{label}</div>
                {n < 5 && <div className="funnel-page-step-line" />}
              </div>
            ))}
          </div>
        </div>
        <div className="funnel-page-body funnel-success">
          <div className="funnel-success-icon">✓</div>
          <h2 className="funnel-page-title display">Onboarding Complete!</h2>
          <p className="funnel-page-subtitle">
            Thank you, {proposal.meta.preparedFor.split(' ')[0]}! Your onboarding form has been submitted. Our team will review your information and reach out within 24 hours to confirm your campaign launch date.
          </p>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            A copy of your responses has been sent to <strong>{form.clientEmail}</strong>
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
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`funnel-page-step${n <= 5 ? ' active' : ''}${n === 5 ? ' current' : ''}`}
            >
              <div className="funnel-page-step-dot">{n <= 4 ? '✓' : n}</div>
              <div className="funnel-page-step-label">{label}</div>
              {n < 5 && <div className="funnel-page-step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="funnel-page-body onboarding-form-body">
        <div className="funnel-page-eyebrow">Step 5 of 5</div>
        <h1 className="funnel-page-title display">Onboarding Form</h1>
        <p className="funnel-page-subtitle">
          Complete this form so our team can prepare for your onboarding call and get your campaign launched. You can also fill this out later — a link has been sent to your email.
        </p>

        {/* Section Navigation */}
        <div className="onboarding-section-nav">
          {sections.map((s, i) => (
            <button
              key={s.id}
              className={`onboarding-section-nav-btn${currentSection === i ? ' active' : ''}${i < currentSection ? ' done' : ''}`}
              onClick={() => setCurrentSection(i)}
            >
              {i < currentSection ? '✓ ' : `${i + 1}. `}{s.title}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="onboarding-form-section">
          <div className="onboarding-form-section-header">
            <h2 className="onboarding-form-section-title display">{sections[currentSection].title}</h2>
            <p className="onboarding-form-section-desc">{sections[currentSection].description}</p>
          </div>

          {/* Section 0: Contact Information */}
          {currentSection === 0 && (
            <div className="onboarding-form-fields">
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Your Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  className="onboarding-form-input"
                  placeholder="your@email.com"
                  value={form.clientEmail}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Additional Email Addresses
                  <span className="onboarding-form-hint">Optional — add any other email addresses that should receive the form or campaign updates (comma-separated)</span>
                </label>
                <input
                  type="text"
                  name="additionalEmails"
                  className="onboarding-form-input"
                  placeholder="colleague@email.com, manager@email.com"
                  value={form.additionalEmails}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Section 1: Communication Preferences */}
          {currentSection === 1 && (
            <div className="onboarding-form-fields">
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Team Contacts
                  <span className="onboarding-form-hint">
                    Please provide a list of names and email addresses for all relevant points of contact from your team. We will use these to invite your team to our Slack channel and bi-weekly reporting calls.
                  </span>
                </label>
                <textarea
                  name="teamContacts"
                  className="onboarding-form-textarea"
                  placeholder="Name — email@example.com&#10;Name — email@example.com"
                  rows={5}
                  value={form.teamContacts}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Preferred Reporting Call Schedule
                  <span className="onboarding-form-hint">
                    As part of the campaign, we provide bi-weekly reporting calls. Please let us know a day and time of week that works best for a recurring calendar invite.
                  </span>
                </label>
                <input
                  type="text"
                  name="reportingSchedule"
                  className="onboarding-form-input"
                  placeholder="e.g. Tuesdays at 10am PST"
                  value={form.reportingSchedule}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Section 2: Account Access */}
          {currentSection === 2 && (
            <div className="onboarding-form-fields">
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Domain Name(s) <span className="required">*</span>
                  <span className="onboarding-form-hint">Please enter your domain name(s) for the website(s) we will be working on.</span>
                </label>
                <input
                  type="text"
                  name="domainNames"
                  className="onboarding-form-input"
                  placeholder="e.g. yourdomain.com"
                  value={form.domainNames}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Domain Registrar
                  <span className="onboarding-form-hint">Where is your domain name currently held? Common examples: GoDaddy, Namecheap, Google Domains. If unsure, visit <a href="https://lookup.icann.org" target="_blank" rel="noopener noreferrer">lookup.icann.org</a> and enter your domain.</span>
                </label>
                <input
                  type="text"
                  name="domainRegistrar"
                  className="onboarding-form-input"
                  placeholder="e.g. GoDaddy"
                  value={form.domainRegistrar}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Website Platform
                  <span className="onboarding-form-hint">What platform is your website built on? Examples: WordPress, Shopify, Wix. If unsure, visit <a href="https://whatcms.org" target="_blank" rel="noopener noreferrer">whatcms.org</a> and enter your URL.</span>
                </label>
                <input
                  type="text"
                  name="websitePlatform"
                  className="onboarding-form-input"
                  placeholder="e.g. WordPress"
                  value={form.websitePlatform}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Website Backend Access
                  <span className="onboarding-form-hint">Please invite <strong>{analyticsEmail}</strong> as an admin to your website backend, or provide login credentials below.</span>
                </label>
                <textarea
                  name="websiteLogin"
                  className="onboarding-form-textarea"
                  placeholder="URL: https://yourdomain.com/wp-admin&#10;Username: &#10;Password: &#10;Or: I've invited the analytics email as admin"
                  rows={4}
                  value={form.websiteLogin}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Hosting Provider
                  <span className="onboarding-form-hint">What hosting provider are you using? Examples: Siteground, DigitalOcean, WPEngine, Cloudways. If using Shopify, Squarespace, Wix, or Webflow, enter that instead.</span>
                </label>
                <input
                  type="text"
                  name="hostingProvider"
                  className="onboarding-form-input"
                  placeholder="e.g. Siteground"
                  value={form.hostingProvider}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Google Analytics
                  <span className="onboarding-form-hint">Google Analytics is a free tool that measures your website traffic. If you have an account, please invite <strong>{analyticsEmail}</strong> with full admin permissions.</span>
                </label>
                <div className="onboarding-form-radio-group">
                  {[
                    `I have access and I've invited ${analyticsEmail} with full permissions`,
                    'I have Google Analytics but I lost access',
                    "I'm not sure if I have Google Analytics",
                    "I don't have Google Analytics yet",
                  ].map((opt) => (
                    <label key={opt} className="onboarding-form-radio">
                      <input
                        type="radio"
                        name="googleAnalytics"
                        value={opt}
                        checked={form.googleAnalytics === opt}
                        onChange={handleChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Google Search Console
                  <span className="onboarding-form-hint">Google Search Console measures your SEO traffic from Google. If you have an account, please invite <strong>{analyticsEmail}</strong> with full admin permissions.</span>
                </label>
                <div className="onboarding-form-radio-group">
                  {[
                    `I have access and I've invited ${analyticsEmail} with full permissions`,
                    'I have Google Search Console but I lost access',
                    "I'm not sure if I have Google Search Console",
                    "I don't have Google Search Console yet",
                  ].map((opt) => (
                    <label key={opt} className="onboarding-form-radio">
                      <input
                        type="radio"
                        name="googleSearchConsole"
                        value={opt}
                        checked={form.googleSearchConsole === opt}
                        onChange={handleChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Google My Business
                  <span className="onboarding-form-hint">Google My Business lists your business on Google Maps and gets Google Reviews. If you have a profile, please invite <strong>{analyticsEmail}</strong> with full admin permissions.</span>
                </label>
                <div className="onboarding-form-radio-group">
                  {[
                    `I have access and I've invited ${analyticsEmail} with full permissions`,
                    'I have a Google My Business Profile but I lost access',
                    "I don't have a Google My Business Profile yet",
                    "I'm not sure if I have a Google My Business Profile",
                  ].map((opt) => (
                    <label key={opt} className="onboarding-form-radio">
                      <input
                        type="radio"
                        name="googleMyBusiness"
                        value={opt}
                        checked={form.googleMyBusiness === opt}
                        onChange={handleChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Planned Site Changes
                  <span className="onboarding-form-hint">Do you have any big site changes planned within the next 12 months? (e.g. a content migration, site merger, or platform switch)</span>
                </label>
                <textarea
                  name="sitePlannedChanges"
                  className="onboarding-form-textarea"
                  placeholder="Describe any planned changes, or write 'None'"
                  rows={3}
                  value={form.sitePlannedChanges}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Section 3: SEO Strategy */}
          {currentSection === 3 && (
            <div className="onboarding-form-fields">
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Target Product/Service Categories
                  <span className="onboarding-form-hint">Please list your top product or service categories that you want to target and improve in search rankings.</span>
                </label>
                <textarea
                  name="targetCategories"
                  className="onboarding-form-textarea"
                  placeholder="e.g. Botox, Fillers, Laser Treatments"
                  rows={4}
                  value={form.targetCategories}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Target Keywords
                  <span className="onboarding-form-hint">What keywords would you like to rank for on Google? Please list in order of priority and be as specific as possible.</span>
                </label>
                <textarea
                  name="targetKeywords"
                  className="onboarding-form-textarea"
                  placeholder="e.g. botox Vancouver, lip filler Vancouver, dermatologist Vancouver"
                  rows={5}
                  value={form.targetKeywords}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Target Audience / Buyer Personas
                  <span className="onboarding-form-hint">Who is your ideal customer? Have you identified different buyer personas? Describe your target audience in detail.</span>
                </label>
                <textarea
                  name="targetAudience"
                  className="onboarding-form-textarea"
                  placeholder="e.g. Women 30-55 in Vancouver looking for cosmetic dermatology treatments..."
                  rows={4}
                  value={form.targetAudience}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Top Competitors <span className="required">*</span>
                  <span className="onboarding-form-hint">Who are your top direct competitors? Please list their website URLs if possible.</span>
                </label>
                <textarea
                  name="competitors"
                  className="onboarding-form-textarea"
                  placeholder="e.g. Competitor A — competitor-a.com&#10;Competitor B — competitor-b.com"
                  rows={4}
                  value={form.competitors}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Existing SEO Resources
                  <span className="onboarding-form-hint">Do you have any documents, research, audits, reports, or other resources relating to previous or existing SEO efforts? (e.g. keyword research, site performance reports, backlink profiles)</span>
                </label>
                <textarea
                  name="existingResources"
                  className="onboarding-form-textarea"
                  placeholder="Paste a Google Drive link, or describe what you have"
                  rows={3}
                  value={form.existingResources}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  PR History
                  <span className="onboarding-form-hint">Are you currently or have you previously done any PR (digital or otherwise) for your brand? If so, please provide details and results achieved.</span>
                </label>
                <textarea
                  name="prHistory"
                  className="onboarding-form-textarea"
                  placeholder="Describe any PR activities, or write 'None'"
                  rows={3}
                  value={form.prHistory}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Google Algorithm Updates
                  <span className="onboarding-form-hint">Are you aware of your site ever having been negatively affected by any Google SEO core algorithm updates?</span>
                </label>
                <div className="onboarding-form-radio-group">
                  {[
                    'Yes — my site was negatively impacted',
                    'No — not that I am aware of',
                    "I'm not sure",
                  ].map((opt) => (
                    <label key={opt} className="onboarding-form-radio">
                      <input
                        type="radio"
                        name="algorithmUpdates"
                        value={opt}
                        checked={form.algorithmUpdates === opt}
                        onChange={handleChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Success Goals
                  <span className="onboarding-form-hint">What does success look like for you? Please provide your specific goals for this project.</span>
                </label>
                <textarea
                  name="successGoals"
                  className="onboarding-form-textarea"
                  placeholder="e.g. Rank #1 for 'botox Vancouver', increase consultation bookings by 30%..."
                  rows={4}
                  value={form.successGoals}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Items to Avoid / Legal Requirements
                  <span className="onboarding-form-hint">Is there anything our team should avoid during the project? Any specific legal requirements we should be made aware of? (e.g. regulatory restrictions on advertising certain treatments)</span>
                </label>
                <textarea
                  name="avoidItems"
                  className="onboarding-form-textarea"
                  placeholder="Describe any restrictions or legal requirements, or write 'None'"
                  rows={3}
                  value={form.avoidItems}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Section 4: Marketing Assets & Additional Info */}
          {currentSection === 4 && (
            <div className="onboarding-form-fields">
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Marketing Assets
                  <span className="onboarding-form-hint">Please provide access to any/all marketing assets (logos, images, brand guidelines, etc.) that we can use. Invite <strong>{analyticsEmail}</strong> to your shared drive, or paste a link below (Google Drive, Dropbox, etc.).</span>
                </label>
                <textarea
                  name="marketingAssets"
                  className="onboarding-form-textarea"
                  placeholder="Paste a shared drive link, or describe what you have"
                  rows={3}
                  value={form.marketingAssets}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Specific Products/Services to Focus On
                  <span className="onboarding-form-hint">Are there any specific products or services you want to prioritize in the campaign?</span>
                </label>
                <textarea
                  name="focusProducts"
                  className="onboarding-form-textarea"
                  placeholder="e.g. Botox, Sculptra, Laser Resurfacing"
                  rows={3}
                  value={form.focusProducts}
                  onChange={handleChange}
                />
              </div>
              <div className="onboarding-form-field">
                <label className="onboarding-form-label">
                  Anything Else We Should Know?
                  <span className="onboarding-form-hint">Is there anything else you'd like our team to know before we get started?</span>
                </label>
                <textarea
                  name="anythingElse"
                  className="onboarding-form-textarea"
                  placeholder="Any additional context, notes, or questions..."
                  rows={4}
                  value={form.anythingElse}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="billing-error-msg" style={{ marginTop: '16px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {errorMsg}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="funnel-page-actions" style={{ marginTop: '32px' }}>
          {currentSection > 0 && (
            <button
              className="btn-outline"
              onClick={() => setCurrentSection((s) => s - 1)}
              disabled={loading}
            >
              ← Previous
            </button>
          )}
          {currentSection < sections.length - 1 ? (
            <button
              className="btn-primary"
              onClick={() => {
                setCurrentSection((s) => s + 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              Next <span className="arrow">→</span>
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || !form.clientEmail.includes('@')}
            >
              {loading ? 'Submitting...' : <>Submit Onboarding Form <span className="arrow">→</span></>}
            </button>
          )}
        </div>

        {/* Section progress indicator */}
        <div className="onboarding-form-progress">
          Section {currentSection + 1} of {sections.length}
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
