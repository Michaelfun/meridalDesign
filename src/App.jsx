import { lazy, Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { initAnalytics, pageview } from './analytics'
import { scroller } from './lenis'
import Nav from './components/Nav'
import Consent from './components/Consent'
import { Footer } from './components/Sections'
import Home from './pages/Home'

const Project = lazy(() => import('./pages/Project'))

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    pageview(pathname + hash)
    const t = setTimeout(() => {
      const el = hash && document.querySelector(hash)
      const l = scroller.lenis
      if (el) l ? l.scrollTo(el) : el.scrollIntoView()
      else l ? l.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0)
    }, 60)
    return () => clearTimeout(t)
  }, [pathname, hash])
  return null
}

const NotFound = () => (
  <div className="grid min-h-screen place-items-center bg-sand px-6 text-center"><div><h1 className="font-display text-6xl">Page not found</h1><Link to="/" className="mt-6 inline-block underline underline-offset-4">Back to home</Link></div></div>
)

export default function App() {
  useEffect(() => {
    initAnalytics()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.08 })
    scroller.lenis = lenis
    let id
    const raf = (t) => { lenis.raf(t); id = requestAnimationFrame(raf) }
    id = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(id); lenis.destroy(); scroller.lenis = null }
  }, [])

  return (
    <>
      <ScrollManager />
      <Nav />
      <main className="relative z-10">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects/:slug" element={<Project />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
      </main>
      <Consent />
    </>
  )
}
