interface Section {
  heading: string
  body: string[]
}

interface LegalPageProps {
  title: string
  lastUpdated: string
  intro: string
  sections: Section[]
}

export default function LegalPage({ title, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <a href="/" className="legal-back">← camgallacher.com</a>
        <div className="legal-logo display">cameron gallacher<span>.</span></div>
      </div>
      <div className="legal-body">
        <h1 className="legal-title display">{title}</h1>
        <p className="legal-updated">Last updated: {lastUpdated}</p>
        <p className="legal-intro">{intro}</p>
        {sections.map((s, i) => (
          <div key={i} className="legal-section">
            <h2 className="legal-section-heading">{s.heading}</h2>
            {s.body.map((para, j) => (
              <p key={j} className="legal-para">{para}</p>
            ))}
          </div>
        ))}
        <div className="legal-footer-note">
          © {new Date().getFullYear()} Cameron Gallacher. All Rights Reserved.
        </div>
      </div>
    </div>
  )
}
