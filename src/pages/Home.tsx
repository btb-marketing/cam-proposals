export default function Home() {
  return (
    <div className="not-found">
      <h1 style={{ fontSize: '80px', marginBottom: '8px' }}>CG</h1>
      <p>Proposal platform — enter a proposal URL to get started.</p>
      <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '8px' }}>
        e.g. <span style={{ color: 'var(--accent)' }}>/proposal/client-name</span>
      </p>
    </div>
  )
}
