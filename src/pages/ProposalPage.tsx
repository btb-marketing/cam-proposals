import { useParams } from 'wouter'
import { useState, useEffect } from 'react'
import { loadProposal } from '../data/loader'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Proposal } from '../types/proposal'
import NotFound from './NotFound'
import ProgressBar from '../components/ProgressBar'
import Sidebar from '../components/Sidebar'
import FunnelModal from '../components/FunnelModal'

const TOC_SECTIONS = [
  { id: 'section-overview',  label: 'Project Overview',     number: '01' },
  { id: 'section-keywords',  label: 'Keyword Areas',        number: '02' },
  { id: 'section-scope',     label: 'Scope of Work',        number: '03' },
  { id: 'section-deliverables', label: 'Deliverables',      number: '04' },
  { id: 'section-metrics',   label: 'Success Metrics',      number: '05' },
  { id: 'section-investment',label: 'Investment',           number: '06' },
  { id: 'section-casestudies',label: 'Case Studies',        number: '07' },
  { id: 'section-nextsteps', label: 'Next Steps',           number: '08' },
]

export default function ProposalPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const proposal = loadProposal(slug)

  // Keep legacy selectedAddons for any fallback usage
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [funnelOpen, setFunnelOpen] = useState(false)

  useScrollReveal()

  useEffect(() => {
    if (proposal) {
      document.title = `${proposal.hero.clientName} — Cameron Gallacher Proposal`
    }
  }, [proposal])

  if (!proposal) return <NotFound />

  const { meta, hero, about, team, overview, keywordAreas, scopeOfWork, deliverables, successMetrics, investment, caseStudies, nextSteps } = proposal

  // ── Investment helpers ──────────────────────────────────────
  const packages = (investment as any).packages || []
  const addons   = (investment as any).addons   || []
  const hasPricingCards = packages.length > 0
  const sectionTitle   = (investment as any).sectionTitle   || 'Pricing'
  const sectionSubtitle = (investment as any).sectionSubtitle || ''
  const packagesLabel  = (investment as any).packagesLabel  || 'SEO Packages'
  const addonsLabel    = (investment as any).addonsLabel    || 'Optional SEO Add-Ons — click to select'

  // Radio-select for packages (only one at a time)
  const defaultPkg = packages.find((p: any) => p.defaultSelected)?.id || packages[0]?.id || null
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(defaultPkg)

  // Radio-select for add-ons (only one at a time, none by default)
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null)

  const toggleAddon = (id: string) => {
    setSelectedAddonId(prev => prev === id ? null : id)
  }

  const selectPackage = (id: string) => {
    setSelectedPackageId(id)
  }

  const totalMonthly = (() => {
    if (!hasPricingCards) return null
    const selectedPkg = packages.find((p: any) => p.id === selectedPackageId)
    const base = selectedPkg ? selectedPkg.price : 0
    const extra = selectedAddonId
      ? (addons.find((a: any) => a.id === selectedAddonId)?.price || 0)
      : 0
    return base + extra
  })()

  const selectedPackageObj = packages.find((p: any) => p.id === selectedPackageId) || null
  const selectedAddonObj   = addons.find((a: any) => a.id === selectedAddonId) || null

  // ── H1 line renderer ────────────────────────────────────────
  const renderHeroTitle = (tagline: string) => {
    const lines = tagline.split('\n')
    return lines.map((line, i) => {
      if (i === lines.length - 1) {
        return (
          <span key={i} className="hero-title-gradient-line">{line}</span>
        )
      }
      return <span key={i} style={{ display: 'block' }}>{line}</span>
    })
  }

  // Filter TOC to only sections that exist in this proposal
  const activeSections = TOC_SECTIONS.filter(s => {
    if (s.id === 'section-keywords') return !!keywordAreas
    if (s.id === 'section-scope') return !!scopeOfWork
    if (s.id === 'section-deliverables') return deliverables && deliverables.length > 0
    if (s.id === 'section-metrics') return successMetrics && successMetrics.length > 0
    if (s.id === 'section-casestudies') return caseStudies && caseStudies.length > 0
    return true
  })

  return (
    <div className="page-layout">
      {/* ── Sticky Progress Bar ── */}
      <ProgressBar />

      {/* ── Sidebar ── */}
      <Sidebar sections={activeSections} />

      {/* ── Main Content ── */}
      <main className="page-main">

        {/* ── HERO ── */}
        <section className="hero" id="section-hero">
          <div className="hero-grid" />
          <div className="hero-inner">
            <div className="hero-meta">
              <div className="hero-meta-item">
                <span className="hero-meta-label">Prepared by</span>
                <span className="hero-meta-value">{meta.preparedBy}</span>
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-label">Prepared for</span>
                <span className="hero-meta-value">{meta.preparedFor}</span>
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-label">Date</span>
                <span className="hero-meta-value">{meta.date}</span>
              </div>
            </div>

            <div className="hero-client-tag">{hero.clientName}</div>

            <h1 className="hero-title display">
              {renderHeroTitle(hero.tagline)}
            </h1>

            <p className="hero-subtitle">{hero.subTagline}</p>

            <div className="hero-ctas">
              <button
                className="btn-primary"
                onClick={() => {
                  const el = document.getElementById('section-overview')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Start Proposal <span className="arrow">→</span>
              </button>
              <button
                className="btn-outline"
                onClick={() => {
                  const el = document.getElementById('section-investment')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Build My Package
              </button>
            </div>
          </div>

          <div className="hero-scroll">
            <div className="hero-scroll-line" />
            <span>SCROLL</span>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section className="about-section">
          <div className="container">
            <div className="about-grid">
              <div className="reveal">
                <h2 className="about-heading display">{about.heading || 'About Us'}</h2>
                <p className="about-description">{about.description}</p>
              </div>
              <div className="reveal">
                {about.notableClients && about.notableClients.length > 0 && (
                  <>
                    <div className="clients-label">Notable Clients</div>
                    <div className="clients-list">
                      {about.notableClients.map((c) => (
                        <span key={c} className="client-tag">{c}</span>
                      ))}
                    </div>
                  </>
                )}

                {team && team.length > 0 && (
                  <div style={{ marginTop: about.notableClients && about.notableClients.length > 0 ? '40px' : '0' }}>
                    <div className="clients-label">Who You'll Be Working With</div>
                    <div className="team-grid" style={{ marginTop: '20px' }}>
                      {team.map((member) => (
                        <div key={member.name} className="team-card">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.name}
                              className="team-photo"
                            />
                          ) : (
                            <div className="team-initials">{member.initials}</div>
                          )}
                          <div className="team-name">{member.name}</div>
                          <div className="team-title">{member.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── OVERVIEW ── */}
        <section className="overview-section" id="section-overview">
          <div className="container">
            <div className="section-header reveal">
              <div className="eyebrow">01 — Project Overview</div>
              <div className="section-title-wrap">
                <div className="section-number">01</div>
                <h2 className="section-title display">{overview.headline}</h2>
              </div>
              <p style={{ marginTop: '20px', fontSize: '16px', color: 'var(--text-muted)', maxWidth: '640px', lineHeight: '1.7' }}>
                {overview.subheadline}
              </p>
            </div>

            <div className="reveal">
              <div className="eyebrow" style={{ marginBottom: '24px' }}>Objectives</div>
              <div className="objectives-grid">
                {overview.objectives.map((obj, i) => (
                  <div key={i} className="objective-item">
                    <span className="objective-check">✓</span>
                    <span className="objective-text">{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal" style={{ marginTop: '64px' }}>
              <div className="eyebrow" style={{ marginBottom: '24px' }}>Strategy</div>
              <div className="strategy-grid">
                {overview.strategy.map((s, i) => (
                  <div key={i} className="strategy-card">
                    <div className="strategy-number">{String(i + 1).padStart(2, '0')}</div>
                    <div className="strategy-title">{s.title}</div>
                    <p className="strategy-desc">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── KEYWORD AREAS ── */}
        {keywordAreas && (
          <section className="keywords-section" id="section-keywords">
            <div className="container">
              <div className="section-header reveal">
                <div className="eyebrow">02 — Priority Keyword Areas</div>
                <div className="section-title-wrap">
                  <div className="section-number">02</div>
                  <h2 className="section-title display">Target Keywords</h2>
                </div>
                <p className="keywords-intro">{keywordAreas.intro}</p>
              </div>
              <div className="keywords-grid reveal">
                {keywordAreas.keywords.map((kw) => (
                  <span key={kw} className="keyword-pill">{kw}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SCOPE OF WORK ── */}
        {scopeOfWork && (
          <section className="scope-section" id="section-scope">
            <div className="container">
              <div className="section-header reveal">
                <div className="eyebrow">03 — Scope of Work</div>
                <div className="section-title-wrap">
                  <div className="section-number">03</div>
                  <h2 className="section-title display">Month by Month</h2>
                </div>
              </div>
              <div className="scope-timeline">
                {scopeOfWork.months.map((month, i) => (
                  <div key={i} className="scope-month reveal">
                    <div className="scope-month-dot">{String(i + 1).padStart(2, '0')}</div>
                    <div className="scope-month-content">
                      <div className="scope-month-title">{month.title}</div>
                      <ul className="scope-deliverables">
                        {month.deliverables.map((d, j) => (
                          <li key={j}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── DELIVERABLES ── */}
        {deliverables && deliverables.length > 0 && (
          <section className="deliverables-section" id="section-deliverables">
            <div className="container">
              <div className="section-header reveal">
                <div className="eyebrow">04 — Deliverables</div>
                <div className="section-title-wrap">
                  <div className="section-number">04</div>
                  <h2 className="section-title display">What You Get</h2>
                </div>
              </div>
              <div className="deliverables-grid reveal">
                {deliverables.map((d, i) => (
                  <div key={i} className="deliverable-item">
                    <span className="deliverable-icon">◆</span>
                    <span className="deliverable-text">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SUCCESS METRICS ── */}
        {successMetrics && successMetrics.length > 0 && (
          <section id="section-metrics">
            <div className="container">
              <div className="section-header reveal">
                <div className="eyebrow">05 — Success Metrics</div>
                <div className="section-title-wrap">
                  <div className="section-number">05</div>
                  <h2 className="section-title display">How We Measure Wins</h2>
                </div>
              </div>
              <div className="metrics-grid reveal">
                {successMetrics.map((m, i) => (
                  <div key={i} className="metric-card">
                    <p className="metric-text">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── INVESTMENT ── */}
        <section className="investment-section" id="section-investment">
          <div className="container">
            <div className="section-header reveal">
              <div className="eyebrow">06 — Investment</div>
              <div className="section-title-wrap">
                <div className="section-number">06</div>
                <h2 className="section-title display">{sectionTitle}</h2>
              </div>
              {sectionSubtitle && (
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)', maxWidth: '680px', lineHeight: '1.7' }}>
                  {sectionSubtitle}
                </p>
              )}
            </div>

            {hasPricingCards ? (
              <div className="reveal">
                {/* ── Package Cards (radio — one at a time) ── */}
                {packages.length > 0 && (
                  <>
                    <div className="pricing-section-label" style={{ marginBottom: '20px' }}>{packagesLabel}</div>
                    <div className="pricing-cards-grid">
                      {packages.map((pkg: any) => {
                        const isSelected = selectedPackageId === pkg.id
                        const isRecommended = pkg.badge === 'Recommended'
                        return (
                          <div
                            key={pkg.id}
                            className={`pricing-card${isSelected ? ' pricing-card--selected pricing-card--mandatory' : ''}`}
                            onClick={() => selectPackage(pkg.id)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && selectPackage(pkg.id)}
                            style={{ cursor: 'pointer', position: 'relative' }}
                          >
                            {/* Overlay selector top-left */}
                            <div className={`pricing-card-selector${isSelected ? ' selected' : ''}`}>
                              {isSelected ? '✓' : '○'}
                            </div>

                            {/* Badge top-right */}
                            {pkg.badge && (
                              <div className="pricing-card-badge-stack">
                                <div className="pricing-card-badge-corner" style={{
                                  background: isRecommended ? 'var(--accent)' : 'transparent',
                                  color: isRecommended ? 'var(--bg)' : 'var(--text-dim)',
                                  border: isRecommended ? 'none' : '1px solid var(--border)'
                                }}>{pkg.badge}</div>
                              </div>
                            )}

                            <div className="pricing-card-name" style={{ marginTop: '32px' }}>{pkg.name}</div>
                            <div className="pricing-card-price">
                              <span className="pricing-card-amount">${pkg.price.toLocaleString()}</span>
                              <span className="pricing-card-period"> {pkg.currency}/{pkg.period}</span>
                              {pkg.plusTax && <span className="pricing-card-tax"> + GST</span>}
                            </div>
                            <p className="pricing-card-desc">{pkg.description}</p>
                            <div className="pricing-card-deliverables">
                              {pkg.deliverables.map((group: any, gi: number) => (
                                <div key={gi} className="pricing-deliverable-group">
                                  <div className="pricing-deliverable-category">{group.category}</div>
                                  <ul className="pricing-deliverable-list">
                                    {group.items.map((item: string, ii: number) => (
                                      <li key={ii}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            {/* Click-to-select button (decorative) */}
                            <div className={`pricing-card-select-btn${isSelected ? ' selected' : ''}`}>
                              <div className="pricing-card-select-btn-inner">
                                {isSelected ? '✓ Selected' : 'Select Package'}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* ── Add-On Cards (radio — one at a time, none default) ── */}
                {addons.length > 0 && (
                  <>
                    <div className="pricing-section-label" style={{ marginTop: '48px' }}>
                      {(() => {
                        const parts = addonsLabel.split(' — ')
                        if (parts.length === 2) {
                          return <>{parts[0]}<span className="pricing-section-label-hint"> — {parts[1]}</span></>
                        }
                        return addonsLabel
                      })()}
                    </div>
                    <div className="pricing-cards-grid">
                      {addons.map((addon: any) => {
                        const isSelected = selectedAddonId === addon.id
                        const isRecommended = addon.badge?.includes('Recommended')
                        return (
                          <div
                            key={addon.id}
                            className={`pricing-card pricing-card--addon${isSelected ? ' pricing-card--selected' : ''}`}
                            onClick={() => toggleAddon(addon.id)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleAddon(addon.id)}
                            style={{ cursor: 'pointer', position: 'relative' }}
                          >
                            {/* Overlay selector top-left */}
                            <div className={`pricing-card-selector${isSelected ? ' selected' : ''}`}>
                              {isSelected ? '✓' : '+'}
                            </div>

                            {/* Stacked badges top-right */}
                            <div className="pricing-card-badge-stack">
                              {isRecommended && (
                                <div className="pricing-card-badge-corner" style={{
                                  background: 'var(--accent)',
                                  color: 'var(--bg)',
                                  border: 'none',
                                  fontSize: '9px'
                                }}>Recommended</div>
                              )}
                              {addon.badge && (
                                <div className="pricing-card-badge-corner" style={{
                                  background: 'transparent',
                                  color: 'var(--text-dim)',
                                  border: '1px solid var(--border)',
                                  fontSize: '9px'
                                }}>Optional</div>
                              )}
                            </div>

                            <div className="pricing-card-name" style={{ marginTop: '32px' }}>{addon.name}</div>
                            <div className="pricing-card-price">
                              <span className="pricing-card-amount">${addon.price.toLocaleString()}</span>
                              <span className="pricing-card-period"> {addon.currency}/{addon.period}</span>
                              {addon.plusTax && <span className="pricing-card-tax"> + GST</span>}
                            </div>
                            <p className="pricing-card-desc">{addon.description}</p>
                            <div className="pricing-card-deliverables">
                              {addon.deliverables.map((group: any, gi: number) => (
                                <div key={gi} className="pricing-deliverable-group">
                                  <div className="pricing-deliverable-category">{group.category}</div>
                                  <ul className="pricing-deliverable-list">
                                    {group.items.map((item: string, ii: number) => (
                                      <li key={ii}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            {/* Click-to-select button (decorative) */}
                            <div className={`pricing-card-select-btn${isSelected ? ' selected' : ''}`}>
                              <div className="pricing-card-select-btn-inner">
                                {isSelected ? '✓ Added' : '+ Add On'}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* ── Commitment Note ── */}
                <div className="pricing-commitment-note">
                  <span className="pricing-commitment-icon">📋</span>
                  <span><strong>3-Month Initial Commitment</strong> — All packages begin with a 3-month commitment period, then convert to flexible month-to-month terms. Billing begins only once your campaign is launched.</span>
                </div>

                {/* ── Total Bar ── */}
                {totalMonthly !== null && (
                  <div className="pricing-total-bar">
                    <div className="pricing-total-label">
                      Total Monthly Investment
                      {selectedAddonId && (() => {
                        const selectedPkg = packages.find((p: any) => p.id === selectedPackageId)
                        const selectedAddon = addons.find((a: any) => a.id === selectedAddonId)
                        return (
                          <span className="pricing-total-breakdown">
                            {' '}({selectedPkg?.name} ${selectedPkg?.price.toLocaleString()} + {selectedAddon?.name} ${selectedAddon?.price.toLocaleString()})
                          </span>
                        )
                      })()}
                    </div>
                    <div className="pricing-total-amount">
                      ${totalMonthly.toLocaleString()} CAD/mo
                      <span className="pricing-total-tax"> + GST</span>
                    </div>
                  </div>
                )}

                {/* ── Confirm Package CTA ── */}
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button
                    className="btn-primary btn-lg"
                    onClick={() => setFunnelOpen(true)}
                  >
                    Confirm Package &amp; Proceed <span className="arrow">→</span>
                  </button>
                  <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    You'll review your selection, sign the agreement, and add billing details in the next steps.
                  </p>
                </div>

                {/* ── Context Notes ── */}
                {(investment as any).roiContext && (
                  <div className="roi-context">
                    <div className="eyebrow" style={{ marginBottom: '16px' }}>Context</div>
                    <p>{(investment as any).roiContext}</p>
                  </div>
                )}
                {(investment as any).exitClause && (
                  <p className="pricing-note" style={{ marginTop: '16px' }}>{(investment as any).exitClause}</p>
                )}
              </div>
            ) : (
              /* ── Legacy table fallback ── */
              <div className="reveal">
                {(investment as any).tiers?.map((tier: any, i: number) => (
                  <div key={i} className="investment-panel active">
                    <table className="pricing-table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Description</th>
                          <th className="price-col">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tier.items.map((item: any, j: number) => (
                          <tr key={j}>
                            <td style={{ fontWeight: 600, color: 'var(--text)' }}>{item.service}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{item.description}</td>
                            <td className="price-col">{item.price}</td>
                          </tr>
                        ))}
                        <tr className="pricing-total-row">
                          <td colSpan={2} style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Total Investment
                          </td>
                          <td className="price-col">{tier.total}</td>
                        </tr>
                      </tbody>
                    </table>
                    {tier.note && <p className="pricing-note">{tier.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CASE STUDIES ── */}
        {caseStudies && caseStudies.length > 0 && (
          <section id="section-casestudies" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="container">
              <div className="section-header reveal">
                <div className="eyebrow">07 — Proof of Work</div>
                <div className="section-title-wrap">
                  <div className="section-number">07</div>
                  <h2 className="section-title display">Case Studies</h2>
                </div>
              </div>
              <div className="case-studies-grid">
                {caseStudies.map((cs, i) => (
                  <div key={i} className="case-study-card reveal">
                    <div className="case-study-service">{cs.service}</div>
                    <div className="case-study-client">{cs.client}</div>
                    <div className="case-study-result">{cs.result}</div>
                    <p className="case-study-desc">{cs.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── NEXT STEPS / CTA ── */}
        <section className="cta-section" id="section-nextsteps">
          <div className="container">
            <div className="cta-inner">
              <div className="eyebrow reveal" style={{ justifyContent: 'center' }}>08 — Next Steps</div>
              <h2 className="cta-title display reveal">
                Let's <span className="accent-word">Get</span><br />Started.
              </h2>
              <p className="cta-closing reveal">{nextSteps.closing}</p>
              <div className="cta-buttons reveal">
                <a href={nextSteps.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  {nextSteps.ctaLabel} <span className="arrow">→</span>
                </a>
                <a href={`mailto:${nextSteps.email}`} className="btn-outline">
                  Email Me
                </a>
              </div>
              <p className="cta-email reveal">
                Or reach me directly at <a href={`mailto:${nextSteps.email}`}>{nextSteps.email}</a>
              </p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="proposal-footer">
          <div className="footer-logo display">cameron gallacher<span>.</span></div>
          <div className="footer-tagline">Digital Marketing Consultant · camgallacher.com</div>
        </footer>
      </main>

      {/* ── Funnel Modal ── */}
      {funnelOpen && (
        <FunnelModal
          selectedPackage={selectedPackageObj}
          selectedAddon={selectedAddonObj}
          totalMonthly={totalMonthly || 0}
          clientName={meta.preparedFor}
          preparedBy={meta.preparedBy}
          onClose={() => setFunnelOpen(false)}
        />
      )}
    </div>
  )
}
