import { useEffect, useRef } from 'react'
import { useParams, useSearch, useLocation } from 'wouter'
import { loadProposal } from '../data/loader'

// Confetti particle system
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  shape: 'rect' | 'circle' | 'star'
  opacity: number
  life: number
}

const COLORS = ['#c6f135', '#ffffff', '#a0d020', '#e8ff80', '#f0f0f0', '#d4f060', '#b8e820']

function createParticle(canvasWidth: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: -20,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
    opacity: 1,
    life: 1,
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const spikes = 5
  const outerRadius = size
  const innerRadius = size / 2
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes
  ctx.beginPath()
  ctx.moveTo(x, y - outerRadius)
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius)
    rot += step
    ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius)
    rot += step
  }
  ctx.lineTo(x, y - outerRadius)
  ctx.closePath()
  ctx.fill()
}

export default function ThankYouPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const search = useSearch()
  const [, navigate] = useLocation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const spawnTimerRef = useRef<number>(0)

  const proposal = loadProposal(slug)
  const searchParams = new URLSearchParams(search)
  const clientName = searchParams.get('name') || proposal?.meta?.preparedFor || 'there'
  const firstName = clientName.split(' ')[0]
  const pkgId = searchParams.get('pkg') || ''
  const addonId = searchParams.get('addon') || ''

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let lastTime = 0
    let elapsed = 0

    const animate = (time: number) => {
      const dt = time - lastTime
      lastTime = time
      elapsed += dt

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn particles for the first 4 seconds
      if (elapsed < 4000) {
        spawnTimerRef.current += dt
        const spawnRate = elapsed < 1500 ? 3 : 1
        if (spawnTimerRef.current > 30 / spawnRate) {
          spawnTimerRef.current = 0
          for (let i = 0; i < spawnRate; i++) {
            particlesRef.current.push(createParticle(canvas.width))
          }
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08 // gravity
        p.vx *= 0.99 // air resistance
        p.rotation += p.rotationSpeed
        p.life -= 0.004

        if (p.y > canvas.height + 20 || p.life <= 0) return false

        ctx.save()
        ctx.globalAlpha = Math.min(p.life * 2, 1)
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          drawStar(ctx, 0, 0, p.size / 2)
        }

        ctx.restore()
        return true
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="thankyou-page">
      {/* Confetti canvas */}
      <canvas ref={canvasRef} className="thankyou-confetti" />

      {/* Content */}
      <div className="thankyou-content">
        {/* Logo */}
        <div className="thankyou-logo display">CG.</div>

        {/* Checkmark badge */}
        <div className="thankyou-badge">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#c6f135" />
            <path d="M14 24.5L21 31.5L34 17" stroke="#0d0d0d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Headline */}
        <h1 className="thankyou-headline display">
          You're all set,<br />{firstName}!
        </h1>

        {/* Subheadline */}
        <p className="thankyou-subheadline">
          Welcome aboard. Your onboarding is complete and your campaign is being prepared.
          <br />
          Expect to hear from Cameron within <strong>24 hours</strong> to confirm your launch date.
        </p>

        {/* What's next cards */}
        <div className="thankyou-next-steps">
          <div className="thankyou-next-step">
            <div className="thankyou-next-step-num display">01</div>
            <div className="thankyou-next-step-body">
              <div className="thankyou-next-step-title">Onboarding Call</div>
              <div className="thankyou-next-step-desc">Your onboarding call is booked. Cameron will review your goals, access, and strategy before launch.</div>
            </div>
          </div>
          <div className="thankyou-next-step">
            <div className="thankyou-next-step-num display">02</div>
            <div className="thankyou-next-step-body">
              <div className="thankyou-next-step-title">Campaign Setup</div>
              <div className="thankyou-next-step-desc">Keyword research, technical audit, and content strategy are prepared. You'll receive a campaign roadmap before launch.</div>
            </div>
          </div>
          <div className="thankyou-next-step">
            <div className="thankyou-next-step-num display">03</div>
            <div className="thankyou-next-step-body">
              <div className="thankyou-next-step-title">Campaign Launch</div>
              <div className="thankyou-next-step-desc">Your SEO campaign goes live. Monthly Looker Studio reports and strategy calls keep you in the loop every step of the way.</div>
            </div>
          </div>
        </div>

        {/* Contact line */}
        <p className="thankyou-contact">
          Questions? Reach out anytime at{' '}
          <a href="mailto:cam@latchedinc.com" className="thankyou-email">cam@latchedinc.com</a>
        </p>

        {/* Back to proposal */}
        <button
          className="thankyou-back-btn"
          onClick={() => navigate(`/proposal/${slug}`)}
        >
          ← Back to Proposal
        </button>
      </div>

      {/* Footer */}
      <div className="thankyou-footer">
        <span className="display">cameron gallacher.</span>
        <span className="thankyou-footer-sep">·</span>
        <span>© {new Date().getFullYear()} Cameron Gallacher · All Rights Reserved</span>
      </div>
    </div>
  )
}
