import { lazy, Suspense, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { IMG } from '../data'
import { PMAX, P_TOUR, TOUR_VH } from '../tour'
import Hero from '../components/Hero'
import { About, Chapter, Contact, Faq, Gap, Process, Projects, Services, Team, Testimonials, Tour } from '../components/Sections'

const Scene = lazy(() => import('../Scene'))

export default function Home() {
  const story = useRef(null)
  // 0 = hero (finished building), 1 = inside the house
  const { scrollYProgress: raw } = useScroll({ target: story, offset: ['start start', 'end end'] })
  // The walk-through gets most of the scroll: the first 295vh play hero to door, the rest plays the tour
  const A = 295 / (260 + TOUR_VH)
  const progress = useTransform(raw, [0, A, 1], [0, P_TOUR, PMAX])
  const { scrollYProgress: page } = useScroll()
  const inset = useTransform(progress, [0, 0.06], [20, 0])
  const radius = useTransform(progress, [0, 0.06], [36, 0])
  const fade = useTransform(progress, [0, 0.05], [1, 0])

  return (
    <>
      <img src={IMG.mountains} alt="" aria-hidden="true" className="fixed inset-0 -z-10 h-full w-full object-cover opacity-40 mix-blend-multiply grayscale sepia" />
      <motion.div style={{ scaleX: page }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-clay" />
      <motion.div style={{ top: inset, left: inset, right: inset, bottom: inset, borderRadius: radius }} className="fixed z-0 overflow-hidden bg-[#e3d3bd] shadow-2xl">
        <Suspense fallback={null}><Scene progress={progress} /></Suspense>
      </motion.div>
      <div ref={story}>
        <Hero fade={fade} />
        <Chapter stage="Stage 1: Plan" title="Every building starts as a line on paper.">We measure the plot, listen to how you want to live, and draw the plan until every room earns its place.</Chapter>
        <Chapter side="right" stage="Stage 2: Build" title="Then the walls rise and the roof comes down.">The same team that drew it builds it. Structure, glazing and finishes follow the drawing exactly.</Chapter>
        <Tour progress={progress} />
      </div>
      <div className="relative z-10">
        <Gap /><About /><Gap /><Services /><Process /><Gap /><Projects /><Team /><Gap /><Testimonials /><Faq /><Contact />
      </div>
    </>
  )
}
