import { Switch, Route, useLocation } from 'wouter'
import { useEffect } from 'react'
import ProposalPage from './pages/ProposalPage'
import NotFound from './pages/NotFound'
import Home from './pages/Home'

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
        <Route component={NotFound} />
      </Switch>
    </>
  )
}
