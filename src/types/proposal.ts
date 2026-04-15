export interface TeamMember {
  name: string;
  title: string;
  initials: string;
  photo?: string;
}

export interface PricingTier {
  label: string;
  items: { service: string; price: string; description?: string }[];
  total: string;
  currency?: string;
  note?: string;
}

export interface CaseStudy {
  client: string;
  service: string;
  result: string;
  description: string;
}

export interface ScopeMonth {
  title: string;
  deliverables: string[];
}

export interface KeywordArea {
  keyword: string;
}

export type Brand = 'cameron-gallacher' | 'below-the-board'

export interface Proposal {
  slug: string;
  /** Brand variant — determines consultant name, contact info, favicon, and Calendly link */
  brand?: Brand;
  /** Access password for this proposal (plain text, stored client-side only) */
  password?: string;
  meta: {
    title: string;
    preparedBy: string;
    preparedFor: string;
    date: string;
    ctaUrl: string;
    ctaLabel: string;
  };
  hero: {
    clientName: string;
    tagline: string;
    subTagline: string;
  };
  about: {
    heading?: string;
    description: string;
    notableClients: string[];
  };
  team: TeamMember[];
  overview: {
    headline: string;
    subheadline: string;
    objectives: string[];
    strategy: {
      title: string;
      description: string;
    }[];
  };
  keywordAreas?: {
    intro: string;
    keywords: string[];
  };
  scopeOfWork?: {
    months: ScopeMonth[];
  };
  deliverables?: string[];
  successMetrics?: string[];
  investment: {
    tiers: PricingTier[];
    roiContext?: string;
    exitClause?: string;
  };
  caseStudies: CaseStudy[];
  nextSteps: {
    closing: string;
    ctaUrl: string;
    ctaLabel: string;
    email: string;
  };
}
