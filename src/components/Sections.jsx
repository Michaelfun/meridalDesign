import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown, Quote } from 'lucide-react'
import { BRAND, EMAIL, FAQ, IMG, PROCESS, PROJECTS, SERVICES, STATS, TEAM, TESTIMONIALS } from '../data'
import { track } from '../analytics'
import { Img, Pill } from './ui'

// Story panel: fades with its own scroll position while the 3D scene plays behind it
export function Chapter({ side = 'left', stage, title, children, tall }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0.2, 0.42, 0.58, 0.8], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 1], [50, -50])
  return (
    <section ref={ref} className={`flex items-center px-6 md:px-12 lg:px-36 ${tall ? 'min-h-[150vh]' : 'min-h-[130vh]'} ${side === 'right' ? 'justify-end lg:pr-16' : ''}`}>
      <motion.div style={{ opacity, y }} className="glass max-w-md rounded-[2rem] p-8">
        <p className="mb-3 text-sm text-clay">{stage}</p>
        <h2 className="font-display text-4xl font-light leading-[1.05] md:text-5xl">{title}</h2>
        <p className="mt-4 leading-relaxed text-ink/75">{children}</p>
      </motion.div>
    </section>
  )
}

// Full-width colour band with a centred content column; alternating bands keep the long page calm
const Wrap = ({ id, bg = '', children, className = '' }) => (
  <section id={id} className={bg}><div className={`mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32 ${className}`}>{children}</div></section>
)
const H2 = ({ children }) => <h2 className="font-display text-5xl font-light leading-[1.02] md:text-6xl">{children}</h2>

export function About() {
  return (
    <Wrap id="about">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Img src={IMG.about} alt="A modern house with large glass walls at dusk" className="aspect-[4/5] rounded-[2rem]" />
        <div>
          <H2>Architects and builders, in one team.</H2>
          <p className="mt-6 max-w-lg leading-relaxed text-ink/75">{BRAND} designs and constructs homes, offices and landscapes. Because the people who draw the building also build it, ideas survive the journey from floor plan to finished space.</p>
          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8">
            {STATS.map(([n, l]) => <div key={l} className="border-t border-ink/20 pt-4"><dt className="font-display text-5xl font-light">{n}</dt><dd className="mt-1 text-sm text-ink/65">{l}</dd></div>)}
          </dl>
        </div>
      </div>
    </Wrap>
  )
}

export function Services() {
  return (
    <div id="services" className="bg-ink text-sand">
      <Wrap>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <H2>What we do</H2>
          <ul>
            {SERVICES.map(([n, t]) => (
              <li key={n} className="grid gap-2 border-t border-sand/20 py-6 md:grid-cols-[1fr_1.3fr] md:gap-8">
                <h3 className="font-display text-3xl">{n}</h3><p className="text-sand/65">{t}</p>
              </li>
            ))}
          </ul>
        </div>
      </Wrap>
    </div>
  )
}

export function Process() {
  return (
    <Wrap id="process">
      <H2>From brief to handover</H2>
      <ol className="mt-14 grid gap-8 md:grid-cols-5">
        {PROCESS.map(([n, t], i) => (
          <li key={n} className="border-t border-ink/25 pt-4">
            <span className="text-sm text-clay">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-2 font-display text-2xl">{n}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{t}</p>
          </li>
        ))}
      </ol>
    </Wrap>
  )
}

export function Projects() {
  const types = ['All', ...new Set(PROJECTS.map((p) => p.type))]
  const [t, setT] = useState('All')
  const list = PROJECTS.filter((p) => t === 'All' || p.type === t)
  return (
    <Wrap id="projects" bg="bg-[#f4efe6]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H2>Selected projects</H2>
        <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
          {types.map((x) => <button key={x} onClick={() => setT(x)} aria-pressed={t === x} className={`rounded-full px-5 py-2 text-sm transition ${t === x ? 'bg-ink text-sand' : 'bg-white/50 hover:bg-white'}`}>{x}</button>)}
        </div>
      </div>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <motion.article layout key={p.name} className="group">
            <Link to={`/projects/${p.slug}`} className="block">
            <Img src={p.img} alt={`${p.name}, ${p.place}`} className="aspect-[4/5] rounded-[2rem] [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105" />
            <div className="mt-4 flex items-baseline justify-between"><h3 className="font-display text-2xl">{p.name}</h3><span className="text-sm text-ink/60">{p.year}</span></div>
            <p className="text-sm text-ink/65">{p.type}, {p.place}</p>
            </Link>
          </motion.article>
        ))}
      </div>
    </Wrap>
  )
}

export function Team() {
  return (
    <Wrap id="team">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H2>The people behind the buildings</H2>
        <p className="max-w-sm text-ink/70">Architects, engineers and builders working as one team, from first sketch to handover.</p>
      </div>
      <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
        {TEAM.map((m) => (
          <li key={m.name}>
            <Img src={m.photo} alt={`Portrait of ${m.name}`} className="aspect-[4/5] rounded-[2rem]" />
            <h3 className="mt-4 font-display text-2xl">{m.name}</h3>
            <p className="text-sm text-ink/65">{m.role}</p>
          </li>
        ))}
      </ul>
    </Wrap>
  )
}

export function Testimonials() {
  return (
    <div id="testimonials" className="bg-[#ddd1c0]">
      <Wrap>
        <H2>What clients say</H2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(([q, n, r, img]) => (
            <figure key={n} className="glass flex flex-col justify-between rounded-[2rem] p-8">
              <Quote size={22} className="text-clay" />
              <blockquote className="mt-6 font-display text-2xl leading-snug">{q}</blockquote>
              <figcaption className="mt-8 flex items-center gap-3"><Img src={img} alt="" className="h-11 w-11 rounded-full" /><span className="text-sm">{n}<span className="block text-ink/60">{r}</span></span></figcaption>
            </figure>
          ))}
        </div>
      </Wrap>
    </div>
  )
}

export function Faq() {
  return (
    <Wrap id="faq" bg="bg-[#f4efe6]">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
        <H2>Questions</H2>
        <div>
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-t border-ink/20 py-5 last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl">{q}<ChevronDown className="shrink-0 transition group-open:rotate-180" /></summary>
              <p className="mt-3 max-w-xl leading-relaxed text-ink/70">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </Wrap>
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
  const field = 'w-full rounded-2xl border border-ink/20 bg-white/60 px-5 py-3.5 outline-none transition focus:border-clay'
  return (
    <div id="contact" className="bg-[#ddd1c0]">
      <Wrap>
        <div className="grid gap-12 lg:grid-cols-2">
          <div><H2>Let’s build something worth coming home to.</H2><p className="mt-6 max-w-sm text-ink/70">Tell us about your plot and your plans. We reply within two working days.</p></div>
          <form onSubmit={submit} className="grid gap-4" noValidate={false}>
            <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <label className="grid gap-1.5 text-sm">Name<input name="name" required autoComplete="name" className={field} /></label>
            <label className="grid gap-1.5 text-sm">Email<input name="email" type="email" required autoComplete="email" className={field} /></label>
            <label className="grid gap-1.5 text-sm">Project type<select name="type" className={field}>{['Residential', 'Commercial', 'Interiors', 'Landscape'].map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm">Message<textarea name="message" required minLength={10} rows={4} className={field} /></label>
            <button disabled={state === 'sending'} className="w-fit rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-sand transition hover:bg-clay disabled:opacity-60">{state === 'sending' ? 'Sending…' : 'Send enquiry'}</button>
            <p role="status" className="text-sm">{state === 'done' && 'Thank you. We will be in touch within two working days.'}{state === 'error' && 'Something went wrong. Please email us directly.'}</p>
          </form>
        </div>
      </Wrap>
    </div>
  )
}

const SOCIAL = [['Instagram', 'https://www.instagram.com'], ['LinkedIn', 'https://www.linkedin.com'], ['Pinterest', 'https://www.pinterest.com']]

export function Footer() {
  const cols = [
    ['Studio', [['About', '/#about'], ['Team', '/#team'], ['Process', '/#process'], ['FAQ', '/#faq'], ['Contact', '/#contact']]],
    ['Projects', PROJECTS.slice(0, 5).map((p) => [p.name, `/projects/${p.slug}`])],
  ]
  return (
    <footer className="bg-ink text-sand">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-12">
        <div><p className="font-display text-4xl italic">ML</p><p className="mt-3 max-w-xs text-sm text-sand/60">Architecture, interiors and landscapes, designed and built by one team.</p><a href={`mailto:${EMAIL}`} className="mt-6 inline-block text-sm underline underline-offset-4">{EMAIL}</a></div>
        {cols.map(([h, ls]) => <nav key={h} aria-label={h}><h3 className="text-sm text-sand/50">{h}</h3><ul className="mt-4 grid gap-2.5 text-sm">{ls.map(([l, to]) => <li key={l}><Link to={to} className="hover:text-white">{l}</Link></li>)}</ul></nav>)}
        <nav aria-label="Social"><h3 className="text-sm text-sand/50">Follow</h3><ul className="mt-4 grid gap-2.5 text-sm">{SOCIAL.map(([l, href]) => <li key={l}><a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-white">{l}</a></li>)}</ul></nav>
      </div>
      <div className="mx-auto max-w-7xl border-t border-sand/15 px-6 py-6 text-xs text-sand/50 md:px-12">© 2026 {BRAND}. All rights reserved.</div>
    </footer>
  )
}
