import { Switch, Route, useLocation, Redirect } from 'wouter'
import { useEffect } from 'react'
import ProposalPage from './pages/ProposalPage'
import PackageReviewPage from './pages/PackageReviewPage'
import AgreementPage from './pages/AgreementPage'
import BillingPage from './pages/BillingPage'
import OnboardingBookingPage from './pages/OnboardingBookingPage'
import OnboardingFormPage from './pages/OnboardingFormPage'
import ThankYouPage from './pages/ThankYouPage'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import CookiePolicy from './pages/CookiePolicy'
import Terms from './pages/Terms'
import PasswordGatePage from './pages/PasswordGatePage'
import AdminPage from './pages/AdminPage'
import ProposalAuthGuard from './components/ProposalAuthGuard'

function ScrollToTop() {
  const [location] = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Root → redirect to /proposal/ password gate */}
        <Route path="/">
          <Redirect to="/proposal/" />
        </Route>

        {/* Password gate landing page */}
        <Route path="/proposal/" component={PasswordGatePage} />

        {/* Admin panel */}
        <Route path="/admin" component={AdminPage} />

        {/* Proposal pages — all guarded by password auth */}
        <Route path="/proposal/:slug">
          {(params: { slug: string }) => (
            <ProposalAuthGuard slug={params.slug || ''}>
              <ProposalPage />
            </ProposalAuthGuard>
          )}
        </Route>
        <Route path="/proposal/:slug/review">
          {(params: { slug: string }) => (
            <ProposalAuthGuard slug={params.slug || ''}>
              <PackageReviewPage />
            </ProposalAuthGuard>
          )}
        </Route>
        <Route path="/proposal/:slug/agreement">
          {(params: { slug: string }) => (
            <ProposalAuthGuard slug={params.slug || ''}>
              <AgreementPage />
            </ProposalAuthGuard>
          )}
        </Route>
        <Route path="/proposal/:slug/billing">
          {(params: { slug: string }) => (
            <ProposalAuthGuard slug={params.slug || ''}>
              <BillingPage />
            </ProposalAuthGuard>
          )}
        </Route>
        <Route path="/proposal/:slug/onboarding">
          {(params: { slug: string }) => (
            <ProposalAuthGuard slug={params.slug || ''}>
              <OnboardingBookingPage />
            </ProposalAuthGuard>
          )}
        </Route>
        <Route path="/proposal/:slug/onboarding-form">
          {(params: { slug: string }) => (
            <ProposalAuthGuard slug={params.slug || ''}>
              <OnboardingFormPage />
            </ProposalAuthGuard>
          )}
        </Route>
        <Route path="/proposal/:slug/thank-you">
          {(params: { slug: string }) => (
            <ProposalAuthGuard slug={params.slug || ''}>
              <ThankYouPage />
            </ProposalAuthGuard>
          )}
        </Route>

        {/* Legal pages */}
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/terms" component={Terms} />

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  )
}
