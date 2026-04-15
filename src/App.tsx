import { Switch, Route, useLocation } from 'wouter'
import { useEffect } from 'react'
import ProposalPage from './pages/ProposalPage'
import PackageReviewPage from './pages/PackageReviewPage'
import AgreementPage from './pages/AgreementPage'
import BillingPage from './pages/BillingPage'
import OnboardingBookingPage from './pages/OnboardingBookingPage'
import OnboardingFormPage from './pages/OnboardingFormPage'
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import PrivacyPolicy from './pages/PrivacyPolicy'
import CookiePolicy from './pages/CookiePolicy'
import Terms from './pages/Terms'

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
        <Route path="/" component={Home} />
        <Route path="/proposal/:slug" component={ProposalPage} />
        <Route path="/proposal/:slug/review" component={PackageReviewPage} />
        <Route path="/proposal/:slug/agreement" component={AgreementPage} />
        <Route path="/proposal/:slug/billing" component={BillingPage} />
        <Route path="/proposal/:slug/onboarding" component={OnboardingBookingPage} />
        <Route path="/proposal/:slug/onboarding-form" component={OnboardingFormPage} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/terms" component={Terms} />
        <Route component={NotFound} />
      </Switch>
    </>
  )
}
