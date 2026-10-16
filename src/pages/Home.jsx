import { lazy, Suspense, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { IMG } from '../data'
import Hero from '../components/Hero'
import { About, Chapter, Contact, Faq, Process, Projects, Services, Team, Testimonials } from '../components/Sections'

const Scene = lazy(() => import('../Scene'))

export default function Home() {
  const story = useRef(null)
  const [active, setActive] = useState(true)
  // 0 = hero (finished building), 1 = inside the house
  const { scrollYProgress: progress } = useScroll({ target: story, offset: ['start start', 'end end'] })
  const { scrollYProgress: page } = useScroll()
  const inset = useTransform(progress, [0, 0.06], [20, 0])
  const radius = useTransform(progress, [0, 0.06], [36, 0])
  const fade = useTransform(progress, [0, 0.05], [1, 0])
  useMotionValueEvent(progress, 'change', (v) => setActive(v < 0.999))

  return (
    <>
      <img src={IMG.mountains} alt="" aria-hidden="true" className="fixed inset-0 -z-10 h-full w-full object-cover opacity-40 mix-blend-multiply grayscale sepia" />
      <motion.div style={{ scaleX: page }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-clay" />
      <motion.div style={{ top: inset, left: inset, right: inset, bottom: inset, borderRadius: radius }} className="fixed z-0 overflow-hidden bg-[#e3d3bd] shadow-2xl">
        <Suspense fallback={null}><Scene progress={progress} active={active} /></Suspense>
      </motion.div>
      <div ref={story}>
        <Hero fade={fade} />
        <Chapter stage="Stage 1: Plan" title="Every building starts as a line on paper.">We measure the plot, listen to how you want to live, and draw the plan until every room earns its place.</Chapter>
        <Chapter side="right" stage="Stage 2: Build" title="Then the walls rise and the roof comes down.">The same team that drew it builds it. Structure, glazing and finishes follow the drawing exactly.</Chapter>
        <Chapter tall stage="Stage 3: Live" title="Walk through it before it exists.">Light, materials and furniture are resolved from the start, so the finished rooms feel like the render.</Chapter>
      </div>
      <div className="relative z-10 bg-sand">
        <About /><Services /><Process /><Projects /><Team /><Testimonials /><Faq /><Contact />
      </div>
    </>
  )
}
