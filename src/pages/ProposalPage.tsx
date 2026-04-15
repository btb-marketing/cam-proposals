import { useParams } from 'wouter'
import { useState, useEffect } from 'react'
import { loadProposal } from '../data/loader'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Proposal, PricingTier } from '../types/proposal'
import NotFound from './NotFound'

export default function ProposalPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const proposal = loadProposal(slug)
  const [activeTab, setActiveTab] = useState(0)

  useScrollReveal()

  useEffect(() => {
    if (proposal) {
      document.title = `${proposal.hero.clientName} — Cameron Gallacher Proposal`
    }
  }, [proposal])

  if (!proposal) return <NotFound />

  const { meta, hero, about, team, overview, keywordAreas, scopeOfWork, deliverables, successMetrics, investment, caseStudies, nextSteps } = proposal

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero">
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
            {hero.tagline.split('\n').map((line, i) =>
              i === 1 ? <span key={i} className="accent-line">{line}</span> : <span key={i} style={{ display: 'block' }}>{line}</span>
            )}
          </h1>

          <p className="hero-subtitle">{hero.subTagline}</p>

          <div className="hero-ctas">
            <a href={meta.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              {meta.ctaLabel} <span className="arrow">→</span>
            </a>
            <a href={`mailto:${nextSteps.email}`} className="btn-outline">
              Ask a Question
            </a>
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
              <div className="eyebrow">{about.heading || 'About Cameron Gallacher'}</div>
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
                  <div className="clients-label">Your Team</div>
                  <div className="team-grid" style={{ marginTop: '16px' }}>
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
      <section className="overview-section">
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
        <section className="keywords-section">
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
        <section className="scope-section">
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
        <section className="deliverables-section">
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
        <section>
          <div className="container">
            <div className="section-header reveal">
              <div className="eyebrow">05 — Success Metrics</div>
              <div className="section-title-wrap">
                <div className="section-number">05</div>
                <h2 className="section-title display">How We Measure Win</h2>
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
      <section className="investment-section">
        <div className="container">
          <div className="section-header reveal">
            <div className="eyebrow">06 — Investment</div>
            <div className="section-title-wrap">
              <div className="section-number">06</div>
              <h2 className="section-title display">Pricing</h2>
            </div>
          </div>

          <div className="reveal">
            {investment.tiers.length > 1 && (
              <div className="investment-tabs">
                {investment.tiers.map((tier, i) => (
                  <button
                    key={i}
                    className={`investment-tab${activeTab === i ? ' active' : ''}`}
                    onClick={() => setActiveTab(i)}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            )}

            {investment.tiers.map((tier: PricingTier, i: number) => (
              <div key={i} className={`investment-panel${activeTab === i || investment.tiers.length === 1 ? ' active' : ''}`}>
                <table className="pricing-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Description</th>
                      <th className="price-col">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tier.items.map((item, j) => (
                      <tr key={j}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{item.service}</td>
                        <td>{item.description || ''}</td>
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

            {investment.roiContext && (
              <div className="roi-context">
                <div className="eyebrow" style={{ marginBottom: '16px' }}>Context</div>
                <p>{investment.roiContext}</p>
              </div>
            )}

            {investment.exitClause && (
              <p className="pricing-note" style={{ marginTop: '16px' }}>{investment.exitClause}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ── */}
      {caseStudies && caseStudies.length > 0 && (
        <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
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
      <section className="cta-section">
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
    </div>
  )
}
