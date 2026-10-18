import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown, Quote } from 'lucide-react'
import { BRAND, EMAIL, FAQ, IMG, PROCESS, PROJECTS, SERVICES, STATS, TEAM, TESTIMONIALS } from '../data'
import { track } from '../analytics'
import { STOPS, TOUR_VH } from '../tour'
import { Img, Pill } from './ui'

/* Sections after the tour are transparent: the finished house keeps orbiting behind them.
   All copy sits on frosted panels so it stays readable over the 3D scene. */
const Panel = ({ children, className = '', dark = false }) => (
  <div className={`rounded-[2rem] border shadow-2xl backdrop-blur-2xl ${dark ? 'border-white/10 bg-[#1f1b17]/82 text-sand' : 'border-white/60 bg-[#f4efe6]/84'} ${className}`}>{children}</div>
)
const Band = ({ id, children }) => <section id={id} className="px-4 py-8 md:px-10 md:py-12"><div className="mx-auto max-w-7xl">{children}</div></section>
const Gap = () => <div aria-hidden="true" className="h-[32vh]" />
const H2 = ({ children, className = '' }) => <h2 className={`font-display text-5xl font-light leading-[1.02] md:text-6xl ${className}`}>{children}</h2>
const Eyebrow = ({ children }) => <p className="mb-4 text-sm tracking-wide text-clay">{children}</p>

// Story panel: fades with its own scroll position while the 3D scene plays behind it
export function Chapter({ side = 'left', stage, title, children }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0.2, 0.42, 0.58, 0.8], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 1], [50, -50])
  return (
    <section ref={ref} className={`flex min-h-[130vh] items-center px-6 md:px-12 lg:px-36 ${side === 'right' ? 'justify-end lg:pr-16' : ''}`}>
      <motion.div style={{ opacity, y }} className="glass max-w-md rounded-[2rem] p-8">
        <p className="mb-3 text-sm text-clay">{stage}</p>
        <h2 className="font-display text-4xl font-light leading-[1.05] md:text-5xl">{title}</h2>
        <p className="mt-4 leading-relaxed text-ink/75">{children}</p>
      </motion.div>
    </section>
  )
}

// Walk-through section: tall scroll area with a sticky caption that follows the camera from room to room
export function Tour({ progress }) {
  const [i, setI] = useState(-1)
  useMotionValueEvent(progress, 'change', (v) => setI(STOPS.reduce((n, s, k) => (v >= s.p ? k : n), -1)))
  const s = STOPS[i]
  return (
    <section style={{ height: `${TOUR_VH}vh` }} className="relative">
      <div className="pointer-events-none sticky top-0 flex h-screen items-end px-6 pb-8 md:px-12 lg:pl-36">
        <AnimatePresence mode="wait">
          {s && (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="glass max-w-sm rounded-[2rem] p-6">
              <p className="text-sm text-clay">{s.stage}</p>
              <h2 className="mt-1 font-display text-3xl font-light leading-tight">{s.label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{s.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export function About() {
  return (
    <Band id="about">
      <Panel className="grid items-center gap-10 p-6 md:p-12 lg:grid-cols-2">
        <Img src={IMG.about} alt="A modern house with large glass walls at dusk" className="aspect-[4/5] rounded-[1.5rem]" />
        <div>
          <Eyebrow>About the studio</Eyebrow>
          <H2>Architects and builders, in one team.</H2>
          <p className="mt-6 max-w-lg leading-relaxed text-ink/75">{BRAND} designs and constructs homes, offices and landscapes. Because the people who draw the building also build it, ideas survive the journey from floor plan to finished space.</p>
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8">
            {STATS.map(([n, l]) => <div key={l} className="border-t border-ink/20 pt-4"><dt className="font-display text-5xl font-light">{n}</dt><dd className="mt-1 text-sm text-ink/65">{l}</dd></div>)}
          </dl>
        </div>
      </Panel>
    </Band>
  )
}

export function Services() {
  return (
    <Band id="services">
      <Panel dark className="grid gap-10 p-6 md:p-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Eyebrow>Services</Eyebrow>
          <H2>What we do</H2>
          <Img src={IMG.services} alt="Architect's drawing table with plans and a scale model" className="mt-8 aspect-[4/3] rounded-[1.5rem]" />
        </div>
        <ul className="self-center">
          {SERVICES.map(([n, t]) => (
            <li key={n} className="grid gap-2 border-t border-sand/20 py-6 md:grid-cols-[1fr_1.3fr] md:gap-8">
              <h3 className="font-display text-3xl">{n}</h3><p className="text-sand/70">{t}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </Band>
  )
}

export function Process() {
  return (
    <Band id="process">
      <Panel className="p-6 md:p-12">
        <div className="grid items-end gap-8 lg:grid-cols-2">
          <div><Eyebrow>How we work</Eyebrow><H2>From brief to handover</H2></div>
          <Img src={IMG.process} alt="Construction crew working on a concrete frame" className="aspect-[16/7] rounded-[1.5rem]" />
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-5">
          {PROCESS.map(([n, t], i) => (
            <li key={n} className="border-t border-ink/25 pt-4">
              <span className="text-sm text-clay">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 font-display text-2xl">{n}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{t}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </Band>
  )
}

export function Projects() {
  const types = ['All', ...new Set(PROJECTS.map((p) => p.type))]
  const [t, setT] = useState('All')
  const list = PROJECTS.filter((p) => t === 'All' || p.type === t)
  return (
    <Band id="projects">
      <Panel className="flex flex-wrap items-end justify-between gap-6 p-6 md:p-10">
        <div><Eyebrow>Portfolio</Eyebrow><H2>Selected projects</H2></div>
        <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
          {types.map((x) => <button key={x} onClick={() => setT(x)} aria-pressed={t === x} className={`rounded-full px-5 py-2 text-sm transition ${t === x ? 'bg-ink text-sand' : 'bg-white/70 hover:bg-white'}`}>{x}</button>)}
        </div>
      </Panel>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <motion.article layout key={p.name} className="group">
            <Panel className="p-3">
              <Link to={`/projects/${p.slug}`} className="block">
                <Img src={p.img} alt={`${p.name}, ${p.place}`} className="aspect-[4/5] rounded-[1.5rem] [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105" />
                <div className="flex items-baseline justify-between px-3 pb-2 pt-4"><h3 className="font-display text-2xl">{p.name}</h3><span className="text-sm text-ink/60">{p.year}</span></div>
                <p className="px-3 pb-2 text-sm text-ink/65">{p.type}, {p.place}</p>
              </Link>
            </Panel>
          </motion.article>
        ))}
      </div>
    </Band>
  )
}

// Team: a centred carousel of portraits, the active one in colour and raised
const PARTNERS = ['Northstone', 'Lumia Glass', 'Verdant Timber', 'Ardent Steel', 'Cobalt Concrete', 'Solis Energy', 'Terra Stone']

export function Team() {
  const n = TEAM.length
  const [a, setA] = useState(Math.min(3, n - 1))
  const [pause, setPause] = useState(false)
  const reduce = useReducedMotion()
  const W = typeof window !== 'undefined' && window.innerWidth < 640 ? 132 : 188
  useEffect(() => {
    if (pause || reduce) return
    const id = setInterval(() => setA((v) => (v + 1) % n), 3600)
    return () => clearInterval(id)
  }, [pause, reduce, n])
  return (
    <Band id="team">
      <Panel className="relative overflow-hidden px-4 py-14 text-center md:px-10 md:py-20">
        <Img src={IMG.team} alt="" className="absolute inset-0 opacity-[0.13]" />
        <div className="relative">
          <Link to="/#contact" className="mx-auto inline-flex items-center gap-3 rounded-full border border-ink/15 bg-white/70 px-4 py-1.5 text-xs">Always looking for great people <span className="border-l border-ink/20 pl-3">Careers →</span></Link>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-light leading-[1.02] md:text-6xl">Meet the architects and builders behind every project</h2>
          <p className="mx-auto mt-5 max-w-xl text-ink/70">Our philosophy is simple: hire great people and give them the resources and support to do their best work.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/#about" className="rounded-full border border-ink/20 bg-white/70 px-6 py-2.5 text-sm">Our story</Link>
            <Link to="/#contact" className="rounded-full bg-ink px-6 py-2.5 text-sm text-sand transition hover:bg-clay">Get in touch</Link>
          </div>

          <div className="relative mx-auto mt-14 h-[330px] overflow-hidden md:h-[390px]" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
            {TEAM.map((m, i) => {
              let d = i - a
              if (d > n / 2) d -= n
              if (d < -n / 2) d += n
              const ad = Math.abs(d)
              return (
                <motion.button key={m.name} onClick={() => setA(i)} aria-label={`${m.name}, ${m.role}`} initial={false}
                  animate={{ x: d * (W + 16), y: d === 0 ? -6 : 22 + ad * 10, scale: d === 0 ? 1.1 : Math.max(0.78, 1 - ad * 0.07), opacity: ad > 3 ? 0 : 1 }}
                  transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                  style={{ width: W, marginLeft: -W / 2, zIndex: 10 - ad }} className="absolute left-1/2 top-4 text-left">
                  <div className={`relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/60 bg-white/50 shadow-xl transition-shadow duration-500 ${d === 0 ? 'shadow-[0_24px_60px_-12px_rgba(155,90,51,0.45)]' : '[&_img]:grayscale'}`}>
                    <Img src={m.photo} alt={`Portrait of ${m.name}`} className="h-full w-full [&_img]:transition [&_img]:duration-700" />
                    <div className="absolute inset-x-2 bottom-2 rounded-2xl border border-white/40 bg-white/60 px-3 py-2 backdrop-blur-md">
                      <p className="truncate text-xs font-medium">{m.name}</p>
                      <p className="truncate text-[11px] text-ink/65">{m.role}</p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          <p className="mt-10 text-xs text-ink/60">Built with trusted partners</p>
          <ul className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-x-9 gap-y-3 font-display text-xl text-ink/55">
            {PARTNERS.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </Panel>
    </Band>
  )
}

export function Testimonials() {
  return (
    <Band id="testimonials">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel className="flex flex-col p-6 md:p-8">
          <Eyebrow>Clients</Eyebrow><H2>What clients say</H2>
          <Img src={IMG.quotes} alt="A finished living room with natural light" className="mt-8 min-h-[260px] flex-1 rounded-[1.5rem]" />
        </Panel>
        <div className="grid gap-6">
          {TESTIMONIALS.map(([q, n, r, img]) => (
            <Panel key={n} className="p-7 md:p-8">
              <figure>
                <Quote size={22} className="text-clay" />
                <blockquote className="mt-4 font-display text-2xl leading-snug md:text-3xl">{q}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3"><Img src={img} alt="" className="h-11 w-11 rounded-full" /><span className="text-sm">{n}<span className="block text-ink/60">{r}</span></span></figcaption>
              </figure>
            </Panel>
          ))}
        </div>
      </div>
    </Band>
  )
}

export function Faq() {
  return (
    <Band id="faq">
      <Panel className="grid gap-10 p-6 md:p-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>FAQ</Eyebrow><H2>Questions</H2>
          <Img src={IMG.faq} alt="A bright modern apartment interior" className="mt-8 aspect-[4/5] rounded-[1.5rem]" />
        </div>
        <div className="self-center">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-t border-ink/20 py-5 last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl">{q}<ChevronDown className="shrink-0 transition group-open:rotate-180" /></summary>
              <p className="mt-3 max-w-xl leading-relaxed text-ink/70">{a}</p>
            </details>
          ))}
        </div>
      </Panel>
    </Band>
  )
}

const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT // e.g. Formspree, or your own API

export function Contact() {
  const [state, setState] = useState('idle')
  const submit = async (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget))
    if (d.company) return // honeypot
    track('contact_submit', { type: d.type })
    setState('sending')
    try {
      if (!ENDPOINT) { window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Project enquiry from ${d.name}`)}&body=${encodeURIComponent(`${d.message}\n\n${d.email}`)}`; setState('done'); return }
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
      setState(r.ok ? 'done' : 'error')
    } catch { setState('error') }
  }
  const field = 'w-full rounded-2xl border border-ink/20 bg-white/80 px-5 py-3.5 outline-none transition focus:border-clay'
  return (
    <Band id="contact">
      <Panel className="grid gap-6 p-4 md:p-6 lg:grid-cols-2">
        <div className="relative min-h-[340px] overflow-hidden rounded-[1.5rem]">
          <Img src={IMG.contact} alt="A modern house with a lit entrance at dusk" className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b17]/90 via-[#1f1b17]/35 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-8 text-sand">
            <h2 className="font-display text-4xl font-light leading-tight md:text-5xl">Let’s build something worth coming home to.</h2>
            <p className="mt-3 max-w-sm text-sand/80">Tell us about your plot and your plans. We reply within two working days.</p>
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-4 p-2 md:p-6">
          <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <label className="grid gap-1.5 text-sm">Name<input name="name" required autoComplete="name" className={field} /></label>
          <label className="grid gap-1.5 text-sm">Email<input name="email" type="email" required autoComplete="email" className={field} /></label>
          <label className="grid gap-1.5 text-sm">Project type<select name="type" className={field}>{['Residential', 'Commercial', 'Interiors', 'Landscape'].map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm">Message<textarea name="message" required minLength={10} rows={4} className={field} /></label>
          <button disabled={state === 'sending'} className="w-fit rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-sand transition hover:bg-clay disabled:opacity-60">{state === 'sending' ? 'Sending…' : 'Send enquiry'}</button>
          <p role="status" className="text-sm">{state === 'done' && 'Thank you. We will be in touch within two working days.'}{state === 'error' && 'Something went wrong. Please email us directly.'}</p>
        </form>
      </Panel>
    </Band>
  )
}

export { Gap }

const SOCIAL = [['Instagram', 'https://www.instagram.com'], ['LinkedIn', 'https://www.linkedin.com'], ['Pinterest', 'https://www.pinterest.com']]

export function Footer() {
  const cols = [
    ['Studio', [['About', '/#about'], ['Team', '/#team'], ['Process', '/#process'], ['FAQ', '/#faq'], ['Contact', '/#contact']]],
    ['Projects', PROJECTS.slice(0, 5).map((p) => [p.name, `/projects/${p.slug}`])],
  ]
  return (
    <footer className="relative mt-10">
      <div className="px-4 md:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/20 shadow-2xl">
          <Img src={IMG.footer} alt="" className="absolute inset-0" />
          <div className="absolute inset-0 bg-[#1f1b17]/75 backdrop-blur-[2px]" />
          <div className="relative flex flex-wrap items-center justify-between gap-6 p-8 text-sand md:p-14">
            <h2 className="max-w-2xl font-display text-4xl font-light leading-tight md:text-6xl">Ready to start your project?</h2>
            <Pill href="/#contact" dark={false}>Talk to our team</Pill>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-white/10 bg-[#1f1b17]/92 text-sand backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-12">
          <div><p className="font-display text-4xl italic">ML</p><p className="mt-3 max-w-xs text-sm text-sand/70">Architecture, interiors and landscapes, designed and built by one team.</p><a href={`mailto:${EMAIL}`} className="mt-6 inline-block text-sm underline underline-offset-4">{EMAIL}</a></div>
          {cols.map(([h, ls]) => <nav key={h} aria-label={h}><h3 className="text-sm text-sand/55">{h}</h3><ul className="mt-4 grid gap-2.5 text-sm">{ls.map(([l, to]) => <li key={l}><Link to={to} className="hover:text-white">{l}</Link></li>)}</ul></nav>)}
          <nav aria-label="Social"><h3 className="text-sm text-sand/55">Follow</h3><ul className="mt-4 grid gap-2.5 text-sm">{SOCIAL.map(([l, href]) => <li key={l}><a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-white">{l}</a></li>)}</ul></nav>
        </div>
        <div className="mx-auto max-w-7xl border-t border-sand/15 px-6 py-6 text-xs text-sand/60 md:px-12">© 2026 {BRAND}. All rights reserved.</div>
      </div>
    </footer>
  )
}
