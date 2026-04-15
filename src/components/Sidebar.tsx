import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  label: string
  number: string
}

interface SidebarProps {
  sections: TocItem[]
}

export default function Sidebar({ sections }: SidebarProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id)
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [sections])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileOpen(false)
  }

  const activeLabel = sections.find((s) => s.id === activeId)?.label || 'Contents'

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <nav className="sidebar" aria-label="Proposal navigation">
        {/* Logo */}
        <div className="sidebar-logo display">
          cameron<br />gallacher<span className="sidebar-logo-dot">.</span>
        </div>

        {/* TOC */}
        <ul className="sidebar-toc">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                className={`sidebar-toc-item${activeId === s.id ? ' sidebar-toc-item--active' : ''}`}
                onClick={() => scrollTo(s.id)}
              >
                <span className="sidebar-toc-num">{s.number}</span>
                <span className="sidebar-toc-label">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-contact">
            <a href="mailto:cam@latchedinc.com" className="sidebar-contact-link">cam@latchedinc.com</a>
            <div className="sidebar-socials">
              <a href="https://www.instagram.com/camthemarketer" target="_blank" rel="noopener noreferrer" className="sidebar-social-link" aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                Instagram
              </a>
              <a href="https://linkedin.com/in/camthemarketer/" target="_blank" rel="noopener noreferrer" className="sidebar-social-link" aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
          <div className="sidebar-legal">
            <a href="/privacy-policy" className="sidebar-legal-link">Privacy Policy</a>
            <a href="/cookie-policy" className="sidebar-legal-link">Cookie Policy</a>
            <a href="/terms" className="sidebar-legal-link">Terms</a>
          </div>
          <div className="sidebar-copyright">
            © {new Date().getFullYear()} Cameron Gallacher<br />All Rights Reserved
          </div>
        </div>
      </nav>

      {/* ── Mobile TOC Dropdown ── */}
      <div className="mobile-toc">
        <button
          className="mobile-toc-trigger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
        >
          <span className="mobile-toc-label">{activeLabel}</span>
          <svg
            className={`mobile-toc-chevron${mobileOpen ? ' open' : ''}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {mobileOpen && (
          <ul className="mobile-toc-menu">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  className={`mobile-toc-menu-item${activeId === s.id ? ' active' : ''}`}
                  onClick={() => scrollTo(s.id)}
                >
                  <span className="mobile-toc-menu-num">{s.number}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
