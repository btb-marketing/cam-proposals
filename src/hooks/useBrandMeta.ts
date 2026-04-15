/**
 * useBrandMeta — sets document title, favicon, noindex meta, and meta description
 * based on the proposal brand field ("cameron-gallacher" | "below-the-board").
 */
import { useEffect } from 'react'
import type { Brand } from '../types/proposal'

interface BrandMetaOptions {
  brand?: Brand | string
  pageTitle: string
  description?: string
}

const BRAND_CONFIG: Record<string, { suffix: string; favicon: string; defaultDesc: string }> = {
  'cameron-gallacher': {
    suffix: 'Cameron Gallacher Consulting',
    favicon: '/favicon-cg.png',
    defaultDesc:
      'Your personalized SEO proposal from Cameron Gallacher Consulting. Review your custom strategy, investment options, and next steps.',
  },
  'below-the-board': {
    suffix: 'Below the Board Marketing',
    favicon: '/favicon-btb.png',
    defaultDesc:
      'Your personalized digital marketing proposal from Below the Board Marketing. Review your custom strategy, investment options, and next steps.',
  },
}

const PAGE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  'cameron-gallacher': {
    Proposal:
      'Review your custom SEO strategy from Cameron Gallacher Consulting. Explore keyword opportunities, scope of work, investment options, and real client case studies.',
    'Review Your Package':
      'Confirm your selected SEO package and add-ons before proceeding to the service agreement with Cameron Gallacher Consulting.',
    'Marketing Agreement':
      'Review and sign your digital marketing services agreement with Cameron Gallacher Consulting. Secure, fast, and fully digital.',
    'Billing & Payment':
      'Complete your enrollment by securely entering your payment details. Your subscription will be set up through Cameron Gallacher Consulting.',
    'Book Your Onboarding Call':
      'Schedule your onboarding call with Cameron Gallacher to kick off your SEO campaign and align on strategy.',
    'Onboarding Form':
      'Complete your onboarding form to help Cameron Gallacher Consulting prepare your custom SEO campaign.',
    'Welcome Aboard':
      "You're all set! Your onboarding with Cameron Gallacher Consulting is complete. Here's what happens next.",
  },
  'below-the-board': {
    Proposal:
      'Review your custom digital marketing strategy from Below the Board Marketing. Explore keyword opportunities, scope of work, investment options, and real client case studies.',
    'Review Your Package':
      'Confirm your selected marketing package and add-ons before proceeding to the service agreement with Below the Board Marketing.',
    'Marketing Agreement':
      'Review and sign your digital marketing services agreement with Below the Board Marketing. Secure, fast, and fully digital.',
    'Billing & Payment':
      'Complete your enrollment by securely entering your payment details. Your subscription will be set up through Below the Board Marketing.',
    'Book Your Onboarding Call':
      'Schedule your onboarding call with Below the Board Marketing to kick off your campaign and align on strategy.',
    'Onboarding Form':
      'Complete your onboarding form to help Below the Board Marketing prepare your custom campaign.',
    'Welcome Aboard':
      "You're all set! Your onboarding with Below the Board Marketing is complete. Here's what happens next.",
  },
}

export function useBrandMeta({ brand = 'cameron-gallacher', pageTitle, description }: BrandMetaOptions) {
  useEffect(() => {
    const cfg = BRAND_CONFIG[brand] ?? BRAND_CONFIG['cameron-gallacher']

    // 1. Document title
    document.title = `${pageTitle} | ${cfg.suffix}`

    // 2. Favicon
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/png'
    link.href = cfg.favicon

    // 3. noindex
    let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.name = 'robots'
      document.head.appendChild(robotsMeta)
    }
    robotsMeta.content = 'noindex, nofollow'

    // 4. Meta description
    const desc = description ?? PAGE_DESCRIPTIONS[brand]?.[pageTitle] ?? cfg.defaultDesc
    let descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!descMeta) {
      descMeta = document.createElement('meta')
      descMeta.name = 'description'
      document.head.appendChild(descMeta)
    }
    descMeta.content = desc

    // 5. OG tags
    const setOg = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.content = content
    }
    setOg('og:title', `${pageTitle} | ${cfg.suffix}`)
    setOg('og:description', desc)
    setOg('og:type', 'website')
  }, [brand, pageTitle, description])
}
